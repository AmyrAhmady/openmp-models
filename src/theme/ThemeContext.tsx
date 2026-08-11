import React, { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { themeSelect } from 'src/theme/themeTokens';
import type { ThemeMode, ThemeTokens } from 'src/theme/themeTokens';

interface ThemeContextValue {
    mode: ThemeMode;
    theme: ThemeTokens;
}

const ThemeContext = createContext<ThemeContextValue>({
    mode: 'light',
    theme: themeSelect('light'),
});

interface Props {
    mode: ThemeMode;
    children: ReactNode;
}

export const ThemeProvider = ({ mode, children }: Props) => {
    const value = useMemo(() => ({ mode, theme: themeSelect(mode) }), [mode]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
    return useContext(ThemeContext);
}
