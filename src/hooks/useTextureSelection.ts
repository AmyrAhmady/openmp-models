import { useCallback, useEffect, useState } from 'react';
import { isAbortError } from 'src/catalog/catalogQuery';
import { textureClient } from 'src/catalog/textureClient';
import type { TextureRequest } from 'src/catalog/textureClient';
import type { TextureDetails } from 'src/domain/textureCatalog';

export type TextureLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface TextureResult {
    request: TextureRequest;
    texture: TextureDetails | null;
}

export interface UseTextureSelectionResult {
    request: TextureRequest | null;
    texture: TextureDetails | null;
    textureStatus: TextureLoadStatus;
    textureError: string | null;
    selectTexture: (request: TextureRequest | null) => void;
    retryTexture: () => void;
}

export function useTextureSelection(): UseTextureSelectionResult {
    const [request, setRequest] = useState<TextureRequest | null>(null);
    const [attempt, setAttempt] = useState(0);
    const [result, setResult] = useState<TextureResult | null>(null);

    useEffect(() => {
        if (!request) {
            return;
        }

        const controller = new AbortController();
        const { name, ...source } = request;
        setResult(null);

        textureClient
            .getItem(name, source, controller.signal)
            .then(({ item }) => setResult({ request, texture: item }))
            .catch((error: unknown) => {
                if (!isAbortError(error)) {
                    setResult({ request, texture: null });
                }
            });

        return () => controller.abort();
    }, [attempt, request]);

    const retryTexture = useCallback(() => setAttempt((current) => current + 1), []);
    const current = result?.request === request ? result : null;
    const textureStatus: TextureLoadStatus = !request
        ? 'idle'
        : !current
          ? 'loading'
          : current.texture
            ? 'ready'
            : 'error';

    return {
        request,
        texture: current?.texture ?? null,
        textureStatus,
        textureError: textureStatus === 'error' ? 'This texture could not be loaded.' : null,
        selectTexture: setRequest,
        retryTexture,
    };
}
