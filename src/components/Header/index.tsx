import React from 'react';
import {
    View,
    StyleSheet,
    Image,
    Pressable,
    Linking,
    Switch,
    Text,
    TouchableOpacity,
} from 'react-native-web';
import type { ModelType } from 'src/domain/catalog';
import { MODEL_TYPE_LABELS, MODEL_TYPE_OPTIONS } from 'src/domain/modelType';
import type { ModelTypeOption } from 'src/domain/modelType';
import type { ThemeMode } from 'src/theme/themeTokens';
import { useTheme } from 'src/theme/ThemeContext';
import ModalList from '../ModalList';

interface Props {
    modelType: ModelType;
    isMobile?: boolean;
    onModelTypeChange: (type: ModelTypeOption) => void;
    themeMode: ThemeMode;
    onThemeModeChange: (mode: ThemeMode) => void;
}

const Header = (props: Props) => {
    const { theme } = useTheme();
    const { modelType, onModelTypeChange, onThemeModeChange, isMobile, themeMode } = props;
    const darkMode = themeMode === 'dark';

    return (
        <>
            <View
                style={[
                    styles.container,
                    isMobile && styles.mobileContainer,
                    { backgroundColor: theme.navbar, borderBottomColor: theme.lines },
                ]}
            >
                <View style={[styles.brand, isMobile && styles.mobileBrand]}>
                    <Pressable
                        accessibilityRole="link"
                        accessibilityLabel="Open open.mp home"
                        onPress={() => Linking.openURL('https://open.mp/')}
                    >
                        <Image
                            source={{
                                uri: 'https://assets.open.mp/assets/images/assets/logo-dark-trans.png',
                            }}
                            style={styles.logo}
                            accessibilityLabel="open.mp home"
                        />
                    </Pressable>
                    <View>
                        <Text style={[styles.brandTitle, { color: theme.title }]}>open.mp</Text>
                        <Text style={[styles.brandSubtitle, { color: theme.mutedText }]}>
                            Model library
                        </Text>
                    </View>
                </View>

                {isMobile ? (
                    <View style={styles.mobileHeaderActions}>
                        <ModalList<ModelTypeOption>
                            style={styles.mobilePicker}
                            isMobile={isMobile}
                            data={MODEL_TYPE_OPTIONS}
                            selectedValue={modelType}
                            onPress={(item) => onModelTypeChange(item)}
                            buttonComponent={
                                <View
                                    style={[
                                        styles.mobilePickerButton,
                                        styles.mobilePickerButtonCompact,
                                        { backgroundColor: theme.accentSoft },
                                    ]}
                                >
                                    <Text
                                        style={[styles.mobilePickerText, { color: theme.accent }]}
                                    >
                                        {MODEL_TYPE_LABELS[modelType]} ▾
                                    </Text>
                                </View>
                            }
                        />
                        <View style={styles.mobileThemeToggle}>
                            <Text style={[styles.modeLabel, { color: theme.mutedText }]}>
                                {darkMode ? 'Dark' : 'Light'}
                            </Text>
                            <Switch
                                accessibilityLabel="Toggle dark mode"
                                trackColor={{ false: theme.lines, true: theme.accent }}
                                thumbColor="#ffffff"
                                onValueChange={(value) =>
                                    onThemeModeChange(value ? 'dark' : 'light')
                                }
                                value={darkMode}
                            />
                        </View>
                    </View>
                ) : (
                    <View style={styles.tabs}>
                        {MODEL_TYPE_OPTIONS.map((item) => (
                            <TouchableOpacity
                                key={item.value}
                                accessibilityRole="button"
                                accessibilityLabel={item.label}
                                accessibilityState={{ selected: item.value === modelType }}
                                onPress={() => onModelTypeChange(item)}
                                style={[
                                    styles.tab,
                                    item.value === modelType && {
                                        backgroundColor: theme.accentSoft,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.tabText,
                                        {
                                            color:
                                                item.value === modelType
                                                    ? theme.accent
                                                    : theme.mutedText,
                                        },
                                    ]}
                                >
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {!isMobile && (
                    <View style={styles.actions}>
                        <Text style={[styles.modeLabel, { color: theme.mutedText }]}>
                            {darkMode ? 'Dark' : 'Light'}
                        </Text>
                        <Switch
                            accessibilityLabel="Toggle dark mode"
                            trackColor={{ false: theme.lines, true: theme.accent }}
                            thumbColor="#ffffff"
                            onValueChange={(value) => onThemeModeChange(value ? 'dark' : 'light')}
                            value={darkMode}
                        />
                    </View>
                )}
            </View>
        </>
    );
};

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
    mobileContainer: {
        height: 64,
        paddingHorizontal: 12,
    },
    brand: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 250,
    },
    mobileBrand: {
        width: 150,
        flexShrink: 1,
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
    mobileHeaderActions: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
    },
    mobileThemeToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
        flexShrink: 0,
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
    mobilePickerButtonCompact: {
        paddingHorizontal: 12,
    },
    mobilePickerText: {
        fontSize: 14,
        fontWeight: '700',
    },
});

export default Header;
