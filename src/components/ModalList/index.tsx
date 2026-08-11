import React, { useCallback, useState } from 'react';
import { View, TouchableOpacity, FlatList, Text } from 'react-native-web';
import type { StyleProp, ViewStyle } from 'react-native-web';
import { useTheme } from 'src/theme/ThemeContext';
import MobileModal from 'src/components/MobileModal';

export interface ModalListItem {
    label: string;
    value: string | number;
}

interface Props<TItem extends ModalListItem> {
    data?: TItem[];
    selectedValue?: TItem['value'];
    onPress?: (item: TItem, index: number) => void;
    onClose?: () => void;
    buttonComponent?: React.ReactElement;
    style?: StyleProp<ViewStyle>;
    isMobile?: boolean;
}

const ModalList = <TItem extends ModalListItem>({
    style = {},
    buttonComponent = undefined,
    data = [],
    selectedValue = undefined,
    onPress = () => {},
    onClose = () => {},
    isMobile = false,
}: Props<TItem>) => {
    const [visible, setVisible] = useState(false);
    const { theme } = useTheme();
    const closeModal = useCallback(() => {
        setVisible(false);
        onClose();
    }, [onClose]);

    const listWidth = isMobile ? '100%' : '25rem';

    return (
        <View>
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Open model type menu"
                accessibilityState={{ expanded: visible }}
                style={style}
                onPress={() => {
                    setVisible(true);
                }}
            >
                {buttonComponent}
            </TouchableOpacity>
            <MobileModal
                visible={visible}
                animationType="fade"
                placement={isMobile ? 'bottom' : 'center'}
                onRequestClose={closeModal}
                accessibilityLabel="Model type menu"
                contentStyle={{
                    width: '100%',
                    maxWidth: isMobile ? 420 : '25rem',
                    maxHeight: '100%',
                    minWidth: 0,
                    minHeight: 0,
                    flexShrink: 1,
                }}
            >
                <View style={{ width: '100%', minWidth: 0, minHeight: 0 }}>
                    <FlatList
                        style={{ flexGrow: 0, maxHeight: '100%', width: '100%' }}
                        data={data}
                        contentContainerStyle={{
                            justifyContent: 'center',
                            backgroundColor: theme.elementBg,
                            borderRadius: 12,
                            overflow: 'hidden',
                            width: listWidth,
                            maxWidth: '100%',
                        }}
                        keyExtractor={(item) => String(item.value)}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                style={{
                                    borderTopWidth: index !== 0 ? 0.7 : 0,
                                    borderColor: theme.lines,
                                    backgroundColor:
                                        item.value === selectedValue
                                            ? theme.accentSoft
                                            : theme.elementBg,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                                onPress={() => {
                                    closeModal();
                                    onPress(item, index);
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={item.label}
                                accessibilityState={{
                                    selected: item.value === selectedValue,
                                }}
                            >
                                <View style={{ paddingVertical: isMobile ? 12 : 20 }}>
                                    <Text
                                        style={{
                                            color: theme.button,
                                            fontSize: isMobile ? undefined : 20,
                                        }}
                                    >
                                        {item.label}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity
                        style={{ paddingTop: isMobile ? 8 : 12 }}
                        accessibilityRole="button"
                        accessibilityLabel="Close menu"
                        onPress={closeModal}
                    >
                        <View
                            style={{
                                backgroundColor: theme.elementBg,
                                elevation: 4,
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingVertical: isMobile ? 12 : 20,
                                borderRadius: 12,
                                width: listWidth,
                                maxWidth: '100%',
                            }}
                        >
                            <Text
                                style={{
                                    color: theme.button,
                                    fontSize: isMobile ? undefined : 20,
                                }}
                            >
                                Close
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </MobileModal>
        </View>
    );
};

export default ModalList;
