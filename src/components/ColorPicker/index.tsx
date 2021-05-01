import React, { Component, useEffect, useState } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Image, Pressable, Linking, Switch, Text, ColorValue } from 'react-native';
import { themeSelect } from 'src/resources/theme';
import RoundCard from '../RoundCard';

interface Props {
    title: string;
    rows: number;
    onSelect?: (color: string) => void;
    colors?: string[];
    style?: ViewStyle
}

const ColorPicker = (props: Props) => {

    const [parentWidth, setParentWidth] = useState(0);
    const [colorItemSize, setColorItemSize] = useState(0);

    const theme = themeSelect();

    const {
        title,
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
        <RoundCard color={theme.elementBg} padding={20} style={style} shadowed>
            <Text style={{ fontSize: 20, color: theme.title, marginBottom: 10 }}>{title}</Text>
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