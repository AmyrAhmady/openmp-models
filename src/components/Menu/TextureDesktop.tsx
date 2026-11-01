import React from 'react';
import { View, TouchableOpacity, Text, FlatList, TextInput, Image } from 'react-native-web';
import { useTheme } from 'src/theme/ThemeContext';
import { getTextureUrl } from 'src/domain/textureCatalog';
import type { TextureListItem } from 'src/domain/textureCatalog';
import type { UseTextureQueryResult } from 'src/hooks/useTextureQuery';
import CatalogStatus from '../CatalogStatus';
import Row from '../Row';

interface Props {
    selectedTexture: TextureListItem | null;
    onSelectTexture: (texture: TextureListItem) => void;
    textureQuery: UseTextureQueryResult;
}

interface TextureRowProps {
    item: TextureListItem;
    selected: boolean;
    onSelect: (item: TextureListItem) => void;
}

const TextureRow = React.memo(({ item, selected, onSelect }: TextureRowProps) => {
    const { theme } = useTheme();

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Select ${item.name} from ${item.txd}.txd`}
            accessibilityState={{ selected }}
            style={{ paddingHorizontal: 6, marginBottom: 4 }}
            onPress={() => onSelect(item)}
        >
            <View
                style={{
                    width: '100%',
                    alignItems: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    borderRadius: 9,
                    backgroundColor: selected ? theme.accentSoft : 'transparent',
                }}
            >
                <Image
                    source={{ uri: getTextureUrl(item.name) }}
                    style={{ width: 32, height: 32, borderRadius: 4, marginRight: 12 }}
                    accessibilityLabel={item.name}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                        numberOfLines={1}
                        style={{ color: theme.normalText, fontSize: 14, fontWeight: '600' }}
                    >
                        {item.name}
                    </Text>
                    <Text
                        numberOfLines={1}
                        style={{ color: theme.mutedText, fontSize: 12, marginTop: 2 }}
                    >
                        {item.txd}.txd
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
});

const TextureMenuDesktop = ({ selectedTexture, onSelectTexture, textureQuery }: Props) => {
    const { theme } = useTheme();
    const { list, searchInput, status, error, search, clearSearch, retry } = textureQuery;

    return (
        <View
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: theme.elementBg,
                borderRightWidth: 1,
                borderColor: theme.lines,
            }}
        >
            <View style={{ paddingHorizontal: 22, paddingTop: 22, paddingBottom: 14 }}>
                <Text style={{ color: theme.title, fontSize: 19, fontWeight: '800' }}>
                    Browse textures
                </Text>
                <Text style={{ color: theme.mutedText, fontSize: 13, marginTop: 5 }}>
                    Choose a texture to preview
                </Text>
            </View>
            <Row
                style={{
                    height: 48,
                    width: 'auto',
                    marginHorizontal: 18,
                    backgroundColor: theme.textBox,
                    direction: 'ltr',
                    borderWidth: 1,
                    borderColor: theme.lines,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                }}
                centerContainerStyle={{ flex: undefined }}
                leftContainerStyle={{ height: '100%', flex: 1 }}
                leftComponent={
                    <View style={{ width: '100%', paddingRight: 10 }}>
                        <TextInput
                            value={searchInput}
                            style={{
                                height: 44,
                                width: '100%',
                                paddingHorizontal: 0,
                                fontSize: 14,
                                color: theme.normalText,
                            }}
                            placeholder="Search by texture or texture file"
                            placeholderTextColor={theme.textBoxPlaceholder}
                            accessibilityLabel="Search by texture or texture file"
                            onChangeText={search}
                        />
                    </View>
                }
                rightContainerStyle={{ height: '100%', flex: undefined }}
                rightComponent={
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Clear texture search"
                        onPress={clearSearch}
                    >
                        <Text style={{ fontSize: 22, color: theme.mutedText }}>×</Text>
                    </TouchableOpacity>
                }
            />
            <CatalogStatus
                status={status}
                hasItems={list.length > 0}
                error={error}
                onRetry={retry}
                itemLabel="textures"
            />
            <FlatList
                style={{ flex: 1, minHeight: 0, marginTop: 14 }}
                contentContainerStyle={{
                    paddingHorizontal: 14,
                    paddingBottom: 20,
                    direction: 'ltr',
                }}
                data={list}
                keyExtractor={(item) => `${item.txd}/${item.name}`}
                onEndReached={textureQuery.loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    <CatalogStatus
                        status={status}
                        hasItems={list.length > 0}
                        error={error}
                        onRetry={retry}
                        isLoadingMore={status === 'loading' && list.length > 0}
                        loadMoreError={textureQuery.loadMoreError}
                        itemLabel="textures"
                    />
                }
                renderItem={({ item }) => (
                    <TextureRow
                        item={item}
                        selected={
                            item.txd === selectedTexture?.txd && item.name === selectedTexture.name
                        }
                        onSelect={onSelectTexture}
                    />
                )}
            />
        </View>
    );
};

export default React.memo(TextureMenuDesktop);
