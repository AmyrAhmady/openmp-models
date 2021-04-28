import React, { Component } from 'react';
import { View, StyleSheet, Platform, StyleProp, ViewStyle, Image, Pressable, Linking, Switch, TouchableOpacity, Text } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from '../../utils/screensize';
import Row from '../Row';
import MenuDesktop from './Desktop';
import MenuMobile from './Mobile';

interface Props {
    isMobile?: boolean;
    modelType: "vehicle" | "object" | "skin";
    onSelectItem: (model: any) => void;
}

export default class Menu extends Component<Props, any> {

    constructor(props: Props) {
        super(props);

        this.state = {
        }
    }

    render() {

        const {
        } = this.state;

        const {
            isMobile,
            modelType,
            onSelectItem
        } = this.props;

        console.log(isMobile)

        if (isMobile) {
            return (
                <MenuMobile {...this.props} modelType={modelType} onSelectItem={onSelectItem} />
            );
        }
        else {
            return (
                <MenuDesktop {...this.props} modelType={modelType} onSelectItem={onSelectItem} />
            );
        }
    }
}
