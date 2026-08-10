import React, { useState } from 'react';
import { View, TouchableOpacity, FlatList, Platform, StyleProp, ViewStyle, Modal, Text } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from '../../utils/screensize';

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

    const listWidth = isMobile ? '100%' : '25rem';

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
                <View style={{ flex: 1, minWidth: 0, minHeight: 0, width: '100%', justifyContent: isMobile ? 'flex-end' : 'center', alignItems: 'center', padding: 12 }}>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                        onPress={() => setVisible(false)}
                    />
                    <View style={{ width: '100%', maxWidth: isMobile ? 420 : '25rem', maxHeight: '100%', minWidth: 0, minHeight: 0, flexShrink: 1 }}>
                        <FlatList
                            style={{ flexGrow: 0, maxHeight: '100%', width: '100%' }}
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
                                                paddingVertical: isMobile ? 12 : hp(2.5),
                                            }}
                                        >
                                            <Text style={{ color: "#007AFF", fontSize: isMobile ? undefined : 20 }}>{item.label}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )
                            }}
                        />
                        <TouchableOpacity
                            style={{ paddingTop: isMobile ? 8 : hp(1.5) }}
                            onPress={() => setVisible(false)}
                        >
                            <View
                                style={{
                                    backgroundColor: 'white', elevation: 4,
                                    justifyContent: 'center', alignItems: 'center', paddingVertical: isMobile ? 12 : hp(2.5),
                                    borderRadius: 12, width: listWidth, maxWidth: '100%'
                                }}
                            >
                                <Text style={{ color: '#FF3B30', fontSize: isMobile ? undefined : 20 }}>Close</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View >

    );
}

export default ModalList;
