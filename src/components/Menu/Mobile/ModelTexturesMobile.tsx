import React from 'react';
import MobileModal from 'src/components/MobileModal';
import TextureGrid from 'src/components/TextureGrid';

interface Props {
    visible: boolean;
    onRequestClose: () => void;
    textures: string[];
    emptyText: string;
    onSelect: (name: string) => void;
}

const ModelTexturesMobile = ({ visible, onRequestClose, textures, emptyText, onSelect }: Props) => (
    <MobileModal
        visible={visible}
        animationType="fade"
        accessibilityLabel="Model textures dialog"
        initialFocusSelector={'[aria-label="Close"]'}
        onRequestClose={onRequestClose}
        contentStyle={{ width: '100%', maxWidth: 420 }}
    >
        <TextureGrid
            title="Textures"
            textures={textures}
            emptyText={emptyText}
            onClose={onRequestClose}
            onSelect={(name) => {
                onRequestClose();
                onSelect(name);
            }}
        />
    </MobileModal>
);

export default React.memo(ModelTexturesMobile);
