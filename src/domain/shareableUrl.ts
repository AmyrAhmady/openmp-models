import type { ModelType } from './modelType';
import { vehicleColorOptions } from './vehicleColors';

export interface ShareableUrlState {
    modelType: ModelType;
    modelId: number | null;
    animationLibraryId: string | null;
    animationName: string | null;
    modificationIds: number[];
    primaryColorId: number | null;
    secondaryColorId: number | null;
    backgroundColor: string | null;
}

export const DEFAULT_SHAREABLE_URL_STATE: ShareableUrlState = {
    modelType: 'vehicle',
    modelId: null,
    animationLibraryId: null,
    animationName: null,
    modificationIds: [],
    primaryColorId: null,
    secondaryColorId: null,
    backgroundColor: null,
};

const MODEL_TYPE_BY_URL_VALUE: Record<string, ModelType> = {
    object: 'object',
    objects: 'object',
    skin: 'skin',
    skins: 'skin',
    vehicle: 'vehicle',
    vehicles: 'vehicle',
};

function queryValue(params: URLSearchParams, key: string): string | null {
    const value = params.get(key)?.trim();
    return value ? value : null;
}

function positiveInteger(value: string | null): number | null {
    if (!value || !/^\d+$/.test(value)) {
        return null;
    }

    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function colorId(value: string | null): number | null {
    const parsed = positiveInteger(value);
    return parsed !== null && parsed < vehicleColorOptions.length ? parsed : null;
}

function modificationIds(value: string | null): number[] {
    if (!value) {
        return [];
    }

    return Array.from(new Set(value.split(',').map((entry) => positiveInteger(entry.trim()))))
        .filter((id): id is number => id !== null)
        .sort((left, right) => left - right);
}

export function parseShareableUrl(search: string): ShareableUrlState {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const modelType = MODEL_TYPE_BY_URL_VALUE[queryValue(params, 'cat') ?? ''] ?? 'vehicle';

    return {
        modelType,
        modelId: positiveInteger(queryValue(params, 'model')),
        animationLibraryId: queryValue(params, 'animLib'),
        animationName: queryValue(params, 'anim'),
        modificationIds: modificationIds(queryValue(params, 'mods')),
        primaryColorId: colorId(queryValue(params, 'primaryColor')),
        secondaryColorId: colorId(queryValue(params, 'secondaryColor')),
        backgroundColor: queryValue(params, 'bg'),
    };
}

export function serializeShareableUrl(state: ShareableUrlState): string {
    const params = new URLSearchParams();
    params.set('cat', `${state.modelType}s`);

    if (state.modelId !== null) {
        params.set('model', String(state.modelId));
    }
    if (state.animationLibraryId) {
        params.set('animLib', state.animationLibraryId);
    }
    if (state.animationName) {
        params.set('anim', state.animationName);
    }
    if (state.modificationIds.length) {
        params.set(
            'mods',
            Array.from(new Set(state.modificationIds))
                .sort((a, b) => a - b)
                .join(',')
        );
    }
    if (state.primaryColorId !== null) {
        params.set('primaryColor', String(state.primaryColorId));
    }
    if (state.secondaryColorId !== null) {
        params.set('secondaryColor', String(state.secondaryColorId));
    }
    if (state.backgroundColor) {
        params.set('bg', state.backgroundColor);
    }

    return params.toString() ? `?${params.toString()}` : '';
}
