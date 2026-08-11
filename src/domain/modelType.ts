export type ModelType = 'object' | 'skin' | 'vehicle';

export interface ModelTypeOption {
    label: string;
    value: ModelType;
}

export type ModelTypeSelection = Pick<ModelTypeOption, 'value'>;

export const MODEL_TYPE_LABELS: Record<ModelType, string> = {
    vehicle: 'Vehicles',
    skin: 'Skins',
    object: 'Objects',
};

export const MODEL_TYPE_OPTIONS: ModelTypeOption[] = [
    { label: MODEL_TYPE_LABELS.vehicle, value: 'vehicle' },
    { label: MODEL_TYPE_LABELS.skin, value: 'skin' },
    { label: MODEL_TYPE_LABELS.object, value: 'object' },
];
