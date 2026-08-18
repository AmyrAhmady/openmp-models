import type { AnimationLibraryInfo } from 'src/domain/animationCatalog';
import { parseIfp } from './ifpParser';
import type { ParsedAnimationLibrary } from './ifpParser';

const animationLibraryCache = new Map<string, Promise<ParsedAnimationLibrary>>();

export function getAnimationLibrary(
    library: AnimationLibraryInfo,
    signal?: AbortSignal
): Promise<ParsedAnimationLibrary> {
    const cached = animationLibraryCache.get(library.id);
    if (cached) {
        return cached;
    }

    const requestInit: RequestInit = signal ? { signal } : {};
    const request = fetch(`/ifps/${encodeURIComponent(library.file)}`, requestInit)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Could not load ${library.name}.`);
            }

            return response.arrayBuffer();
        })
        .then(parseIfp)
        .catch((error: unknown) => {
            if (animationLibraryCache.get(library.id) === request) {
                animationLibraryCache.delete(library.id);
            }

            throw error;
        });

    animationLibraryCache.set(library.id, request);
    return request;
}
