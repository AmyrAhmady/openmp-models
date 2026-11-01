import { useCallback, useEffect, useRef, useState } from 'react';
import { CATALOG_PAGE_SIZE } from 'src/catalog/catalogConstants';
import { isAbortError } from 'src/catalog/catalogQuery';
import { textureClient } from 'src/catalog/textureClient';
import type { CatalogQueryStatus } from 'src/hooks/useCatalogQuery';
import { normalizeSearchText } from 'src/domain/search';
import type { TextureListItem } from 'src/domain/textureCatalog';

export interface TextureQueryState {
    list: TextureListItem[];
    searchInput: string;
    status: CatalogQueryStatus;
    error: string | null;
    hasMore: boolean;
    loadMoreError: string | null;
}

export interface UseTextureQueryResult extends TextureQueryState {
    search: (query: string) => void;
    clearSearch: () => void;
    loadMore: () => void;
    retry: () => void;
}

const LOAD_ERROR_MESSAGE =
    'The texture list could not be loaded. Check your connection and try again.';

export function useTextureQuery(enabled: boolean): UseTextureQueryResult {
    const fullList = useRef<TextureListItem[]>([]);
    const hasMore = useRef(false);
    const requestGeneration = useRef(0);
    const activeRequest = useRef<AbortController | null>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const [state, setState] = useState<TextureQueryState>({
        list: [],
        searchInput: '',
        status: 'idle',
        error: null,
        hasMore: false,
        loadMoreError: null,
    });

    const startRequest = useCallback(() => {
        activeRequest.current?.abort();
        if (searchTimer.current) {
            clearTimeout(searchTimer.current);
            searchTimer.current = undefined;
        }

        const controller = new AbortController();
        activeRequest.current = controller;
        return { generation: ++requestGeneration.current, signal: controller.signal };
    }, []);

    const loadPage = useCallback(
        (offset: number) => {
            const { generation, signal } = startRequest();
            setState((current) => ({
                ...current,
                status: 'loading',
                error: null,
                loadMoreError: null,
            }));

            textureClient
                .listPage(offset, CATALOG_PAGE_SIZE, signal)
                .then(({ list }) => {
                    if (generation !== requestGeneration.current) {
                        return;
                    }

                    fullList.current = offset === 0 ? list : [...fullList.current, ...list];
                    hasMore.current = list.length === CATALOG_PAGE_SIZE;
                    setState({
                        list: fullList.current,
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

                    setState((current) =>
                        offset === 0
                            ? { ...current, list: [], status: 'error', error: LOAD_ERROR_MESSAGE }
                            : { ...current, status: 'ready', loadMoreError: LOAD_ERROR_MESSAGE }
                    );
                });
        },
        [startRequest]
    );

    useEffect(() => {
        if (enabled && state.status === 'idle') {
            loadPage(0);
        }
    }, [enabled, loadPage, state.status]);

    useEffect(
        () => () => {
            requestGeneration.current++;
            activeRequest.current?.abort();
            if (searchTimer.current) {
                clearTimeout(searchTimer.current);
            }
        },
        []
    );

    const search = useCallback(
        (query: string) => {
            const normalizedQuery = normalizeSearchText(query.trim());
            const { generation, signal } = startRequest();

            if (!normalizedQuery) {
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

            searchTimer.current = setTimeout(() => {
                searchTimer.current = undefined;
                textureClient
                    .search(normalizedQuery, signal)
                    .then(({ results }) => {
                        if (generation !== requestGeneration.current) {
                            return;
                        }

                        setState({
                            list: results,
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
                            status: 'error',
                            error: LOAD_ERROR_MESSAGE,
                        }));
                    });
            }, 180);
        },
        [startRequest]
    );

    const clearSearch = useCallback(() => search(''), [search]);

    const loadMore = useCallback(() => {
        if (!hasMore.current || state.searchInput.trim() || state.status !== 'ready') {
            return;
        }

        loadPage(fullList.current.length);
    }, [loadPage, state.searchInput, state.status]);

    const retry = useCallback(() => {
        if (state.searchInput.trim()) {
            search(state.searchInput);
        } else {
            loadPage(state.loadMoreError ? fullList.current.length : 0);
        }
    }, [loadPage, search, state.loadMoreError, state.searchInput]);

    return { ...state, search, clearSearch, loadMore, retry };
}
