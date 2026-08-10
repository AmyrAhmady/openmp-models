import React, { Component } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Image, Pressable, Linking, Switch, Text, ColorValue } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from '../utils/screensize';
import RoundCard from '../components/RoundCard';
import { themeSelect } from 'src/resources/theme';
import ModalCloseButton from '../components/ModalCloseButton';

interface Props {
    title: string;
    data?: {
        label: string,
        value: number | string
    }[];
    style?: ViewStyle;
    onClose?: () => void;
}

const ModelInfo = (props: Props) => {

    const theme = themeSelect();

    const {
        title,
        data,
        style,
        onClose
    } = props;

    return (
        <RoundCard color={theme.elementBg} padding={18} style={[{ position: 'relative' }, style]} shadowed>
            <Text style={{ paddingRight: onClose ? 32 : 0, fontSize: 16, fontWeight: '800', color: theme.title, marginBottom: 14 }}>{title}</Text>
            {onClose && <ModalCloseButton onPress={onClose} color={theme.title} style={{ position: 'absolute', top: 8, right: 8 }} />}
            <View style={{ justifyContent: 'flex-start', width: '100%' }} >
                {data && data.map((item, index) => {
                    return (
                        <View
                            key={index}
                            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 11 }}
                        >
                            <Text style={{ marginRight: 8, fontWeight: '700', fontSize: 12, color: theme.mutedText }}>{item.label}</Text>
                            <Text style={{ flex: 1, fontSize: 13, color: theme.normalText, textAlign: 'right' }}>{item.value}</Text>
                        </View>
                    )
                })}
            </View>
        </RoundCard >
    );

}

export default React.memo(ModelInfo);
