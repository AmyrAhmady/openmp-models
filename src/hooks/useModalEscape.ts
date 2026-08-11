import { useEffect } from 'react';

export function useModalEscape(visible: boolean, onClose: () => void): void {
    useEffect(() => {
        if (!visible || typeof document === 'undefined') {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [visible, onClose]);
}
