import { useCallback, useEffect, useRef, useState } from 'react';
import type { CatalogItem, CatalogListItem, ModelType, VehicleInfo } from 'src/domain/catalog';
import type { ModelTypeSelection } from 'src/domain/modelType';
import { catalogClient } from 'src/catalog/catalogClient';
import { isAbortError } from 'src/catalog/catalogQuery';
import { getModelPreview } from 'src/domain/modelPreview';
import type { ModelPreviewData, VehicleColorSelection } from 'src/domain/modelPreview';
import { isModelAssetAbortError, ModelAssetError } from 'src/domain/modelAssetClient';
import { reportError } from 'src/monitoring/reportError';
import { getVehicleModification, vehicleModifications } from 'src/domain/vehicleModifications';
import type { VehicleModification } from 'src/domain/vehicleModifications';
import { getValidVehicleModifications } from 'src/domain/vehicleComponentCompatibility';

export type ModelLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface UseModelSelectionResult {
    info: CatalogItem | null;
    selectedModelType: ModelType | null;
    models: ModelPreviewData[];
    modelStatus: ModelLoadStatus;
    modelError: string | null;
    onModelTypeChange: (type: ModelTypeSelection) => void;
    onSelectItem: (model: CatalogListItem) => void;
    onSelectModelId: (modelId: number) => void;
    retryModel: () => void;
    availableModifications: readonly VehicleModification[];
    selectedModificationIds: readonly number[];
    onToggleModification: (modification: VehicleModification) => void;
    onSetModificationIds: (modificationIds: readonly number[]) => void;
    vehicleColor: VehicleColorSelection | null;
    onSelectVehicleColor: (slot: 'primary' | 'secondary', colorId: number) => void;
}

export interface InitialModelSelection {
    ready: boolean;
    type: ModelType;
    modelId: number | null;
}

const initialInfo: VehicleInfo = {
    id: 400,
    name: 'Landstalker',
    cat: 'Off Road',
    mods: 'Transfender',
    model: 'landstal',
};

function getAssetName(item: CatalogItem | CatalogListItem): string {
    return 'model' in item && item.model ? item.model : item.name;
}

function getModelErrorMessage(error: unknown, selected: boolean): string {
    if (error instanceof ModelAssetError && error.status === 404) {
        return 'A preview asset is not available for this model yet.';
    }

    return selected
        ? 'The selected model could not be loaded. Check your connection and try again.'
        : 'The model could not be loaded. Check your connection and try again.';
}

export function useModelSelection(
    modelType: ModelType,
    initialSelection?: InitialModelSelection
): UseModelSelectionResult {
    const [info, setInfo] = useState<CatalogItem | null>(initialInfo);
    const [selectedModelType, setSelectedModelType] = useState<ModelType | null>('vehicle');
    const [models, setModels] = useState<ModelPreviewData[]>([]);
    const [modelStatus, setModelStatus] = useState<ModelLoadStatus>('idle');
    const [modelError, setModelError] = useState<string | null>(null);
    const modelLoadGeneration = useRef(0);
    const modelLoadAbortController = useRef<AbortController | null>(null);
    const selectedItemGeneration = useRef(0);
    const selectedItemAbortController = useRef<AbortController | null>(null);

    const currentModel = models[0];
    const availableModifications =
        modelType === 'vehicle' && currentModel && info?.id !== undefined
            ? getValidVehicleModifications(info.id, vehicleModifications).filter((modification) =>
                  currentModel.obj.some((frame) => frame.name === modification.type)
              )
            : [];

    const selectedModificationIds = models[0]?.modifications ?? [];
    const vehicleColor = currentModel?.type === 'vehicle' ? (currentModel.color ?? null) : null;

    const loadModel = useCallback(async (name: string, type: ModelType): Promise<void> => {
        modelLoadAbortController.current?.abort();
        const abortController = new AbortController();
        modelLoadAbortController.current = abortController;
        const generation = ++modelLoadGeneration.current;
        setModels([]);
        setModelStatus('loading');
        setModelError(null);

        try {
            const modelData = await getModelPreview(name, type, {
                signal: abortController.signal,
            });
            if (generation !== modelLoadGeneration.current) {
                return;
            }

            setModels([modelData]);
            setModelStatus('ready');
            setModelError(null);
        } catch (error) {
            if (abortController.signal.aborted || isModelAssetAbortError(error)) {
                return;
            }

            if (generation === modelLoadGeneration.current) {
                if (!(error instanceof ModelAssetError && error.status === 404)) {
                    reportError(error, {
                        source: 'useModelSelection',
                        operation: 'load model asset',
                    });
                }
                setModels([]);
                setModelStatus('error');
                setModelError(getModelErrorMessage(error, false));
            }
        } finally {
            if (modelLoadAbortController.current === abortController) {
                modelLoadAbortController.current = null;
            }
        }
    }, []);

    const loadSelectedItem = useCallback(
        async (modelId: number): Promise<void> => {
            selectedItemAbortController.current?.abort();
            modelLoadAbortController.current?.abort();
            modelLoadGeneration.current++;

            const abortController = new AbortController();
            selectedItemAbortController.current = abortController;
            const generation = ++selectedItemGeneration.current;
            setModels([]);
            setModelStatus('loading');
            setModelError(null);
            setInfo(null);
            setSelectedModelType(null);

            try {
                const response = await catalogClient.getItem(
                    modelType,
                    modelId,
                    abortController.signal
                );
                if (generation !== selectedItemGeneration.current) {
                    return;
                }

                setInfo(response.item);
                setSelectedModelType(modelType);
                await loadModel(getAssetName(response.item), modelType);
            } catch (error) {
                if (abortController.signal.aborted || isAbortError(error)) {
                    return;
                }

                if (generation === selectedItemGeneration.current) {
                    if (!(error instanceof ModelAssetError && error.status === 404)) {
                        reportError(error, {
                            source: 'useModelSelection',
                            operation: 'load selected model',
                        });
                    }
                    setModels([]);
                    setModelStatus('error');
                    setModelError(getModelErrorMessage(error, true));
                }
            } finally {
                if (selectedItemAbortController.current === abortController) {
                    selectedItemAbortController.current = null;
                }
            }
        },
        [loadModel, modelType]
    );

    const initialLoadHandled = useRef(false);

    useEffect(() => {
        if (
            !initialSelection?.ready ||
            initialLoadHandled.current ||
            initialSelection.type !== modelType
        ) {
            return;
        }

        initialLoadHandled.current = true;
        if (initialSelection.modelId !== null) {
            void loadSelectedItem(initialSelection.modelId);
        } else if (modelType === 'vehicle') {
            setInfo(initialInfo);
            setSelectedModelType('vehicle');
            void loadModel(getAssetName(initialInfo), 'vehicle');
        } else {
            setInfo(null);
            setSelectedModelType(null);
            setModels([]);
            setModelStatus('idle');
        }

        return () => {
            selectedItemAbortController.current?.abort();
            selectedItemGeneration.current++;
            modelLoadAbortController.current?.abort();
            modelLoadGeneration.current++;
        };
    }, [
        initialSelection?.modelId,
        initialSelection?.ready,
        initialSelection?.type,
        loadModel,
        loadSelectedItem,
        modelType,
    ]);

    const retryModel = useCallback((): void => {
        if (!info || selectedModelType !== modelType) {
            return;
        }

        void loadModel(getAssetName(info), modelType);
    }, [info, loadModel, modelType, selectedModelType]);

    const onModelTypeChange = useCallback(
        (type: ModelTypeSelection): void => {
            if (type.value === modelType) {
                return;
            }

            selectedItemAbortController.current?.abort();
            selectedItemGeneration.current++;
            modelLoadAbortController.current?.abort();
            modelLoadGeneration.current++;
            setSelectedModelType(null);
            setInfo(null);
            setModels([]);
            setModelStatus('idle');
            setModelError(null);
        },
        [modelType]
    );

    const onSelectItem = useCallback(
        (model: CatalogListItem): void => {
            void loadSelectedItem(model.id);
        },
        [loadSelectedItem]
    );

    const onSelectModelId = useCallback(
        (modelId: number): void => {
            void loadSelectedItem(modelId);
        },
        [loadSelectedItem]
    );

    const onToggleModification = useCallback((modification: VehicleModification): void => {
        const modificationId = Number(modification.id);
        setModels((currentModels) => {
            const currentModel = currentModels[0];
            if (!currentModel || currentModel.type !== 'vehicle') {
                return currentModels;
            }

            const currentModifications = currentModel.modifications ?? [];
            const isSelected = currentModifications.includes(modificationId);
            const nextModifications = isSelected
                ? currentModifications.filter((id) => id !== modificationId)
                : [
                      ...currentModifications.filter(
                          (id) =>
                              getVehicleModification(id)?.type.toLowerCase() !==
                              modification.type.toLowerCase()
                      ),
                      modificationId,
                  ];

            return [{ ...currentModel, modifications: nextModifications }];
        });
    }, []);

    const onSetModificationIds = useCallback(
        (modificationIds: readonly number[]): void => {
            const validModifications = new Map(
                availableModifications.map((modification) => [
                    Number(modification.id),
                    modification,
                ])
            );

            setModels((currentModels) => {
                const currentModel = currentModels[0];
                if (!currentModel || currentModel.type !== 'vehicle') {
                    return currentModels;
                }

                const nextModifications: number[] = [];
                for (const modificationId of modificationIds) {
                    const modification = validModifications.get(modificationId);
                    if (!modification) {
                        continue;
                    }

                    const sameType = (id: number): boolean =>
                        getVehicleModification(id)?.type.toLowerCase() ===
                        modification.type.toLowerCase();
                    for (let index = nextModifications.length - 1; index >= 0; index -= 1) {
                        if (sameType(nextModifications[index] ?? -1)) {
                            nextModifications.splice(index, 1);
                        }
                    }
                    nextModifications.push(modificationId);
                }

                return [{ ...currentModel, modifications: nextModifications }];
            });
        },
        [availableModifications]
    );

    const onSelectVehicleColor = useCallback(
        (slot: 'primary' | 'secondary', colorId: number): void => {
            setModels((currentModels) => {
                const currentModel = currentModels[0];
                if (!currentModel || currentModel.type !== 'vehicle') {
                    return currentModels;
                }

                const currentColor = currentModel.color ?? { primary: 0, secondary: 0 };
                const nextColor =
                    slot === 'primary'
                        ? { primary: colorId, secondary: currentColor.secondary }
                        : { primary: currentColor.primary, secondary: colorId };

                return [{ ...currentModel, color: nextColor }];
            });
        },
        []
    );

    return {
        info,
        selectedModelType,
        models,
        modelStatus,
        modelError,
        onModelTypeChange,
        onSelectItem,
        onSelectModelId,
        retryModel,
        availableModifications,
        selectedModificationIds,
        onToggleModification,
        onSetModificationIds,
        vehicleColor,
        onSelectVehicleColor,
    };
}
