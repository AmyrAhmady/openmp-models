import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATALOG_PAGE_SIZE } from 'src/catalog/catalogConstants';
import type { CatalogListItem, ModelType } from 'src/domain/catalog';
import { CatalogQueryController, isAbortError } from 'src/catalog/catalogQuery';
import { catalogClient } from 'src/catalog/catalogClient';
import { normalizeSearchText } from 'src/domain/search';

export type CatalogQueryStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface CatalogQueryState {
    list: CatalogListItem[];
    searchInput: string;
    status: CatalogQueryStatus;
    error: string | null;
    hasMore: boolean;
    loadMoreError: string | null;
}

export interface CatalogQueryActions {
    search: (query: string) => void;
    clearSearch: () => void;
    loadMore: () => void;
    retry: () => void;
}

export interface UseCatalogQueryResult extends CatalogQueryState, CatalogQueryActions {}

const LOAD_ERROR_MESSAGE =
    'The model list could not be loaded. Check your connection and try again.';

export function useCatalogQuery(modelType: ModelType): UseCatalogQueryResult {
    const controller = useMemo(() => new CatalogQueryController(modelType, catalogClient), []);
    const fullList = useRef<CatalogListItem[]>([]);
    const hasMore = useRef(false);
    const requestGeneration = useRef(0);
    const [state, setState] = useState<CatalogQueryState>({
        list: [],
        searchInput: '',
        status: 'idle',
        error: null,
        hasMore: false,
        loadMoreError: null,
    });

    const loadList = useCallback(() => {
        const generation = ++requestGeneration.current;
        controller.cancelList();
        controller.cancelSearch();
        controller.setModelType(modelType);
        fullList.current = [];
        hasMore.current = false;
        setState((current) => ({
            ...current,
            list: [],
            searchInput: '',
            status: 'loading',
            error: null,
            hasMore: false,
            loadMoreError: null,
        }));

        const listRequest =
            modelType === 'object'
                ? controller.loadListPage(0, CATALOG_PAGE_SIZE)
                : controller.loadList();

        listRequest
            .then((list) => {
                if (generation !== requestGeneration.current) {
                    return;
                }

                fullList.current = list;
                hasMore.current = modelType === 'object' && list.length === CATALOG_PAGE_SIZE;
                setState({
                    list,
                    searchInput: '',
                    status: 'ready',
                    error: null,
                    hasMore: hasMore.current,
                    loadMoreError: null,
                });
            })
            .catch((error: unknown) => {
                if (generation !== requestGeneration.current || isAbortError(error)) {
                    return;
                }

                setState((current) => ({
                    ...current,
                    list: [],
                    status: 'error',
                    error: LOAD_ERROR_MESSAGE,
                    hasMore: false,
                    loadMoreError: null,
                }));
            });
    }, [controller, modelType]);

    useEffect(() => {
        controller.setModelType(modelType);
        loadList();

        return () => {
            requestGeneration.current++;
            controller.cancelList();
            controller.cancelSearch();
        };
    }, [controller, loadList, modelType]);

    useEffect(() => () => controller.dispose(), [controller]);

    const search = useCallback(
        (query: string) => {
            const normalizedQuery = normalizeSearchText(query.trim());
            const generation = ++requestGeneration.current;

            if (!normalizedQuery) {
                controller.cancelSearch();
                setState({
                    list: fullList.current,
                    searchInput: '',
                    status: 'ready',
                    error: null,
                    hasMore: hasMore.current,
                    loadMoreError: null,
                });
                return;
            }

            setState((current) => ({
                ...current,
                list: [],
                searchInput: query,
                status: 'loading',
                error: null,
                hasMore: false,
                loadMoreError: null,
            }));

            controller
                .search(normalizedQuery)
                .then((list) => {
                    if (generation !== requestGeneration.current) {
                        return;
                    }

                    setState({
                        list,
                        searchInput: query,
                        status: 'ready',
                        error: null,
                        hasMore: false,
                        loadMoreError: null,
                    });
                })
                .catch((error: unknown) => {
                    if (generation !== requestGeneration.current || isAbortError(error)) {
                        return;
                    }

                    setState((current) => ({
                        ...current,
                        list: [],
                        status: 'error',
                        error: LOAD_ERROR_MESSAGE,
                        hasMore: false,
                        loadMoreError: null,
                    }));
                });
        },
        [controller]
    );

    const clearSearch = useCallback(() => search(''), [search]);

    const loadMore = useCallback(() => {
        if (
            modelType !== 'object' ||
            !hasMore.current ||
            state.searchInput.trim() ||
            state.status !== 'ready'
        ) {
            return;
        }

        const generation = ++requestGeneration.current;
        const offset = fullList.current.length;
        setState((current) => ({
            ...current,
            status: 'loading',
            error: null,
            loadMoreError: null,
        }));

        controller
            .loadListPage(offset, CATALOG_PAGE_SIZE)
            .then((page) => {
                if (generation !== requestGeneration.current) {
                    return;
                }

                fullList.current = [...fullList.current, ...page];
                hasMore.current = page.length === CATALOG_PAGE_SIZE;
                setState((current) => ({
                    ...current,
                    list: fullList.current,
                    status: 'ready',
                    error: null,
                    hasMore: hasMore.current,
                    loadMoreError: null,
                }));
            })
            .catch((error: unknown) => {
                if (generation !== requestGeneration.current || isAbortError(error)) {
                    return;
                }

                setState((current) => ({
                    ...current,
                    status: 'ready',
                    error: null,
                    loadMoreError: LOAD_ERROR_MESSAGE,
                }));
            });
    }, [controller, modelType, state.searchInput, state.status]);

    const retry = useCallback(() => {
        if (state.searchInput.trim()) {
            search(state.searchInput);
        } else if (state.loadMoreError) {
            loadMore();
        } else {
            loadList();
        }
    }, [loadList, loadMore, search, state.loadMoreError, state.searchInput]);

    return { ...state, search, clearSearch, loadMore, retry };
}
