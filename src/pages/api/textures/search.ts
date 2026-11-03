import type { NextApiRequest, NextApiResponse } from 'next';
import { queryValue } from 'src/domain/catalog';
import type { ApiErrorResponse } from 'src/domain/catalog';
import type { TextureSearchResponse } from 'src/domain/textureCatalog';
import { searchTextures } from 'src/catalog/textureRegistry';
import { CATALOG_PAGE_SIZE } from 'src/catalog/catalogConstants';
import { normalizeSearchText } from 'src/domain/search';

type SearchResponse = TextureSearchResponse | ApiErrorResponse;

function parseNonNegativeInteger(value: string | undefined): number | undefined {
    if (value === undefined || !/^\d+$/.test(value)) {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : undefined;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<SearchResponse>) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({
            error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET requests are supported.' },
        });
    }

    const rawOffset = queryValue(req.query.offset);
    const rawLimit = queryValue(req.query.limit);
    const offset = rawOffset === undefined ? 0 : parseNonNegativeInteger(rawOffset);
    const limit = rawLimit === undefined ? CATALOG_PAGE_SIZE : parseNonNegativeInteger(rawLimit);

    if (offset === undefined || limit === undefined || limit < 1 || limit > CATALOG_PAGE_SIZE) {
        return res.status(400).json({
            error: {
                code: 'INVALID_PAGINATION',
                message: `Pagination must use a non-negative offset and a limit from 1 to ${CATALOG_PAGE_SIZE}.`,
            },
        });
    }

    const query = queryValue(req.query.q)?.trim();
    if (!query || !normalizeSearchText(query)) {
        return res.status(200).json({ results: [] });
    }

    res.setHeader('Cache-Control', 'private, max-age=60');
    return res.status(200).json({ results: searchTextures(query).slice(offset, offset + limit) });
}
