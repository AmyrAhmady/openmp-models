import React, { Component } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Image, Pressable, Linking, Switch, Text, ColorValue } from 'react-native';

interface Props {
    padding: number;
    color: ColorValue;
    children: React.ReactNode | (() => React.ReactNode);
    style?: StyleProp<ViewStyle>;
    shadowed?: boolean;
}

const RoundCard = (props: Props) => {

    const {
        padding,
        color,
        style,
        children,
        shadowed
    } = props;

    return (
        <View
            style={[
                { backgroundColor: color, padding: padding, borderRadius: 14, borderWidth: 1, borderColor: '#ffffff12' },
                style,
                shadowed ? {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 5 },
                    shadowOpacity: 0.12, shadowRadius: 12,
                } : {}]}
        >
            {children}
        </View>
    );

}

export default React.memo(RoundCard);
