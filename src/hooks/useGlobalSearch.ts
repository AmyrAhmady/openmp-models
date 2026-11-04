import { useCallback, useEffect, useRef, useState } from 'react';
import { catalogClient } from 'src/catalog/catalogClient';
import type { GlobalSearchResponse } from 'src/domain/globalSearch';
import { normalizeSearchText } from 'src/domain/search';

export type GlobalSearchStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface UseGlobalSearchResult {
    query: string;
    results: GlobalSearchResponse | null;
    status: GlobalSearchStatus;
    search: (query: string) => void;
}

export function useGlobalSearch(): UseGlobalSearchResult {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<GlobalSearchResponse | null>(null);
    const [status, setStatus] = useState<GlobalSearchStatus>('idle');
    const requestGeneration = useRef(0);
    const activeRequest = useRef<AbortController | null>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const search = useCallback((next: string) => {
        const generation = ++requestGeneration.current;
        const normalizedQuery = normalizeSearchText(next.trim());
        activeRequest.current?.abort();
        clearTimeout(searchTimer.current);
        setQuery(next);
        setResults(null);

        if (!normalizedQuery) {
            setStatus('idle');
            return;
        }

        setStatus('loading');
        searchTimer.current = setTimeout(() => {
            const controller = new AbortController();
            activeRequest.current = controller;
            catalogClient
                .searchAll(normalizedQuery, controller.signal)
                .then((response) => {
                    if (generation === requestGeneration.current) {
                        setResults(response);
                        setStatus('ready');
                    }
                })
                .catch(() => {
                    if (generation === requestGeneration.current) {
                        setStatus('error');
                    }
                });
        }, 180);
    }, []);

    useEffect(
        () => () => {
            requestGeneration.current++;
            activeRequest.current?.abort();
            clearTimeout(searchTimer.current);
        },
        []
    );

    return { query, results, status, search };
}
