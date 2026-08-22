import { useCallback, useEffect, useState } from 'react';
import {
    DEFAULT_SHAREABLE_URL_STATE,
    parseShareableUrl,
    serializeShareableUrl,
    type ShareableUrlState,
} from 'src/domain/shareableUrl';

interface UseShareableUrlResult {
    ready: boolean;
    hasQuery: boolean;
    state: ShareableUrlState;
    pushState: (state: ShareableUrlState) => void;
}

export function useShareableUrl(): UseShareableUrlResult {
    const [ready, setReady] = useState(false);
    const [hasQuery, setHasQuery] = useState(false);
    const [state, setState] = useState(DEFAULT_SHAREABLE_URL_STATE);

    useEffect(() => {
        const readLocation = (): void => {
            setState(parseShareableUrl(window.location.search));
            setHasQuery(window.location.search.length > 0);
            setReady(true);
        };

        readLocation();
        window.addEventListener('popstate', readLocation);
        return () => window.removeEventListener('popstate', readLocation);
    }, []);

    const pushState = useCallback((nextState: ShareableUrlState): void => {
        const search = serializeShareableUrl(nextState);
        if (window.location.search === search) {
            return;
        }

        window.history.pushState(
            {},
            '',
            `${window.location.pathname}${search}${window.location.hash}`
        );
    }, []);

    return { ready, hasQuery, state, pushState };
}
