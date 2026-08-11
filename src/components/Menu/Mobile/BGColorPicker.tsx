import React from 'react';
import ColorPicker from 'src/components/ColorPicker';
import MobileModal from 'src/components/MobileModal';
import { backgroundColors } from 'src/theme/colorPalette';

interface Props {
    visible: boolean;
    onRequestClose: () => void;
    onSelect: (color: string) => void;
    selectedColor: string;
    isMobileView?: boolean;
}

const BGColorPicker = (props: Props) => {
    const { visible, onRequestClose, onSelect, selectedColor, isMobileView } = props;

    return (
        <MobileModal
            visible={visible}
            animationType="fade"
            accessibilityLabel="Background color dialog"
            initialFocusSelector={'[aria-label="Close"]'}
            onRequestClose={onRequestClose}
        >
            <ColorPicker
                isMobileView={isMobileView ?? false}
                title="Background color"
                style={{ width: '100%', maxWidth: 420 }}
                onClose={onRequestClose}
                colors={backgroundColors}
                selectedColor={selectedColor}
                rows={5}
                onSelect={onSelect}
            />
        </MobileModal>
    );
};

export default React.memo(BGColorPicker);
