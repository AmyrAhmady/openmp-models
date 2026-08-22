import React from 'react';
import AnimationBrowser, { type AnimationSelection } from 'src/components/AnimationBrowser';
import MobileModal from 'src/components/MobileModal';
import type { ParsedAnimation } from 'src/animation/ifpParser';

interface Props {
    visible: boolean;
    onRequestClose: () => void;
    onSelectAnimation: (animation: ParsedAnimation | null) => void;
    onSelectionChange?: ((selection: AnimationSelection) => void) | undefined;
    initialLibraryId?: string | null | undefined;
    initialAnimationName?: string | null | undefined;
}

const AnimationBrowserMobile = ({
    visible,
    onRequestClose,
    onSelectAnimation,
    onSelectionChange,
    initialLibraryId,
    initialAnimationName,
}: Props) => (
    <MobileModal
        visible={visible}
        animationType="fade"
        accessibilityLabel="Animation browser dialog"
        initialFocusSelector={'[aria-label="Close"]'}
        onRequestClose={onRequestClose}
    >
        <AnimationBrowser
            style={{ width: '100%', maxWidth: 420 }}
            onClose={onRequestClose}
            onSelectAnimation={onSelectAnimation}
            onSelectionChange={onSelectionChange}
            initialLibraryId={initialLibraryId}
            initialAnimationName={initialAnimationName}
        />
    </MobileModal>
);

export default React.memo(AnimationBrowserMobile);
