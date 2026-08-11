import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [role="button"], [role="link"], [role="switch"]';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => element.getAttribute('aria-hidden') !== 'true' && element.tabIndex >= 0
    );
}

export function useModalFocus(
    visible: boolean,
    containerRef: RefObject<HTMLElement | null>,
    initialFocusSelector = FOCUSABLE_SELECTOR
): void {
    const previousActiveElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!visible || typeof document === 'undefined') {
            return;
        }

        const activeElement = document.activeElement;
        previousActiveElement.current = activeElement instanceof HTMLElement ? activeElement : null;

        const focusTimer = window.setTimeout(() => {
            const container = containerRef.current;
            const initialFocus = container?.querySelector<HTMLElement>(initialFocusSelector);
            const firstFocusable = container ? getFocusableElements(container)[0] : undefined;
            (initialFocus ?? firstFocusable)?.focus();
        }, 0);

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key !== 'Tab') {
                return;
            }

            const container = containerRef.current;
            if (!container) {
                return;
            }

            const focusableElements = getFocusableElements(container);
            if (!focusableElements.length) {
                return;
            }

            const activeIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
            if (activeIndex === -1) {
                event.preventDefault();
                focusableElements[0]?.focus();
                return;
            }

            const nextIndex = event.shiftKey ? activeIndex - 1 : activeIndex + 1;
            if (nextIndex < 0 || nextIndex >= focusableElements.length) {
                event.preventDefault();
                const targetIndex = event.shiftKey ? focusableElements.length - 1 : 0;
                focusableElements[targetIndex]?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            window.clearTimeout(focusTimer);
            document.removeEventListener('keydown', handleKeyDown);
            previousActiveElement.current?.focus();
            previousActiveElement.current = null;
        };
    }, [containerRef, initialFocusSelector, visible]);
}
