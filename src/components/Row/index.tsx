import React from 'react';
import { View, StyleSheet, Platform, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';

const Row = ({
    style = {},
    onPress = undefined,
    leftComponent = <View />,
    leftContainerStyle = {},
    centerComponent = <View />,
    centerContainerStyle = {},
    rightComponent = <View />,
    rightContainerStyle = {}
}: {
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
    leftComponent?: React.ReactElement,
    leftContainerStyle?: StyleProp<ViewStyle>
    centerComponent?: React.ReactElement,
    centerContainerStyle?: StyleProp<ViewStyle>,
    rightComponent?: React.ReactElement,
    rightContainerStyle?: StyleProp<ViewStyle>
}) => {

    const Component: React.ElementType = onPress ? TouchableOpacity : View;

    return (
        <Component onPress={onPress} style={StyleSheet.flatten([styles.container, style])} >
            <View style={StyleSheet.flatten([styles.side, leftContainerStyle])}>
                {leftComponent}
            </View>
            <View style={StyleSheet.flatten([styles.center, centerContainerStyle])}>
                {centerComponent}
            </View>
            <View style={StyleSheet.flatten([styles.side, rightContainerStyle])}>
                {rightComponent}
            </View>
        </Component>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        height: 44,
    },
    center: {
        flex: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    side: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default React.memo(Row);
