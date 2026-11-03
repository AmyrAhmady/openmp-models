import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native-web';
import type { StyleProp, ViewStyle } from 'react-native-web';
import type { CatalogListItem, ModelType } from 'src/domain/catalog';
import { getModelPreviewUrl, getPreviewName } from 'src/domain/globalSearch';
import { MODEL_TYPE_LABELS } from 'src/domain/modelType';
import { getTextureUrl } from 'src/domain/textureCatalog';
import type { TextureListItem } from 'src/domain/textureCatalog';
import { useGlobalSearch } from 'src/hooks/useGlobalSearch';
import { useTheme } from 'src/theme/ThemeContext';
import PreviewImage from '../PreviewImage';
import RoundCard from '../RoundCard';

type SearchType = ModelType | 'texture';

interface Props {
    onSelectModel: (type: ModelType, item: CatalogListItem) => void;
    onSelectTexture: (item: TextureListItem) => void;
    onShowAll: (type: SearchType, query: string) => void;
    style?: StyleProp<ViewStyle>;
}

interface ResultRowProps {
    title: string;
    subtitle: string;
    imageUrl: string;
    onPress: () => void;
}

const MODEL_TYPES: ModelType[] = ['vehicle', 'skin', 'object'];

const ResultRow = ({ title, subtitle, imageUrl, onPress }: ResultRowProps) => {
    const { theme } = useTheme();

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Select ${title}`}
            onPress={onPress}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}
        >
            <PreviewImage uri={imageUrl} size={40} />
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                    numberOfLines={1}
                    style={{ color: theme.normalText, fontSize: 14, fontWeight: '600' }}
                >
                    {title}
                </Text>
                <Text
                    numberOfLines={1}
                    style={{ color: theme.mutedText, fontSize: 12, marginTop: 2 }}
                >
                    {subtitle}
                </Text>
            </View>
        </Pressable>
    );
};

const GlobalSearch = ({ onSelectModel, onSelectTexture, onShowAll, style }: Props) => {
    const { theme } = useTheme();
    const { query, results, status, search } = useGlobalSearch();
    const { height } = useWindowDimensions();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const groups = results
        ? [
              ...MODEL_TYPES.map((type) => ({ type, total: results[type].total })),
              { type: 'texture' as const, total: results.texture.total },
          ]
        : [];
    const hasResults = groups.some((group) => group.total > 0);

    const close = () => {
        setOpen(false);
        search('');
    };

    const selectFirst = () => {
        if (!results) {
            return;
        }

        const type = MODEL_TYPES.find((candidate) => results[candidate].results.length);
        const item = type ? results[type].results[0] : undefined;
        const texture = results.texture.results[0];
        if (type && item) {
            close();
            onSelectModel(type, item);
        } else if (texture) {
            close();
            onSelectTexture(texture);
        }
    };

    useEffect(() => {
        if (!open) {
            return;
        }

        const onPointerDown = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [open]);

    return (
        <View
            ref={(node) => {
                containerRef.current = node instanceof HTMLElement ? node : null;
            }}
            style={[{ position: 'relative', zIndex: 20 }, style]}
        >
            <TextInput
                value={query}
                onChangeText={(text) => {
                    setOpen(true);
                    search(text);
                }}
                onFocus={() => setOpen(true)}
                onSubmitEditing={selectFirst}
                onKeyPress={(event) => {
                    if (event.nativeEvent.key === 'Escape') {
                        close();
                    }
                }}
                placeholder="Search for a model or texture"
                placeholderTextColor={theme.textBoxPlaceholder}
                accessibilityLabel="Search for a model or texture"
                style={{
                    height: 42,
                    width: '100%',
                    paddingHorizontal: 14,
                    fontSize: 14,
                    color: theme.normalText,
                    backgroundColor: theme.textBox,
                    borderWidth: 1,
                    borderColor: theme.lines,
                    borderRadius: 10,
                }}
            />
            {open && query.trim() !== '' && (
                <RoundCard
                    color={theme.elementBg}
                    padding={14}
                    shadowed
                    style={{ position: 'absolute', top: 50, left: 0, width: '100%', maxWidth: 640 }}
                >
                    {status === 'loading' && !results ? (
                        <ActivityIndicator color={theme.accent} />
                    ) : status === 'error' ? (
                        <Text style={{ color: theme.mutedText, fontSize: 13 }}>
                            The search could not be completed. Check your connection and try again.
                        </Text>
                    ) : !results || !hasResults ? (
                        <Text style={{ color: theme.mutedText, fontSize: 13 }}>
                            No results found.
                        </Text>
                    ) : (
                        <ScrollView style={{ maxHeight: Math.min(560, height - 160) }}>
                            {groups
                                .filter((group) => group.total > 0)
                                .map((group) => (
                                    <View key={group.type} style={{ marginBottom: 8 }}>
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: 2,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: theme.title,
                                                    fontSize: 13,
                                                    fontWeight: '800',
                                                }}
                                            >
                                                {group.type === 'texture'
                                                    ? 'Textures'
                                                    : MODEL_TYPE_LABELS[group.type]}
                                            </Text>
                                            {group.total > results[group.type].results.length && (
                                                <Pressable
                                                    accessibilityRole="button"
                                                    accessibilityLabel={`Show all ${group.total} results`}
                                                    onPress={() => {
                                                        setOpen(false);
                                                        onShowAll(group.type, query.trim());
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: theme.accent,
                                                            fontSize: 12,
                                                            fontWeight: '700',
                                                        }}
                                                    >
                                                        Show all {group.total}
                                                    </Text>
                                                </Pressable>
                                            )}
                                        </View>
                                        {group.type === 'texture'
                                            ? results.texture.results.map((item) => (
                                                  <ResultRow
                                                      key={`${item.txd}/${item.name}`}
                                                      title={item.name}
                                                      subtitle={`${item.txd}.txd`}
                                                      imageUrl={getTextureUrl(item.name)}
                                                      onPress={() => {
                                                          close();
                                                          onSelectTexture(item);
                                                      }}
                                                  />
                                              ))
                                            : results[group.type].results.map((item) => (
                                                  <ResultRow
                                                      key={item.id}
                                                      title={item.name}
                                                      subtitle={
                                                          'model' in item
                                                              ? `${item.id} · ${item.model}`
                                                              : String(item.id)
                                                      }
                                                      imageUrl={getModelPreviewUrl(
                                                          getPreviewName(item)
                                                      )}
                                                      onPress={() => {
                                                          close();
                                                          onSelectModel(
                                                              group.type as ModelType,
                                                              item
                                                          );
                                                      }}
                                                  />
                                              ))}
                                    </View>
                                ))}
                        </ScrollView>
                    )}
                </RoundCard>
            )}
        </View>
    );
};

export default React.memo(GlobalSearch);
