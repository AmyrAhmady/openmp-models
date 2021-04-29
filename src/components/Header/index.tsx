import React, { Component } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Image, Pressable, Linking, Switch, Text } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from '../../utils/screensize';
import ModalList from '../ModalList';
import Row from '../Row';

interface Props {
    modelType: string;
    onModelTypeChange: (type: { label: string, value: string }) => void;
}

export default class Header extends Component<Props, any> {

    constructor(props: Props) {
        super(props);

        this.state = {
            headerHeight: 0,
            darkModeEnabled: false,
        }
    }

    render() {

        const {
            headerHeight,
            darkModeEnabled
        } = this.state;

        const {
            modelType,
            onModelTypeChange
        } = this.props;

        const modelTypes = {
            "vehicle": "Vehicles",
            "object": "Objects",
            "skin": "Skins"
        };

        return (
            <View style={styles.container} onLayout={(event) => this.setState({ headerHeight: event.nativeEvent.layout.height })}>
                <Row
                    style={{ height: headerHeight, width: '100%' }}
                    leftContainerStyle={{ height: '100%', flex: undefined }}
                    leftComponent={
                        <Pressable
                            accessibilityRole="link"
                            onPress={() => Linking.openURL("https://open.mp/")}
                        >
                            <Image
                                source={{ uri: 'https://assets.open.mp/assets/images/assets/logo-dark-trans.png' }}
                                style={{ width: headerHeight - 10, height: headerHeight - 10 }}
                            />
                        </Pressable>
                    }
                    centerComponent={
                        <View>
                            <ModalList
                                data={[
                                    {
                                        label: 'Vehicles',
                                        value: 'vehicle'
                                    },
                                    {
                                        label: 'Skins',
                                        value: 'skin'
                                    },
                                    {
                                        label: 'Objects',
                                        value: 'object'
                                    },
                                ]}
                                onPress={(item, index) => {
                                    if (onModelTypeChange)
                                        onModelTypeChange(item);
                                }}
                                buttonComponent={
                                    <View
                                        style={{
                                            paddingBottom: 5, paddingHorizontal: 15, borderBottomWidth: 0.7, borderColor: '#aaa',
                                            shadowColor: "#000",
                                            shadowOffset: {
                                                width: 0,
                                                height: 2,
                                            },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 3.00,
                                        }}
                                    >
                                        <Text style={{ fontWeight: 'bold', color: '#555', fontSize: 17 }}>{modelTypes[modelType]}</Text>
                                    </View>
                                }
                            />
                        </View>
                    }
                    rightContainerStyle={{ height: '100%', flex: undefined }}
                    rightComponent={
                        <View>
                            <Switch
                                trackColor={{ false: "#767577", true: "#81b0ff" }}
                                thumbColor={darkModeEnabled ? "#f5dd4b" : "#f4f3f4"}
                                onValueChange={() => this.setState({ darkModeEnabled: !darkModeEnabled })}
                                value={darkModeEnabled}
                            />
                        </View>
                    }
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 10,
        backgroundColor: 'white',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 1.00,
        width: '100%',
        height: 70,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        overflow: 'hidden'
    },
});
