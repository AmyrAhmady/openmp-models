import React, { Component, useState } from 'react';
import { View, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from '../../../utils/screensize';
import Row from '../../Row';
import { themeSelect } from 'src/resources/theme';
import ColorPicker from 'src/components/ColorPicker';
import ModelInfo from 'src/container/ModelInfo';

interface Props {
    visible: boolean;
    onRequestClose: () => void;
    data: any[];
}

const ModelInfoMobile = (props: Props) => {

    const {
        visible,
        onRequestClose,
        data
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
            <View style={{ flex: 1, minWidth: 0, minHeight: 0, height: '100%', width: '100%', justifyContent: 'center', alignItems: 'center', padding: 12 }}>
                <Pressable
                    style={{
                        position: 'absolute', top: 0, left: 0, width: '100%',
                        height: '100%', backgroundColor: 'rgba(100, 100, 100, 0.7)', zIndex: 0
                    }}
                    onPress={onRequestClose}
                />
                <ModelInfo
                    title="Model info"
                    style={{ width: '100%', maxWidth: 420 }}
                    onClose={onRequestClose}
                    data={data}
                />
            </View>
        </Modal>
    );
}

export default React.memo(ModelInfoMobile);
