import type { NextApiRequest, NextApiResponse } from 'next';
import { queryValue } from 'src/domain/catalog';
import type { ApiErrorResponse } from 'src/domain/catalog';
import type { GlobalSearchResponse } from 'src/domain/globalSearch';
import { searchAll } from 'src/catalog/globalSearch';
import { normalizeSearchText } from 'src/domain/search';

type SearchResponse = GlobalSearchResponse | ApiErrorResponse;

const emptyResponse: GlobalSearchResponse = {
    vehicle: { results: [], total: 0 },
    skin: { results: [], total: 0 },
    object: { results: [], total: 0 },
    texture: { results: [], total: 0 },
};

export default function handler(req: NextApiRequest, res: NextApiResponse<SearchResponse>) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({
            error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET requests are supported.' },
        });
    }

    const query = queryValue(req.query.q)?.trim();
    if (!query || !normalizeSearchText(query)) {
        return res.status(200).json(emptyResponse);
    }

    res.setHeader('Cache-Control', 'private, max-age=60');
    return res.status(200).json(searchAll(query));
}
