import React from 'react';
import AnimationBrowser from 'src/components/AnimationBrowser';
import MobileModal from 'src/components/MobileModal';
import type { ParsedAnimation } from 'src/animation/ifpParser';

interface Props {
    visible: boolean;
    onRequestClose: () => void;
    onSelectAnimation: (animation: ParsedAnimation | null) => void;
}

const AnimationBrowserMobile = ({ visible, onRequestClose, onSelectAnimation }: Props) => (
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
        />
    </MobileModal>
);

export default React.memo(AnimationBrowserMobile);
