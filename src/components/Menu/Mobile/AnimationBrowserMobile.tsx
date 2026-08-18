import React from 'react';
import AnimationBrowser from 'src/components/AnimationBrowser';
import MobileModal from 'src/components/MobileModal';

interface Props {
    visible: boolean;
    onRequestClose: () => void;
}

const AnimationBrowserMobile = ({ visible, onRequestClose }: Props) => (
    <MobileModal
        visible={visible}
        animationType="fade"
        accessibilityLabel="Animation browser dialog"
        initialFocusSelector={'[aria-label="Close"]'}
        onRequestClose={onRequestClose}
    >
        <AnimationBrowser style={{ width: '100%', maxWidth: 420 }} onClose={onRequestClose} />
    </MobileModal>
);

export default React.memo(AnimationBrowserMobile);
