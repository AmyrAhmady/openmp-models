import type { NextApiRequest, NextApiResponse } from 'next';
import { findModelTextureDictionary, findTexture } from 'src/catalog/textureRegistry';
import { isModelType, queryValue } from 'src/domain/catalog';
import type { ApiErrorResponse } from 'src/domain/catalog';
import type { TextureItemResponse } from 'src/domain/textureCatalog';

type ItemResponse = TextureItemResponse | ApiErrorResponse;

export default function handler(req: NextApiRequest, res: NextApiResponse<ItemResponse>) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({
            error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET requests are supported.' },
        });
    }

    const name = queryValue(req.query.name)?.trim();
    if (!name) {
        return res.status(400).json({
            error: { code: 'INVALID_TEXTURE_NAME', message: 'A texture name is required.' },
        });
    }

    let txd = queryValue(req.query.txd)?.trim();
    if (!txd) {
        const rawType = queryValue(req.query.type)?.toLowerCase();
        const rawId = queryValue(req.query.id);
        const id = rawId && /^\d+$/.test(rawId) ? Number(rawId) : NaN;
        if (!isModelType(rawType) || !Number.isSafeInteger(id)) {
            return res.status(400).json({
                error: {
                    code: 'INVALID_TEXTURE_SOURCE',
                    message: 'A texture file or a model type and id is required.',
                },
            });
        }

        txd = findModelTextureDictionary(rawType, id, name);
    }

    const item = txd ? findTexture(txd, name) : undefined;
    if (!item) {
        return res.status(404).json({
            error: { code: 'TEXTURE_NOT_FOUND', message: 'The requested texture was not found.' },
        });
    }

    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    return res.status(200).json({ item });
}
