import { useCallback, useEffect, useMemo, useState } from 'react';
import { backgroundForTheme, themeSelect } from 'src/theme/themeTokens';
import type { BackgroundSelection, ThemeMode, ThemeTokens } from 'src/theme/themeTokens';
import { readThemeMode, writeThemeMode } from 'src/theme/themeStorage';

export interface UseThemeControllerResult {
    themeMode: ThemeMode;
    theme: ThemeTokens;
    backgroundSelection: BackgroundSelection;
    onThemeModeChange: (nextThemeMode: ThemeMode) => void;
    onSelectColor: (color: string) => void;
}

export function useThemeController(): UseThemeControllerResult {
    const [themeMode, setThemeMode] = useState<ThemeMode>('light');
    const [backgroundSelection, setBackgroundSelection] = useState<BackgroundSelection>({
        color: themeSelect('light').mainBg,
        source: 'theme',
    });

    const onThemeModeChange = useCallback((nextThemeMode: ThemeMode): void => {
        writeThemeMode(nextThemeMode);
        setThemeMode(nextThemeMode);
        setBackgroundSelection((currentSelection) =>
            backgroundForTheme(nextThemeMode, currentSelection)
        );
    }, []);

    useEffect(() => {
        const storedThemeMode = readThemeMode();
        if (storedThemeMode !== 'light') {
            onThemeModeChange(storedThemeMode);
        }
    }, [onThemeModeChange]);

    const onSelectColor = useCallback((color: string): void => {
        setBackgroundSelection({ color, source: 'custom' });
    }, []);
    const theme = useMemo(() => themeSelect(themeMode), [themeMode]);

    return { themeMode, theme, backgroundSelection, onThemeModeChange, onSelectColor };
}
