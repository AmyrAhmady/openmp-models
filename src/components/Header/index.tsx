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
import type { PreviewMode } from 'src/domain/previewMode';

interface HeaderOption {
    label: string;
    value: ModelType | 'textures' | 'map';
}

const HEADER_OPTIONS: HeaderOption[] = [
    ...MODEL_TYPE_OPTIONS,
    { label: 'Textures', value: 'textures' },
    { label: 'Map', value: 'map' },
];

interface Props {
    modelType: ModelType;
    texturesSelected: boolean;
    mapSelected: boolean;
    isMobile?: boolean;
    onModelTypeChange: (type: ModelTypeOption) => void;
    onSelectTextures: () => void;
    onSelectMap: () => void;
    search?: React.ReactNode;
    previewMode: PreviewMode;
    onPreviewModeChange: (mode: PreviewMode) => void;
    themeMode: ThemeMode;
    onThemeModeChange: (mode: ThemeMode) => void;
}

const Header = (props: Props) => {
    const { theme } = useTheme();
    const {
        modelType,
        texturesSelected,
        mapSelected,
        onModelTypeChange,
        onSelectTextures,
        onSelectMap,
        search,
        previewMode,
        onPreviewModeChange,
        onThemeModeChange,
        isMobile,
        themeMode,
    } = props;
    const darkMode = themeMode === 'dark';
    const selectedValue = texturesSelected ? 'textures' : mapSelected ? 'map' : modelType;
    const selectedLabel = texturesSelected
        ? 'Textures'
        : mapSelected
          ? 'Map'
          : MODEL_TYPE_LABELS[modelType];
    const onSelectOption = (item: HeaderOption) => {
        if (item.value === 'textures') {
            onSelectTextures();
        } else if (item.value === 'map') {
            onSelectMap();
        } else {
            onModelTypeChange({ label: item.label, value: item.value });
        }
    };

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
                        <ModalList<HeaderOption>
                            style={styles.mobilePicker}
                            isMobile={isMobile}
                            data={HEADER_OPTIONS}
                            selectedValue={selectedValue}
                            onPress={onSelectOption}
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
                                        {selectedLabel} ▾
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
                    <>
                        <View style={styles.tabs}>
                            {HEADER_OPTIONS.map((item) => (
                                <TouchableOpacity
                                    key={item.value}
                                    accessibilityRole="button"
                                    accessibilityLabel={item.label}
                                    accessibilityState={{ selected: item.value === selectedValue }}
                                    onPress={() => onSelectOption(item)}
                                    style={[
                                        styles.tab,
                                        item.value === selectedValue && {
                                            backgroundColor: theme.accentSoft,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.tabText,
                                            {
                                                color:
                                                    item.value === selectedValue
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
                        {search && <View style={styles.search}>{search}</View>}
                    </>
                )}

                {!isMobile && (
                    <View style={styles.actions}>
                        <Text style={[styles.modeLabel, { color: theme.mutedText }]}>
                            {previewMode === 'thumbnail' ? 'Thumbnail' : '3D view'}
                        </Text>
                        <Switch
                            accessibilityLabel="Toggle thumbnail view"
                            trackColor={{ false: theme.lines, true: theme.accent }}
                            thumbColor="#ffffff"
                            onValueChange={(value) =>
                                onPreviewModeChange(value ? 'thumbnail' : 'model')
                            }
                            value={previewMode === 'thumbnail'}
                            style={styles.previewSwitch}
                        />
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
        zIndex: 10,
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
        marginRight: 24,
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
    },
    search: {
        flex: 1,
        marginHorizontal: 24,
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
    previewSwitch: {
        marginRight: 20,
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
