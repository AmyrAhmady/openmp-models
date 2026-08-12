import React from 'react';
import VehicleColorPicker from 'src/components/VehicleColorPicker';
import MobileModal from 'src/components/MobileModal';
import type { VehicleColorOption } from 'src/domain/vehicleColors';

interface Props {
    visible: boolean;
    onRequestClose: () => void;
    colors: readonly VehicleColorOption[];
    primaryColorId: number;
    secondaryColorId: number;
    onSelect: (slot: 'primary' | 'secondary', colorId: number) => void;
}

const VehicleColorPickerMobile = (props: Props) => {
    const { visible, onRequestClose, colors, primaryColorId, secondaryColorId, onSelect } = props;

    return (
        <MobileModal
            visible={visible}
            animationType="fade"
            accessibilityLabel="Vehicle colors dialog"
            initialFocusSelector={'[aria-label="Close"]'}
            onRequestClose={onRequestClose}
        >
            <VehicleColorPicker
                isMobileView
                style={{ width: '100%', maxWidth: 420 }}
                colors={colors}
                primaryColorId={primaryColorId}
                secondaryColorId={secondaryColorId}
                onSelect={onSelect}
                onClose={onRequestClose}
            />
        </MobileModal>
    );
};

export default React.memo(VehicleColorPickerMobile);
