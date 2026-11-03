import { useEffect, useState } from 'react';
import { isAbortError } from 'src/catalog/catalogQuery';
import { placementClient } from 'src/catalog/placementClient';
import type { MapPoint, NearbyObject } from 'src/domain/placementCatalog';
import type { PlacementLoadStatus } from 'src/hooks/usePlacements';

interface NearbyResult {
    point: MapPoint;
    results: NearbyObject[] | null;
}

export interface UseNearbyObjectsResult {
    results: NearbyObject[];
    status: PlacementLoadStatus;
}

export function useNearbyObjects(point: MapPoint | null): UseNearbyObjectsResult {
    const [result, setResult] = useState<NearbyResult | null>(null);

    useEffect(() => {
        if (!point) {
            return;
        }

        const controller = new AbortController();
        placementClient
            .nearby(point, controller.signal)
            .then(({ results }) => setResult({ point, results }))
            .catch((error: unknown) => {
                if (!isAbortError(error)) {
                    setResult({ point, results: null });
                }
            });

        return () => controller.abort();
    }, [point]);

    const current = point && result?.point === point ? result : null;

    return {
        results: current?.results ?? [],
        status: !point ? 'idle' : !current ? 'loading' : current.results ? 'ready' : 'error',
    };
}
