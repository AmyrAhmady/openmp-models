import React, { Component, useEffect, useState } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Image, Pressable, Linking, Switch, Text, ColorValue } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from '../../utils/screensize';
import RoundCard from '../RoundCard';

interface Props {
    title: string;
    titleColor: string;
    rows: number;
    onSelect?: (color: string) => void;
    colors?: string[];
    style?: ViewStyle
}

const ColorPicker = (props: Props) => {

    const [parentWidth, setParentWidth] = useState(0);
    const [colorItemSize, setColorItemSize] = useState(0);

    const {
        title,
        titleColor,
        onSelect,
        rows,
        colors,
        style
    } = props;

    useEffect(() => {
        setColorItemSize(
            (rows / (colors.length ? colors.length : 1)) * parentWidth
        )
    }, [parentWidth]);

    return (
        <RoundCard color="#ccc" padding={20} style={style} shadowed>
            <Text style={{ fontSize: wp(1), color: titleColor, marginBottom: 10 }}>{title}</Text>
            <View style={{ flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }} onLayout={(event) => setParentWidth(event.nativeEvent.layout.width)}>
                {colors && colors.map((color, index) => {
                    return (
                        <Pressable
                            style={{
                                width: colorItemSize - 5, height: colorItemSize - 5, backgroundColor: color,
                                marginBottom: 5, borderWidth: 0.5, borderColor: '#555', marginRight: 5
                            }}
                            key={index}
                            accessibilityRole="link"
                            onPress={() => {
                                if (onSelect)
                                    onSelect(color);
                            }}
                        />
                    )
                })}
            </View>
        </RoundCard >
    );

}

export default React.memo(ColorPicker);