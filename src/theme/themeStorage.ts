import Cookies from 'universal-cookie';
import type { ThemeMode } from 'src/theme/themeTokens';

const THEME_COOKIE = 'themeMode';
const cookies = new Cookies();

function isThemeMode(value: unknown): value is ThemeMode {
    return value === 'dark' || value === 'light';
}

export function readThemeMode(): ThemeMode {
    const value: unknown = cookies.get(THEME_COOKIE);
    return isThemeMode(value) ? value : 'light';
}

export function writeThemeMode(mode: ThemeMode): void {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    cookies.set(THEME_COOKIE, mode, { expires });
}
