import React, { Component, useEffect, useState } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Image, Pressable, Linking, Switch, Text, TouchableOpacity } from 'react-native';
import { themeSelect } from 'src/resources/theme';
import store from 'src/state/store';
import ModalList from '../ModalList';
import Row from '../Row';

interface Props {
    modelType: string;
    isMobile?: boolean;
    onModelTypeChange: (type: { label: string, value: string }) => void;
    onThemeModeChange: (mode: 'dark' | 'light') => void;
}

const Header = (props: Props) => {

    const [darkMode, setDarkMode] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(0);

    useEffect(() => {
        const _darkMode = store.state.themeMode === 'dark';
        if (darkMode !== _darkMode) {
            const date = new Date();
            date.setFullYear(new Date().getFullYear() + 1);
            store.state.cookie.set("themeMode", darkMode ? 'dark' : 'light', { expires: date });
            onThemeModeChange(darkMode ? 'dark' : 'light');
        }
    }, [darkMode]);

    useEffect(() => {
        const asyncFunc = async () => {
            const themeMode = store.state.cookie.get("themeMode")
            store.dispatch("setThemeMode", themeMode || 'light');
            if (themeMode)
                setDarkMode(themeMode === "dark" ? true : false);
        };
        asyncFunc();
    }, [])

    const theme = themeSelect();

    const {
        modelType,
        onModelTypeChange,
        onThemeModeChange,
        isMobile
    } = props;

    const modelTypes = {
        "vehicle": "Vehicles",
        "object": "Objects",
        "skin": "Skins"
    };

    const menuItems = [
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
    ];

    return (
        <View
            style={[styles.container, { backgroundColor: theme.navbar, borderBottomColor: theme.lines }]}
            onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
        >
            <Row
                style={{ height: headerHeight, width: '100%', backgroundColor: theme.navbar, alignItems: 'center' }}
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
                centerContainerStyle={{ height: headerHeight, justifyContent: 'center', alignItems: isMobile ? 'center' : 'flex-start' }}
                centerComponent={
                    <View style={{ height: headerHeight * 70 / 100 }}>
                        {isMobile ? (
                            <ModalList
                                style={{ height: headerHeight * 70 / 100 }}
                                isMobile={isMobile}
                                data={menuItems}
                                onPress={(item, index) => {
                                    if (onModelTypeChange)
                                        onModelTypeChange(item);
                                }}
                                buttonComponent={
                                    <View
                                        style={{
                                            backgroundColor: theme.textBox, height: '100%', justifyContent: 'center',
                                            paddingBottom: 5, paddingHorizontal: 30, borderBottomWidth: 0.7, borderColor: theme.lines,
                                            shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3.00,
                                            shadowOffset: { width: 0, height: 2, },
                                        }}
                                    >
                                        <Text style={{ fontWeight: 'bold', color: theme.title, fontSize: 17 }}>{modelTypes[modelType]}</Text>
                                    </View>
                                }
                            />
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 20 }}>
                                {menuItems.map((item, index) => {
                                    if (item.value === modelType) {
                                        return (
                                            <View
                                                key={index}
                                                style={{
                                                    height: '100%', justifyContent: 'center',
                                                    paddingBottom: 5, paddingHorizontal: 40, borderBottomWidth: 0.7, borderColor: theme.lines,
                                                    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 3.00,
                                                    shadowOffset: { width: 0, height: 2, },
                                                }}
                                            >
                                                <Text style={{ fontWeight: 'bold', color: theme.title, fontSize: 17 }}>{item.label}</Text>
                                            </View>
                                        );
                                    }
                                    else {
                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                style={{ height: headerHeight * 70 / 100 }}
                                                onPress={() => {
                                                    if (onModelTypeChange)
                                                        onModelTypeChange(item);
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        height: '100%', justifyContent: 'center',
                                                        paddingBottom: 5, paddingHorizontal: 40,
                                                    }}
                                                >
                                                    <Text style={{ fontWeight: 'bold', color: theme.title, fontSize: 17 }}>{item.label}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    }
                                })}

                            </View>
                        )}
                    </View>
                }
                rightContainerStyle={{ height: '100%', flex: undefined }}
                rightComponent={
                    < View >
                        <Switch
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            thumbColor={darkMode ? "#f5dd4b" : "#f4f3f4"}
                            onValueChange={(value) => {
                                setDarkMode(value);
                            }}
                            value={darkMode}
                        />
                    </View >
                }
            />
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 10,
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
        overflow: 'hidden'
    },
});

export default Header;
