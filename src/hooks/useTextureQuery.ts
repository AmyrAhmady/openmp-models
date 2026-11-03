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

    const loadSearchPage = useCallback(
        (query: string, offset: number) => {
            const { generation, signal } = startRequest();
            setState((current) => ({
                ...current,
                status: 'loading',
                error: null,
                loadMoreError: null,
            }));

            textureClient
                .search(query, offset, CATALOG_PAGE_SIZE, signal)
                .then(({ results }) => {
                    if (generation !== requestGeneration.current) {
                        return;
                    }

                    setState((current) => ({
                        ...current,
                        list: offset === 0 ? results : [...current.list, ...results],
                        status: 'ready',
                        error: null,
                        hasMore: results.length === CATALOG_PAGE_SIZE,
                        loadMoreError: null,
                    }));
                })
                .catch((error: unknown) => {
                    if (generation !== requestGeneration.current || isAbortError(error)) {
                        return;
                    }

                    setState((current) =>
                        offset === 0
                            ? { ...current, status: 'error', error: LOAD_ERROR_MESSAGE }
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
            startRequest();

            if (!normalizedQuery && !fullList.current.length) {
                loadPage(0);
                return;
            }

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
                loadSearchPage(normalizedQuery, 0);
            }, 180);
        },
        [loadPage, loadSearchPage, startRequest]
    );

    const clearSearch = useCallback(() => search(''), [search]);

    const loadMore = useCallback(() => {
        if (!state.hasMore || state.status !== 'ready') {
            return;
        }

        const query = normalizeSearchText(state.searchInput.trim());
        if (query) {
            loadSearchPage(query, state.list.length);
        } else {
            loadPage(fullList.current.length);
        }
    }, [
        loadPage,
        loadSearchPage,
        state.hasMore,
        state.list.length,
        state.searchInput,
        state.status,
    ]);

    const retry = useCallback(() => {
        const query = normalizeSearchText(state.searchInput.trim());
        if (query && state.loadMoreError) {
            loadSearchPage(query, state.list.length);
        } else if (query) {
            search(state.searchInput);
        } else {
            loadPage(state.loadMoreError ? fullList.current.length : 0);
        }
    }, [
        loadPage,
        loadSearchPage,
        search,
        state.list.length,
        state.loadMoreError,
        state.searchInput,
    ]);

    return { ...state, search, clearSearch, loadMore, retry };
}
