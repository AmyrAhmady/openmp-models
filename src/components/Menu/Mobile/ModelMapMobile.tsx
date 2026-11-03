import React from 'react';
import MobileModal from 'src/components/MobileModal';
import ModelMap from 'src/components/ModelMap';

interface Props {
    visible: boolean;
    onRequestClose: () => void;
    objectId: number | null;
}

const ModelMapMobile = ({ visible, onRequestClose, objectId }: Props) => (
    <MobileModal
        visible={visible}
        animationType="fade"
        accessibilityLabel="Model map dialog"
        initialFocusSelector={'[aria-label="Close"]'}
        onRequestClose={onRequestClose}
        contentStyle={{ width: '100%', maxWidth: 420 }}
    >
        {visible && <ModelMap objectId={objectId} onClose={onRequestClose} />}
    </MobileModal>
);

export default React.memo(ModelMapMobile);
