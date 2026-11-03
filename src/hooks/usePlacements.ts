import { useEffect, useState } from 'react';
import { isAbortError } from 'src/catalog/catalogQuery';
import { placementClient } from 'src/catalog/placementClient';
import type { ModelPlacements } from 'src/domain/placementCatalog';

export type PlacementLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface PlacementResult {
    id: number;
    placements: ModelPlacements | null;
}

export interface UsePlacementsResult {
    placements: ModelPlacements | null;
    status: PlacementLoadStatus;
}

export function usePlacements(id: number | null): UsePlacementsResult {
    const [result, setResult] = useState<PlacementResult | null>(null);

    useEffect(() => {
        if (id === null) {
            return;
        }

        const controller = new AbortController();
        placementClient
            .getItem(id, controller.signal)
            .then(({ item }) => setResult({ id, placements: item }))
            .catch((error: unknown) => {
                if (!isAbortError(error)) {
                    setResult({ id, placements: null });
                }
            });

        return () => controller.abort();
    }, [id]);

    const current = id !== null && result?.id === id ? result : null;

    return {
        placements: current?.placements ?? null,
        status:
            id === null ? 'idle' : !current ? 'loading' : current.placements ? 'ready' : 'error',
    };
}
