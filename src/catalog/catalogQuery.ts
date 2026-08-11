import type {
    CatalogListResponse,
    CatalogListItem,
    CatalogSearchResponse,
    ModelType,
} from 'src/domain/catalog';

export interface CatalogQueryClient {
    list(type: ModelType, signal?: AbortSignal): Promise<CatalogListResponse>;
    listPage(
        type: ModelType,
        offset: number,
        limit: number,
        signal?: AbortSignal
    ): Promise<CatalogListResponse>;
    search(type: ModelType, query: string, signal?: AbortSignal): Promise<CatalogSearchResponse>;
}

function createAbortError(): Error {
    const error = new Error('Catalog request was cancelled');
    error.name = 'AbortError';
    return error;
}

export function isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
}

export class CatalogQueryController {
    private modelType: ModelType;
    private listRequest: AbortController | undefined;
    private searchRequest: AbortController | undefined;
    private searchTimer: ReturnType<typeof setTimeout> | undefined;
    private rejectPendingSearch: ((error: Error) => void) | undefined;
    private readonly client: CatalogQueryClient;

    constructor(modelType: ModelType, client: CatalogQueryClient) {
        this.modelType = modelType;
        this.client = client;
    }

    setModelType(modelType: ModelType): void {
        if (this.modelType === modelType) {
            return;
        }

        this.modelType = modelType;
        this.cancelList();
        this.cancelSearch();
    }

    loadList(): Promise<CatalogListItem[]> {
        this.cancelList();
        const controller = new AbortController();
        this.listRequest = controller;

        return this.client
            .list(this.modelType, controller.signal)
            .then((response) => response.list)
            .finally(() => {
                if (this.listRequest === controller) {
                    this.listRequest = undefined;
                }
            });
    }

    loadListPage(offset: number, limit: number): Promise<CatalogListItem[]> {
        this.cancelList();
        const controller = new AbortController();
        this.listRequest = controller;

        return this.client
            .listPage(this.modelType, offset, limit, controller.signal)
            .then((response) => response.list)
            .finally(() => {
                if (this.listRequest === controller) {
                    this.listRequest = undefined;
                }
            });
    }

    search(query: string): Promise<CatalogListItem[]> {
        this.cancelSearch();

        return new Promise<CatalogListItem[]>((resolve, reject) => {
            this.rejectPendingSearch = reject;
            this.searchTimer = setTimeout(() => {
                this.searchTimer = undefined;
                this.rejectPendingSearch = undefined;
                const controller = new AbortController();
                this.searchRequest = controller;

                this.client
                    .search(this.modelType, query, controller.signal)
                    .then((response) => resolve(response.results), reject)
                    .finally(() => {
                        if (this.searchRequest === controller) {
                            this.searchRequest = undefined;
                        }
                    });
            }, 180);
        });
    }

    cancelList(): void {
        this.listRequest?.abort();
        this.listRequest = undefined;
    }

    cancelSearch(): void {
        if (this.searchTimer) {
            clearTimeout(this.searchTimer);
            this.searchTimer = undefined;
        }

        this.rejectPendingSearch?.(createAbortError());
        this.rejectPendingSearch = undefined;
        this.searchRequest?.abort();
        this.searchRequest = undefined;
    }

    dispose(): void {
        this.cancelList();
        this.cancelSearch();
    }
}
