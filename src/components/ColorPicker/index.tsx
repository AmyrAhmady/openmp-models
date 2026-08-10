import React, { Component, useEffect, useState } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Image, Pressable, Linking, Switch, Text, ColorValue, ScrollView } from 'react-native';
import { themeSelect } from 'src/resources/theme';
import RoundCard from '../RoundCard';
import ModalCloseButton from '../ModalCloseButton';

interface Props {
    title: string;
    rows: number;
    onSelect?: (color: string) => void;
    colors?: string[];
    style?: ViewStyle;
    isMobileView?: boolean;
    onClose?: () => void;
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
        style,
        isMobileView,
        onClose
    } = props;

    useEffect(() => {
        const colorCount = colors?.length ?? 0;
        setColorItemSize(
            (rows / (colorCount || 1)) * parentWidth
        )
    }, [parentWidth, rows, colors]);

    return (
        <RoundCard color={theme.elementBg} padding={18} style={[{ position: 'relative' }, style]} shadowed>
            <Text style={{ paddingRight: onClose ? 32 : 0, fontSize: 16, fontWeight: '800', color: theme.title, marginBottom: 14 }}>{title}</Text>
            {onClose && <ModalCloseButton onPress={onClose} color={theme.title} style={{ position: 'absolute', top: 8, right: 8 }} />}
            <ScrollView contentContainerStyle={{ flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }} onLayout={(event) => setParentWidth(event.nativeEvent.layout.width)}>
                {colors && colors.map((color, index) => {
                    return (
                        <Pressable
                            style={{
                                width: colorItemSize - (isMobileView ? 10 : 5), height: colorItemSize - (isMobileView ? 10 : 5), backgroundColor: color,
                                marginBottom: 6, borderWidth: 1, borderColor: theme.lines, borderRadius: 4, marginLeft: isMobileView ? 0 : 5
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
            </ScrollView>
        </RoundCard >
    );

}

export default React.memo(ColorPicker);
