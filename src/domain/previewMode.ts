import Cookies from 'universal-cookie';

export type PreviewMode = 'model' | 'thumbnail';

const PREVIEW_MODE_COOKIE = 'previewMode';
const cookies = new Cookies();

function isPreviewMode(value: unknown): value is PreviewMode {
    return value === 'model' || value === 'thumbnail';
}

export function readPreviewMode(): PreviewMode {
    const value: unknown = cookies.get(PREVIEW_MODE_COOKIE);
    return isPreviewMode(value) ? value : 'model';
}

export function writePreviewMode(mode: PreviewMode): void {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    cookies.set(PREVIEW_MODE_COOKIE, mode, { expires });
}
