import React, { Component } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Image, Pressable, Linking, Switch, Text, ColorValue } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from '../../utils/screensize';

interface Props {
    padding: number;
    color: ColorValue;
    children: React.ReactNode | (() => React.ReactNode);
    style?: ViewStyle;
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
                { backgroundColor: color, padding: padding, borderRadius: 13 },
                style,
                shadowed ? {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2, },
                    shadowOpacity: 0.25, shadowRadius: 3.84,
                } : {}]}
        >
            {children}
        </View>
    );

}

export default React.memo(RoundCard);