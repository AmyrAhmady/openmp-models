import React, { useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native-web';
import type { StyleProp, ViewStyle } from 'react-native-web';
import { useTheme } from 'src/theme/ThemeContext';
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
    } = props;
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
            <Text
                style={{
                    paddingRight: onClose ? 32 : 0,
                    fontSize: 16,
                    fontWeight: '800',
                    color: theme.title,
                    marginBottom: 14,
                }}
            >
                {title}
            </Text>
            {onClose && (
                <ModalCloseButton
                    onPress={onClose}
                    color={theme.title}
                    style={{ position: 'absolute', top: 8, right: 8 }}
                />
            )}
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
                        return (
                            <Pressable
                                style={{
                                    width: swatchSize,
                                    height: swatchSize,
                                    backgroundColor: color,
                                    marginBottom: 6,
                                    borderWidth: 1,
                                    borderColor: theme.lines,
                                    borderRadius: 4,
                                    marginLeft: isMobileView ? 0 : 5,
                                }}
                                key={color}
                                accessibilityRole="button"
                                accessibilityLabel={`Select background color ${color}`}
                                accessibilityState={{ selected: color === selectedColor }}
                                onPress={() => {
                                    onSelect(color);
                                }}
                            />
                        );
                    })}
            </ScrollView>
        </RoundCard>
    );
};

export default React.memo(ColorPicker);
