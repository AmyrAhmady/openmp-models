import type { NextApiRequest, NextApiResponse } from 'next';
import { findCatalogItem } from 'src/catalog/catalogRegistry';
import { findPlacements } from 'src/catalog/placementRegistry';
import { queryValue } from 'src/domain/catalog';
import type { ApiErrorResponse } from 'src/domain/catalog';
import type { PlacementsResponse } from 'src/domain/placementCatalog';

type ItemResponse = PlacementsResponse | ApiErrorResponse;

export default function handler(req: NextApiRequest, res: NextApiResponse<ItemResponse>) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({
            error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET requests are supported.' },
        });
    }

    const rawId = queryValue(req.query.id);
    const id = rawId && /^\d+$/.test(rawId) ? Number(rawId) : NaN;
    if (!Number.isSafeInteger(id)) {
        return res.status(400).json({
            error: { code: 'INVALID_MODEL_ID', message: 'A valid object id is required.' },
        });
    }

    if (!findCatalogItem('object', id)) {
        return res.status(404).json({
            error: { code: 'MODEL_NOT_FOUND', message: 'The requested object was not found.' },
        });
    }

    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    return res.status(200).json({ item: findPlacements(id) });
}
