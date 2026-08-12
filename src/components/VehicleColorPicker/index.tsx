import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native-web';
import type { StyleProp, ViewStyle } from 'react-native-web';
import { useTheme } from 'src/theme/ThemeContext';
import type { VehicleColorOption } from 'src/domain/vehicleColors';
import RoundCard from '../RoundCard';
import ModalCloseButton from '../ModalCloseButton';

type ColorSlot = 'primary' | 'secondary';

interface Props {
    colors: readonly VehicleColorOption[];
    primaryColorId: number;
    secondaryColorId: number;
    onSelect: (slot: ColorSlot, colorId: number) => void;
    style?: StyleProp<ViewStyle>;
    isMobileView?: boolean;
    onClose?: () => void;
    collapsible?: boolean;
    initiallyExpanded?: boolean;
}

const VehicleColorPicker = (props: Props) => {
    const { theme } = useTheme();
    const {
        colors,
        primaryColorId,
        secondaryColorId,
        onSelect,
        style,
        isMobileView = false,
        onClose,
        collapsible = false,
        initiallyExpanded = true,
    } = props;
    const [expanded, setExpanded] = useState(initiallyExpanded);
    const [activeSlot, setActiveSlot] = useState<ColorSlot>('primary');
    const selectedColorId = activeSlot === 'primary' ? primaryColorId : secondaryColorId;

    return (
        <RoundCard
            color={theme.elementBg}
            padding={18}
            style={[{ position: 'relative', minWidth: 0 }, style]}
            shadowed
        >
            <View
                style={{
                    alignItems: 'center',
                    flexDirection: 'row',
                    marginBottom: expanded ? 12 : 0,
                }}
            >
                <Pressable
                    disabled={!collapsible}
                    onPress={() => setExpanded((current) => !current)}
                    style={{ alignItems: 'center', flex: 1, flexDirection: 'row', minWidth: 0 }}
                >
                    <Text
                        style={{
                            color: theme.title,
                            flex: 1,
                            fontSize: 16,
                            fontWeight: '800',
                            paddingRight: onClose ? 32 : 0,
                        }}
                    >
                        Vehicle colors
                    </Text>
                    {collapsible && (
                        <Text style={{ color: theme.mutedText, fontSize: 18 }}>
                            {expanded ? '▾' : '▸'}
                        </Text>
                    )}
                </Pressable>
            </View>
            {onClose && (
                <ModalCloseButton
                    onPress={onClose}
                    color={theme.title}
                    style={{ position: 'absolute', right: 8, top: 8 }}
                />
            )}
            {expanded && (
                <>
                    <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                        {(['primary', 'secondary'] as const).map((slot) => {
                            const isActive = slot === activeSlot;
                            return (
                                <Pressable
                                    key={slot}
                                    onPress={() => setActiveSlot(slot)}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Edit ${slot} vehicle color`}
                                    accessibilityState={{ selected: isActive }}
                                    style={{
                                        backgroundColor: isActive ? theme.button : theme.textBox,
                                        borderColor: isActive ? theme.button : theme.lines,
                                        borderRadius: 999,
                                        borderWidth: 1,
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
                                        {slot === 'primary' ? 'Primary' : 'Secondary'}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                    <ScrollView
                        style={{
                            maxHeight: isMobileView ? 300 : 260,
                            width: '100%',
                        }}
                        contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}
                    >
                        {colors.map((option) => (
                            <Pressable
                                key={option.id}
                                onPress={() => onSelect(activeSlot, option.id)}
                                accessibilityRole="button"
                                accessibilityLabel={`Select ${activeSlot} vehicle color ${option.id}`}
                                accessibilityState={{ selected: option.id === selectedColorId }}
                                style={{
                                    backgroundColor: option.color,
                                    borderColor:
                                        option.id === selectedColorId ? theme.button : theme.lines,
                                    borderRadius: 4,
                                    borderWidth: option.id === selectedColorId ? 3 : 1,
                                    height: isMobileView ? 30 : 26,
                                    marginBottom: 6,
                                    marginRight: 6,
                                    width: isMobileView ? 30 : 26,
                                }}
                            />
                        ))}
                    </ScrollView>
                    <View
                        style={{
                            borderTopColor: theme.lines,
                            borderTopWidth: 1,
                            marginTop: 6,
                            paddingTop: 10,
                        }}
                    >
                        <Text style={{ color: theme.mutedText, fontSize: 12 }}>
                            Primary color ID: {primaryColorId}
                        </Text>
                        <Text style={{ color: theme.mutedText, fontSize: 12, marginTop: 4 }}>
                            Secondary color ID: {secondaryColorId}
                        </Text>
                    </View>
                </>
            )}
        </RoundCard>
    );
};

export default React.memo(VehicleColorPicker);
