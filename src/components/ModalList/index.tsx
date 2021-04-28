import React, { useState } from 'react';
import { View, TouchableOpacity, FlatList, Platform, StyleProp, ViewStyle, ActionSheetIOS, Text } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from '../../utils/screensize';
import Modal from "modal-react-native-web";

interface Props {
    data?: { label: string, value: any }[],
    onPress?: (item: any, index: number) => void;
    onClose?: () => void;
    buttonComponent?: React.ReactElement;
    style?: StyleProp<ViewStyle>;
}

const ModalList = (
    {
        style = {}, buttonComponent = undefined,
        data = [], onPress = () => { }, onClose = () => { }
    }: Props) => {

    const [visible, setVisible] = useState(false);

    return (
        <View>
            <TouchableOpacity
                style={style}
                onPress={() => {
                    setVisible(true);
                }}
            >
                {buttonComponent}
            </TouchableOpacity>

            <Modal
                visible={visible}
                animationType="fade"
                transparent
                onRequestClose={() => setVisible(false)}
                onDismiss={() => setVisible(false)}
            >
                <View style={{ height: '100%', width: '100%' }}>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                        onPress={() => setVisible(false)}
                    />
                    <TouchableOpacity
                        activeOpacity={1}
                        style={{ flex: 1 }}
                        onPress={() => setVisible(false)}
                    />
                    <FlatList
                        style={{ flexGrow: 0 }}
                        data={data}
                        contentContainerStyle={{
                            justifyContent: 'flex-end', backgroundColor: 'white', marginHorizontal: wp(3),
                            borderRadius: 12, overflow: 'hidden'
                        }}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item, index }) => {
                            return (
                                <TouchableOpacity
                                    onPress={() => {
                                        setVisible(false);
                                        onPress(item, index);
                                    }}
                                >
                                    <View
                                        style={{
                                            backgroundColor: 'white', borderColor: '#E6E6E8',
                                            justifyContent: 'center', alignItems: 'center', paddingVertical: hp(2.5),
                                            marginBottom: wp(3), borderTopWidth: index !== 0 ? 0.7 : 0
                                        }}
                                    >
                                        <Text style={{ color: "#007AFF" }}>{item.label}</Text>
                                    </View>
                                </TouchableOpacity>
                            )
                        }}
                    />
                    <TouchableOpacity
                        style={{ paddingVertical: hp(1.5) }}
                        onPress={() => setVisible(false)}
                    >
                        <View
                            style={{
                                marginHorizontal: wp(3), backgroundColor: 'white', elevation: 4,
                                justifyContent: 'center', alignItems: 'center', paddingVertical: hp(2.5),
                                marginBottom: wp(1), borderRadius: 12
                            }}
                        >
                            <Text style={{ color: '#FF3B30', fontSize: wp(4) }}>Close</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>

    );
}

export default ModalList;
