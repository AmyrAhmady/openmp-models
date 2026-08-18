import AnimationLibraries from '../../data/source/catalogs/animations.json';

export interface AnimationLibraryInfo {
    id: string;
    name: string;
    file: string;
}

function isAnimationLibrary(value: unknown): value is AnimationLibraryInfo {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const record = value as Record<string, unknown>;
    return (
        typeof record.id === 'string' &&
        typeof record.name === 'string' &&
        typeof record.file === 'string'
    );
}

function validateAnimationCatalog(value: unknown): readonly AnimationLibraryInfo[] {
    if (!Array.isArray(value) || !value.every(isAnimationLibrary)) {
        throw new Error('Animation catalog contains an invalid library record.');
    }

    return value;
}

export const animationLibraries = validateAnimationCatalog(AnimationLibraries);
