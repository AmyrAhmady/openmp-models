import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native-web';
import type { ModelType } from 'src/domain/catalog';
import { MODEL_TYPE_LABELS, MODEL_TYPE_OPTIONS } from 'src/domain/modelType';
import { useTheme } from 'src/theme/ThemeContext';

interface Props {
    modelType: ModelType;
    onModelTypeChange: (type: ModelType) => void;
    variant?: 'header' | 'sidebar';
}

const ModelTypeNavigation = ({ modelType, onModelTypeChange, variant = 'header' }: Props) => {
    const { theme } = useTheme();

    return (
        <View
            style={[
                styles.container,
                variant === 'sidebar' && styles.sidebarContainer,
                { backgroundColor: theme.navbar, borderBottomColor: theme.lines },
            ]}
        >
            <View style={[styles.tabs, variant === 'sidebar' && styles.sidebarTabs]}>
                {MODEL_TYPE_OPTIONS.map((item) => {
                    const isSelected = item.value === modelType;

                    return (
                        <TouchableOpacity
                            key={item.value}
                            accessibilityRole="button"
                            accessibilityLabel={`Browse ${MODEL_TYPE_LABELS[item.value]}`}
                            accessibilityState={{ selected: isSelected }}
                            onPress={() => onModelTypeChange(item.value)}
                            style={[
                                styles.tab,
                                variant === 'sidebar' && styles.sidebarTab,
                                isSelected && { backgroundColor: theme.accentSoft },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    { color: isSelected ? theme.accent : theme.mutedText },
                                ]}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        borderBottomWidth: 1,
        height: 58,
        justifyContent: 'center',
        width: '100%',
    },
    sidebarContainer: {
        alignItems: 'stretch',
        borderBottomWidth: 0,
        height: 'auto',
        justifyContent: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 12,
    },
    tabs: {
        alignItems: 'center',
        flexDirection: 'row',
    },
    sidebarTabs: {
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    tab: {
        borderRadius: 9,
        marginHorizontal: 3,
        paddingHorizontal: 18,
        paddingVertical: 9,
    },
    sidebarTab: {
        marginHorizontal: 2,
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
    },
});

export default React.memo(ModelTypeNavigation);
