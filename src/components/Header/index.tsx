import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Pressable, Linking, Switch, Text, TouchableOpacity } from 'react-native';
import { themeSelect } from 'src/resources/theme';
import store from 'src/state/store';
import ModalList from '../ModalList';

interface Props {
    modelType: string;
    isMobile?: boolean;
    onModelTypeChange: (type: { label: string, value: string }) => void;
    onThemeModeChange: (mode: 'dark' | 'light') => void;
}

const Header = (props: Props) => {

    const [darkMode, setDarkMode] = useState(false);
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
        <View style={[styles.container, { backgroundColor: theme.navbar, borderBottomColor: theme.lines }]}>
            <View style={styles.brand}>
                <Pressable accessibilityRole="link" onPress={() => Linking.openURL("https://open.mp/")}>
                    <Image source={{ uri: 'https://assets.open.mp/assets/images/assets/logo-dark-trans.png' }} style={styles.logo} />
                </Pressable>
                <View>
                    <Text style={[styles.brandTitle, { color: theme.title }]}>open.mp</Text>
                    <Text style={[styles.brandSubtitle, { color: theme.mutedText }]}>Model library</Text>
                </View>
            </View>

            {isMobile ? (
                <ModalList
                    style={styles.mobilePicker}
                    isMobile={isMobile}
                    data={menuItems}
                    onPress={(item) => onModelTypeChange(item)}
                    buttonComponent={<View style={[styles.mobilePickerButton, { backgroundColor: theme.accentSoft }]}><Text style={[styles.mobilePickerText, { color: theme.accent }]}>{modelTypes[modelType]} ▾</Text></View>}
                />
            ) : (
                <View style={styles.tabs}>
                    {menuItems.map((item) => (
                        <TouchableOpacity key={item.value} onPress={() => onModelTypeChange(item)} style={[styles.tab, item.value === modelType && { backgroundColor: theme.accentSoft }]}>
                            <Text style={[styles.tabText, { color: item.value === modelType ? theme.accent : theme.mutedText }]}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <View style={styles.actions}>
                <Text style={[styles.modeLabel, { color: theme.mutedText }]}>{darkMode ? 'Dark' : 'Light'}</Text>
                <Switch
                    trackColor={{ false: theme.lines, true: theme.accent }}
                    thumbColor="#ffffff"
                    onValueChange={setDarkMode}
                    value={darkMode}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        width: '100%',
        height: 76,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    brand: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 250,
    },
    logo: {
        width: 46,
        height: 46,
        marginRight: 12,
    },
    brandTitle: {
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    brandSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    tabs: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    tab: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        marginHorizontal: 4,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
    },
    actions: {
        width: 250,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    modeLabel: {
        fontSize: 12,
        marginRight: 8,
    },
    mobilePicker: {
        height: 44,
    },
    mobilePickerButton: {
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        borderRadius: 10,
    },
    mobilePickerText: {
        fontSize: 14,
        fontWeight: '700',
    },
});

export default Header;
