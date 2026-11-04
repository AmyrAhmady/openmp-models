import { useCallback, useEffect, useState } from 'react';
import { readPreviewMode, writePreviewMode } from 'src/domain/previewMode';
import type { PreviewMode } from 'src/domain/previewMode';

export interface UsePreviewModeResult {
    previewMode: PreviewMode;
    onPreviewModeChange: (mode: PreviewMode) => void;
}

export function usePreviewMode(): UsePreviewModeResult {
    const [previewMode, setPreviewMode] = useState<PreviewMode>('model');

    const onPreviewModeChange = useCallback((mode: PreviewMode): void => {
        writePreviewMode(mode);
        setPreviewMode(mode);
    }, []);

    useEffect(() => {
        const storedPreviewMode = readPreviewMode();
        if (storedPreviewMode !== 'model') {
            setPreviewMode(storedPreviewMode);
        }
    }, []);

    return { previewMode, onPreviewModeChange };
}
