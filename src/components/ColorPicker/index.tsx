import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native-web';
import type { StyleProp, ViewStyle } from 'react-native-web';
import { useTheme } from 'src/theme/ThemeContext';
import { CLEAR_BACKGROUND_COLOR } from 'src/theme/colorPalette';
import RoundCard from '../RoundCard';
import ModalCloseButton from '../ModalCloseButton';

interface Props {
    title: string;
    rows: number;
    onSelect: (color: string) => void;
    colors: readonly string[];
    selectedColor?: string;
    style?: StyleProp<ViewStyle>;
    isMobileView?: boolean;
    onClose?: () => void;
    collapsible?: boolean;
    initiallyExpanded?: boolean;
}

const ColorPicker = (props: Props) => {
    const [parentWidth, setParentWidth] = useState(0);

    const { theme } = useTheme();

    const {
        title,
        onSelect,
        rows,
        colors,
        selectedColor,
        style,
        isMobileView = false,
        onClose,
        collapsible = false,
        initiallyExpanded = true,
    } = props;
    const [expanded, setExpanded] = useState(initiallyExpanded);
    const colorItemSize =
        parentWidth > 0 && colors.length > 0
            ? (Math.max(1, rows) / colors.length) * parentWidth
            : 0;
    const swatchSize = Math.max(1, colorItemSize - (isMobileView ? 10 : 5));

    return (
        <RoundCard
            color={theme.elementBg}
            padding={18}
            style={[{ position: 'relative' }, style]}
            shadowed
        >
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: expanded ? 14 : 0,
                }}
            >
                <Pressable
                    disabled={!collapsible}
                    onPress={() => setExpanded((current) => !current)}
                    style={{ alignItems: 'center', flex: 1, flexDirection: 'row', minWidth: 0 }}
                >
                    <Text
                        style={{
                            flex: 1,
                            paddingRight: onClose ? 32 : 0,
                            fontSize: 16,
                            fontWeight: '800',
                            color: theme.title,
                        }}
                    >
                        {title}
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
                    style={{ position: 'absolute', top: 8, right: 8 }}
                />
            )}
            {expanded && (
                <ScrollView
                    contentContainerStyle={{
                        flexWrap: 'wrap',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        width: '100%',
                    }}
                    onLayout={(event) => setParentWidth(event.nativeEvent.layout.width)}
                >
                    {parentWidth > 0 &&
                        colors.map((color) => {
                            const isClearColor = color === CLEAR_BACKGROUND_COLOR;

                            return (
                                <Pressable
                                    style={{
                                        width: swatchSize,
                                        height: swatchSize,
                                        backgroundColor: isClearColor ? theme.elementBg : color,
                                        marginBottom: 6,
                                        borderWidth: 1,
                                        borderColor: theme.lines,
                                        borderRadius: 4,
                                        marginLeft: isMobileView ? 0 : 5,
                                        borderStyle: isClearColor ? 'dashed' : 'solid',
                                    }}
                                    key={color}
                                    accessibilityRole="button"
                                    accessibilityLabel={
                                        isClearColor
                                            ? 'Clear background color'
                                            : `Select background color ${color}`
                                    }
                                    accessibilityState={{ selected: color === selectedColor }}
                                    onPress={() => {
                                        onSelect(color);
                                    }}
                                >
                                    {isClearColor && (
                                        <Text
                                            style={{
                                                color: theme.mutedText,
                                                fontSize: 16,
                                                fontWeight: '800',
                                                textAlign: 'center',
                                            }}
                                        >
                                            ×
                                        </Text>
                                    )}
                                </Pressable>
                            );
                        })}
                </ScrollView>
            )}
        </RoundCard>
    );
};

export default React.memo(ColorPicker);
