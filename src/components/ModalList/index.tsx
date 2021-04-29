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
    isMobile?: boolean;
}

const ModalList = (
    {
        style = {}, buttonComponent = undefined,
        data = [], onPress = () => { }, onClose = () => { },
        isMobile = false
    }: Props) => {

    const [visible, setVisible] = useState(false);

    const listWidth = !isMobile ? '25rem' : undefined;

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
                <View style={{ height: '100%', width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                        onPress={() => setVisible(false)}
                    />
                    {isMobile ? (
                        <TouchableOpacity
                            activeOpacity={1}
                            style={{ flex: 1 }}
                            onPress={() => setVisible(false)}
                        />
                    ) : null}
                    <FlatList
                        style={{ flexGrow: 0, marginHorizontal: wp(3) }}
                        data={data}
                        contentContainerStyle={{
                            justifyContent: 'center', backgroundColor: 'white',
                            borderRadius: 12, overflow: 'hidden', width: listWidth, maxWidth: '100%'
                        }}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item, index }) => {
                            return (
                                <TouchableOpacity
                                    style={{
                                        borderTopWidth: index !== 0 ? 0.7 : 0, borderColor: '#E6E6E8',
                                        backgroundColor: 'white', justifyContent: 'center', alignItems: 'center',
                                    }}
                                    onPress={() => {
                                        setVisible(false);
                                        onPress(item, index);
                                    }}
                                >
                                    <View
                                        style={{
                                            paddingVertical: hp(2.5),
                                        }}
                                    >
                                        <Text style={{ color: "#007AFF", fontSize: isMobile ? undefined : 20 }}>{item.label}</Text>
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
                                marginBottom: wp(1), borderRadius: 12, width: listWidth, maxWidth: '100%'
                            }}
                        >
                            <Text style={{ color: '#FF3B30', fontSize: isMobile ? undefined : 20 }}>Close</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>

    );
}

export default ModalList;
