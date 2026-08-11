import { useEffect, useState } from 'react';

export const MOBILE_VIEW_BREAKPOINT = 1200;

function readMobileView(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < MOBILE_VIEW_BREAKPOINT;
}

/**
 * Reads the real browser viewport after hydration and keeps the layout state
 * synchronized without coupling the page to request user-agent headers.
 */
export function useResponsiveView(): boolean {
    const [isMobileView, setIsMobileView] = useState(false);

    useEffect(() => {
        const update = () => {
            setIsMobileView(readMobileView());
        };

        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    return isMobileView;
}
