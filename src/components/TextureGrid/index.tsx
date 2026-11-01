import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native-web';
import type { StyleProp, ViewStyle } from 'react-native-web';
import { getTextureUrl } from 'src/domain/textureCatalog';
import { useTheme } from 'src/theme/ThemeContext';
import ModalCloseButton from '../ModalCloseButton';
import RoundCard from '../RoundCard';

interface Props {
    title: string;
    textures: string[];
    selectedName?: string | null;
    emptyText: string;
    onSelect: (name: string) => void;
    onClose?: () => void;
    style?: StyleProp<ViewStyle>;
    collapsible?: boolean;
    initiallyExpanded?: boolean;
}

const TextureGrid = ({
    title,
    textures,
    selectedName = null,
    emptyText,
    onSelect,
    onClose,
    style,
    collapsible = false,
    initiallyExpanded = true,
}: Props) => {
    const { theme } = useTheme();
    const [expanded, setExpanded] = React.useState(initiallyExpanded);
    const normalizedSelection = selectedName?.toLowerCase();

    return (
        <RoundCard
            color={theme.elementBg}
            padding={18}
            style={[{ position: 'relative' }, style]}
            shadowed
        >
            <Pressable
                disabled={!collapsible}
                onPress={() => setExpanded((current) => !current)}
                style={{
                    alignItems: 'center',
                    flexDirection: 'row',
                    marginBottom: expanded ? 14 : 0,
                }}
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
            {onClose && (
                <ModalCloseButton
                    onPress={onClose}
                    color={theme.title}
                    style={{ position: 'absolute', top: 8, right: 8 }}
                />
            )}
            {expanded &&
                (textures.length ? (
                    <ScrollView style={{ maxHeight: 260 }}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginRight: -8 }}>
                            {textures.map((name) => {
                                const selected = name.toLowerCase() === normalizedSelection;

                                return (
                                    <Pressable
                                        key={name}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Open texture ${name}`}
                                        accessibilityState={{ selected }}
                                        onPress={() => onSelect(name)}
                                        style={{ width: 64, marginRight: 8, marginBottom: 10 }}
                                    >
                                        <Image
                                            source={{ uri: getTextureUrl(name) }}
                                            style={{
                                                width: 64,
                                                height: 64,
                                                borderRadius: 6,
                                                borderWidth: 2,
                                                borderColor: selected
                                                    ? theme.accent
                                                    : 'transparent',
                                            }}
                                            accessibilityLabel={name}
                                        />
                                        <Text
                                            numberOfLines={1}
                                            style={{
                                                color: selected ? theme.accent : theme.mutedText,
                                                fontSize: 11,
                                                marginTop: 4,
                                            }}
                                        >
                                            {name}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </ScrollView>
                ) : (
                    <Text style={{ color: theme.mutedText, fontSize: 13 }}>{emptyText}</Text>
                ))}
        </RoundCard>
    );
};

export default React.memo(TextureGrid);
