import React from 'react';
import { ColorValue, StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface Props {
    onPress: () => void;
    color?: ColorValue;
    style?: StyleProp<ViewStyle>;
}

const ModalCloseButton = ({ onPress, color = '#000000', style }: Props) => (
    <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={onPress}
        style={[styles.button, style]}
    >
        <Text style={{ color, fontSize: 30, lineHeight: 32 }}>×</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 32,
        minHeight: 32,
    },
});

export default React.memo(ModalCloseButton);
