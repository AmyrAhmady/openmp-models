import type { NextApiRequest, NextApiResponse } from 'next';
import { findCatalogItem } from 'src/catalog/catalogRegistry';
import { isModelType, queryValue } from 'src/domain/catalog';
import type { ApiErrorResponse, CatalogItemResponse } from 'src/domain/catalog';

type ItemResponse = CatalogItemResponse | ApiErrorResponse;

export default function handler(req: NextApiRequest, res: NextApiResponse<ItemResponse>) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({
            error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET requests are supported.' },
        });
    }

    const rawType = queryValue(req.query.type)?.toLowerCase();
    if (!isModelType(rawType)) {
        return res.status(400).json({
            error: { code: 'INVALID_MODEL_TYPE', message: 'A valid model type is required.' },
        });
    }

    const rawId = queryValue(req.query.id);
    const id = rawId && /^\d+$/.test(rawId) ? Number(rawId) : NaN;
    if (!Number.isSafeInteger(id)) {
        return res.status(400).json({
            error: { code: 'INVALID_MODEL_ID', message: 'A valid numeric model id is required.' },
        });
    }

    const item = findCatalogItem(rawType, id);
    if (!item) {
        return res.status(404).json({
            error: { code: 'MODEL_NOT_FOUND', message: 'The requested model was not found.' },
        });
    }

    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    return res.status(200).json({ item });
}
