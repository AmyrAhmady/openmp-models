import type { NextApiRequest, NextApiResponse } from 'next';
import { queryValue } from 'src/domain/catalog';
import type { ApiErrorResponse } from 'src/domain/catalog';
import type { TextureSearchResponse } from 'src/domain/textureCatalog';
import { searchTextures } from 'src/catalog/textureRegistry';
import { normalizeSearchText } from 'src/domain/search';

type SearchResponse = TextureSearchResponse | ApiErrorResponse;

export default function handler(req: NextApiRequest, res: NextApiResponse<SearchResponse>) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({
            error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET requests are supported.' },
        });
    }

    const query = queryValue(req.query.q)?.trim();
    if (!query || !normalizeSearchText(query)) {
        return res.status(200).json({ results: [] });
    }

    res.setHeader('Cache-Control', 'private, max-age=60');
    return res.status(200).json({ results: searchTextures(query) });
}
