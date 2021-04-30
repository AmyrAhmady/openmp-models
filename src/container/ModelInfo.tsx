import React, { Component } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Image, Pressable, Linking, Switch, Text, ColorValue } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from '../utils/screensize';
import RoundCard from '../components/RoundCard';

interface Props {
    title: string;
    data?: {
        label: string,
        value: number | string
    }[];
    style?: ViewStyle
}

const ModelInfo = (props: Props) => {

    const {
        title,
        data,
        style
    } = props;

    return (
        <RoundCard color="#ccc" padding={20} style={style} shadowed>
            <Text style={{ fontSize: wp(1), color: '#555', marginBottom: 10 }}>{title}</Text>
            <View style={{ justifyContent: 'flex-start', width: '100%' }} >
                {data && data.map((item, index) => {
                    return (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 10 }}>
                            <Text style={{ marginRight: 5, fontWeight: 'bold', fontSize: 15 }}>{item.label}:</Text>
                            <Text style={{ flex: 1, fontSize: 15 }}>{item.value}</Text>
                        </View>
                    )
                })}
            </View>
        </RoundCard >
    );

}

export default React.memo(ModelInfo);