import type { NextApiRequest, NextApiResponse } from 'next';
import type { ApiErrorResponse, CatalogListResponse } from 'src/domain/catalog';
import { getCatalogList, getCatalogListPage } from 'src/catalog/catalogRegistry';
import { CATALOG_PAGE_SIZE } from 'src/catalog/catalogConstants';
import { isModelType, queryValue } from 'src/domain/catalog';

type ListResponse = CatalogListResponse | ApiErrorResponse;

function parseNonNegativeInteger(value: string | undefined): number | undefined {
    if (value === undefined || !/^\d+$/.test(value)) {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : undefined;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<ListResponse>) {
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

    const rawOffset = queryValue(req.query.offset);
    const rawLimit = queryValue(req.query.limit);
    const hasPagination = rawOffset !== undefined || rawLimit !== undefined;
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

    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    return res.status(200).json({
        list: hasPagination ? getCatalogListPage(rawType, offset, limit) : getCatalogList(rawType),
    });
}
