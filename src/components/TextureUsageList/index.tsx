import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native-web';
import type { StyleProp, ViewStyle } from 'react-native-web';
import { MODEL_TYPE_LABELS } from 'src/domain/modelType';
import type { TextureUsage } from 'src/domain/textureCatalog';
import { useTheme } from 'src/theme/ThemeContext';
import RoundCard from '../RoundCard';

interface Props {
    usage: TextureUsage[];
    onSelect: (usage: TextureUsage) => void;
    style?: StyleProp<ViewStyle>;
}

const TextureUsageList = ({ usage, onSelect, style }: Props) => {
    const { theme } = useTheme();

    return (
        <RoundCard color={theme.elementBg} padding={18} style={style} shadowed>
            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.title, marginBottom: 14 }}>
                Used by
            </Text>
            {usage.length ? (
                <ScrollView style={{ maxHeight: 260 }}>
                    {usage.map((item) => (
                        <Pressable
                            key={`${item.type}-${item.id}`}
                            accessibilityRole="button"
                            accessibilityLabel={`Open ${item.name}`}
                            onPress={() => onSelect(item)}
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingVertical: 7,
                            }}
                        >
                            <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                                <Text
                                    numberOfLines={1}
                                    style={{ color: theme.normalText, fontSize: 13 }}
                                >
                                    {item.name}
                                </Text>
                                <Text
                                    style={{ color: theme.mutedText, fontSize: 11, marginTop: 2 }}
                                >
                                    {MODEL_TYPE_LABELS[item.type]}
                                </Text>
                            </View>
                            <Text
                                style={{ color: theme.mutedText, fontSize: 12, fontWeight: '700' }}
                            >
                                {item.id}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            ) : (
                <Text style={{ color: theme.mutedText, fontSize: 13 }}>
                    No model in the library uses this texture.
                </Text>
            )}
        </RoundCard>
    );
};

export default React.memo(TextureUsageList);
