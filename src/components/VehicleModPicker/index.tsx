import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native-web';
import type { StyleProp, ViewStyle } from 'react-native-web';
import { useTheme } from 'src/theme/ThemeContext';
import type { VehicleModification } from 'src/domain/vehicleModifications';
import RoundCard from '../RoundCard';
import ModalCloseButton from '../ModalCloseButton';

interface Props {
    modifications: readonly VehicleModification[];
    selectedIds: readonly number[];
    onToggle: (modification: VehicleModification) => void;
    style?: StyleProp<ViewStyle>;
    isMobileView?: boolean;
    onClose?: () => void;
}

function formatType(type: string): string {
    return type.replaceAll('_ok', ' ').replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

const VehicleModPicker = (props: Props) => {
    const { theme } = useTheme();
    const { modifications, selectedIds, onToggle, style, isMobileView = false, onClose } = props;
    const selected = new Set(selectedIds);
    const [activeCategory, setActiveCategory] = useState('all');
    const categories = useMemo(() => {
        const categoryMap = new Map<string, string>();
        modifications.forEach((modification) => {
            const key = modification.type.toLowerCase();
            if (!categoryMap.has(key)) {
                categoryMap.set(key, formatType(modification.type));
            }
        });
        return Array.from(categoryMap, ([key, label]) => ({ key, label }));
    }, [modifications]);
    const visibleModifications =
        activeCategory === 'all'
            ? modifications
            : modifications.filter(
                  (modification) => modification.type.toLowerCase() === activeCategory
              );

    useEffect(() => {
        if (activeCategory !== 'all' && !categories.some(({ key }) => key === activeCategory)) {
            setActiveCategory('all');
        }
    }, [activeCategory, categories]);

    return (
        <RoundCard
            color={theme.elementBg}
            padding={18}
            style={[{ position: 'relative', minWidth: 0 }, style]}
            shadowed
        >
            <Text
                style={{
                    paddingRight: onClose ? 32 : 0,
                    fontSize: 16,
                    fontWeight: '800',
                    color: theme.title,
                    marginBottom: 12,
                }}
            >
                Vehicle modifications
            </Text>
            {onClose && (
                <ModalCloseButton
                    onPress={onClose}
                    color={theme.title}
                    style={{ position: 'absolute', top: 8, right: 8 }}
                />
            )}
            {modifications.length ? (
                <View
                    style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        marginBottom: 12,
                        width: '100%',
                    }}
                >
                    {[{ key: 'all', label: 'All' }, ...categories].map((category) => {
                        const isActive = category.key === activeCategory;

                        return (
                            <Pressable
                                key={category.key}
                                onPress={() => setActiveCategory(category.key)}
                                accessibilityRole="button"
                                accessibilityLabel={`Show ${category.label} modifications`}
                                accessibilityState={{ selected: isActive }}
                                style={{
                                    backgroundColor: isActive ? theme.button : theme.textBox,
                                    borderColor: isActive ? theme.button : theme.lines,
                                    borderRadius: 999,
                                    borderWidth: 1,
                                    marginBottom: 6,
                                    marginRight: 6,
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                }}
                            >
                                <Text
                                    style={{
                                        color: isActive ? theme.elementBg : theme.normalText,
                                        fontSize: 11,
                                        fontWeight: '700',
                                    }}
                                >
                                    {category.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            ) : null}
            {modifications.length ? (
                <ScrollView
                    style={{ maxHeight: isMobileView ? 420 : 260, width: '100%' }}
                    contentContainerStyle={{ paddingBottom: 2 }}
                >
                    {visibleModifications.map((modification) => {
                        const id = Number(modification.id);
                        const isSelected = selected.has(id);

                        return (
                            <Pressable
                                key={modification.id}
                                onPress={() => onToggle(modification)}
                                accessibilityRole="button"
                                accessibilityLabel={`Toggle ${modification.model} modification`}
                                accessibilityState={{ selected: isSelected }}
                                style={{
                                    alignItems: 'flex-start',
                                    backgroundColor: isSelected ? theme.accentSoft : theme.textBox,
                                    borderColor: theme.lines,
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    marginBottom: 6,
                                    paddingHorizontal: 10,
                                    paddingVertical: 8,
                                    width: '100%',
                                }}
                            >
                                <View style={{ flexDirection: 'row', width: '100%' }}>
                                    <Text
                                        style={{
                                            color: theme.normalText,
                                            flex: 1,
                                            fontSize: 13,
                                            fontWeight: '700',
                                        }}
                                    >
                                        {modification.model}
                                    </Text>
                                    <Text style={{ color: theme.mutedText, fontSize: 11 }}>
                                        {modification.id}
                                    </Text>
                                </View>
                                <Text
                                    style={{ color: theme.mutedText, fontSize: 11, marginTop: 2 }}
                                >
                                    {formatType(modification.type)}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            ) : (
                <Text style={{ color: theme.mutedText, fontSize: 13 }}>
                    No compatible modifications for this vehicle.
                </Text>
            )}
        </RoundCard>
    );
};

export default React.memo(VehicleModPicker);
