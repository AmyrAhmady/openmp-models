import React from 'react';
import ModelInfo from 'src/components/ModelInfo';
import MobileModal from 'src/components/MobileModal';
import type { InfoRow } from 'src/domain/catalog';

interface Props {
    visible: boolean;
    onRequestClose: () => void;
    data: InfoRow[];
}

const ModelInfoMobile = (props: Props) => {
    const { visible, onRequestClose, data } = props;

    return (
        <MobileModal
            visible={visible}
            animationType="fade"
            accessibilityLabel="Model information dialog"
            initialFocusSelector={'[aria-label="Close"]'}
            onRequestClose={onRequestClose}
        >
            <ModelInfo
                title="Model info"
                style={{ width: '100%', maxWidth: 420 }}
                onClose={onRequestClose}
                data={data}
            />
        </MobileModal>
    );
};

export default React.memo(ModelInfoMobile);
