import React, { Component, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from '../../../utils/screensize';
import Modal from "modal-react-native-web";
import Row from '../../Row';
import { themeSelect } from 'src/resources/theme';
import ColorPicker from 'src/components/ColorPicker';

interface Props {
    visible: boolean;
    onRequestClose: () => void;
    onSelect: (model: any) => void;
}

const BGColorPicker = (props: Props) => {

    const {
        visible,
        onRequestClose,
        onSelect
    } = props;

    const theme = themeSelect();

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={() => onRequestClose()}
            onDismiss={() => onRequestClose()}
        >
            <View style={{ height: '100%', width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    style={{
                        position: 'absolute', top: 0, left: 0, width: '100%',
                        height: '100%', backgroundColor: 'rgba(100, 100, 100, 0.7)'
                    }}
                    onPress={() => onRequestClose()}
                >
                    <View />
                </TouchableOpacity>
                <ColorPicker
                    title="Background color"
                    style={{ width: '80%', height: '80%' }}
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