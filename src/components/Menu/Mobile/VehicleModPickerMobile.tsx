import React from 'react';
import VehicleModPicker from 'src/components/VehicleModPicker';
import MobileModal from 'src/components/MobileModal';
import type { VehicleModification } from 'src/domain/vehicleModifications';

interface Props {
    visible: boolean;
    onRequestClose: () => void;
    modifications: readonly VehicleModification[];
    selectedIds: readonly number[];
    onToggle: (modification: VehicleModification) => void;
}

const VehicleModPickerMobile = (props: Props) => {
    const { visible, onRequestClose, modifications, selectedIds, onToggle } = props;

    return (
        <MobileModal
            visible={visible}
            animationType="fade"
            accessibilityLabel="Vehicle modifications dialog"
            initialFocusSelector={'[aria-label="Close"]'}
            onRequestClose={onRequestClose}
        >
            <VehicleModPicker
                isMobileView
                style={{ width: '100%', maxWidth: 420 }}
                modifications={modifications}
                selectedIds={selectedIds}
                onToggle={onToggle}
                onClose={onRequestClose}
            />
        </MobileModal>
    );
};

export default React.memo(VehicleModPickerMobile);
