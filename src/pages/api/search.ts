import type { NextApiRequest, NextApiResponse } from 'next';
import { isModelType, queryValue } from 'src/domain/catalog';
import type { ApiErrorResponse, CatalogSearchResponse } from 'src/domain/catalog';
import { searchCatalog } from 'src/catalog/catalogSearch';
import { normalizeSearchText } from 'src/domain/search';

type SearchResponse = CatalogSearchResponse | ApiErrorResponse;

export default function handler(req: NextApiRequest, res: NextApiResponse<SearchResponse>) {
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

    const query = queryValue(req.query.q)?.trim();
    if (!query || !normalizeSearchText(query)) {
        return res.status(200).json({ results: [] });
    }

    const results = searchCatalog(rawType, query);

    res.setHeader('Cache-Control', 'private, max-age=60');
    return res.status(200).json({ results });
}
