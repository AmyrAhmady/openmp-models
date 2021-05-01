import React, { Component } from 'react';
import { View, StyleSheet, Platform, StyleProp, ViewStyle, Image, Pressable, Linking, Switch, TouchableOpacity, Text } from 'react-native';
import Row from '../Row';
import MenuDesktop from '../Menu/Desktop';
import MenuMobile from '../Menu/Mobile';

interface Props {
    isMobile?: boolean;
    style?: ViewStyle;
}

export default class Menu extends Component<Props, any> {

    constructor(props: Props) {
        super(props);
    }

    render() {

        const {
            isMobile,
            style
        } = this.props;

        if (isMobile) {
            return this.props.children;
        }
        else {
            return (
                <View style={[{ height: '100%' }, style]}>
                    {this.props.children}
                </View>
            )
        }
    }
}
