import React, { Component, useState } from 'react';
import { View, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from '../../../utils/screensize';
import Row from '../../Row';
import { themeSelect } from 'src/resources/theme';
import ColorPicker from 'src/components/ColorPicker';

interface Props {
    visible: boolean;
    onRequestClose: () => void;
    onSelect: (model: any) => void;
    isMobileView?: boolean;
}

const BGColorPicker = (props: Props) => {

    const {
        visible,
        onRequestClose,
        onSelect,
        isMobileView
    } = props;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={() => onRequestClose()}
            onDismiss={() => onRequestClose()}
        >
            <View style={{ flex: 1, minWidth: 0, minHeight: 0, width: '100%', justifyContent: 'center', alignItems: 'center', padding: 12 }}>
                <Pressable
                    style={{
                        position: 'absolute', top: 0, left: 0, width: '100%',
                        height: '100%', backgroundColor: 'rgba(100, 100, 100, 0.7)', zIndex: 0
                    }}
                    onPress={onRequestClose}
                />
                <ColorPicker
                    isMobileView={isMobileView}
                    title="Background color"
                    style={{ width: '100%', maxWidth: 420 }}
                    onClose={onRequestClose}
                    colors={[
                        '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
                        '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff',
                        '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000',
                        '#ffd8b1', '#000075', '#808080', '#ffffff', '#000000'
                    ]}
                    rows={5}
                    onSelect={color => onSelect(color)}
                />
            </View>
        </Modal>
    );
}

export default React.memo(BGColorPicker);
