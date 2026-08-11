import { useCallback, useEffect, useRef, useState } from 'react';
import type { CatalogItem, CatalogListItem, ModelType, VehicleInfo } from 'src/domain/catalog';
import type { ModelTypeSelection } from 'src/domain/modelType';
import { catalogClient } from 'src/catalog/catalogClient';
import { isAbortError } from 'src/catalog/catalogQuery';
import { getModelPreview } from 'src/domain/modelPreview';
import type { ModelPreviewData } from 'src/domain/modelPreview';
import { isModelAssetAbortError, ModelAssetError } from 'src/domain/modelAssetClient';
import { reportError } from 'src/monitoring/reportError';

export type ModelLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface UseModelSelectionResult {
    info: CatalogItem | null;
    selectedModelType: ModelType | null;
    models: ModelPreviewData[];
    modelStatus: ModelLoadStatus;
    modelError: string | null;
    onModelTypeChange: (type: ModelTypeSelection) => void;
    onSelectItem: (model: CatalogListItem) => void;
    retryModel: () => void;
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

export function useModelSelection(modelType: ModelType): UseModelSelectionResult {
    const [info, setInfo] = useState<CatalogItem | null>(initialInfo);
    const [selectedModelType, setSelectedModelType] = useState<ModelType | null>('vehicle');
    const [models, setModels] = useState<ModelPreviewData[]>([]);
    const [modelStatus, setModelStatus] = useState<ModelLoadStatus>('idle');
    const [modelError, setModelError] = useState<string | null>(null);
    const modelLoadGeneration = useRef(0);
    const modelLoadAbortController = useRef<AbortController | null>(null);
    const selectedItemGeneration = useRef(0);
    const selectedItemAbortController = useRef<AbortController | null>(null);

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
        async (summary: CatalogListItem): Promise<void> => {
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
                    summary.id,
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

    useEffect(() => {
        void loadModel(getAssetName(initialInfo), 'vehicle');

        return () => {
            selectedItemAbortController.current?.abort();
            selectedItemGeneration.current++;
            modelLoadAbortController.current?.abort();
            modelLoadGeneration.current++;
        };
    }, [loadModel]);

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
            void loadSelectedItem(model);
        },
        [loadSelectedItem]
    );

    return {
        info,
        selectedModelType,
        models,
        modelStatus,
        modelError,
        onModelTypeChange,
        onSelectItem,
        retryModel,
    };
}
