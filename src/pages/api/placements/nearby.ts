import type { NextApiRequest, NextApiResponse } from 'next';
import { findNearbyObjects } from 'src/catalog/placementRegistry';
import { queryValue } from 'src/domain/catalog';
import type { ApiErrorResponse } from 'src/domain/catalog';
import { NEARBY_RADIUS, isWorldPoint } from 'src/domain/placementCatalog';
import type { NearbyResponse } from 'src/domain/placementCatalog';

type Response = NearbyResponse | ApiErrorResponse;

function coordinate(value: string | undefined): number {
    return value && /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : NaN;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({
            error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET requests are supported.' },
        });
    }

    const point = {
        x: coordinate(queryValue(req.query.x)),
        y: coordinate(queryValue(req.query.y)),
    };
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !isWorldPoint(point)) {
        return res.status(400).json({
            error: {
                code: 'INVALID_POSITION',
                message: 'A position between -3000 and 3000 on both axes is required.',
            },
        });
    }

    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    return res.status(200).json({ results: findNearbyObjects(point, NEARBY_RADIUS) });
}
