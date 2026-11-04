import React, { useCallback, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, FlatList } from 'react-native-web';
import type { FlatList as NativeFlatList } from 'react-native';
import { useTheme } from 'src/theme/ThemeContext';
import type { CatalogListItem } from 'src/domain/catalog';
import type { UseCatalogQueryResult } from 'src/hooks/useCatalogQuery';
import { getModelPreviewUrl, getPreviewName } from 'src/domain/globalSearch';
import CatalogStatus from '../CatalogStatus';
import PreviewImage from '../PreviewImage';

const UNIFORM_ROW_HEIGHT = 48;
const ROW_SPACING = 4;

interface Props {
    selectedItemId: number;
    onSelectItem: (model: CatalogListItem) => void;
    catalogQuery: UseCatalogQueryResult;
    uniformRows?: boolean;
}

interface CatalogRowProps {
    item: CatalogListItem;
    selected: boolean;
    uniform: boolean;
    onSelect: (item: CatalogListItem) => void;
}

const CatalogRow = React.memo(({ item, selected, uniform, onSelect }: CatalogRowProps) => {
    const { theme } = useTheme();

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Select ${item.name}`}
            accessibilityState={{ selected }}
            style={[
                { paddingHorizontal: 6, marginBottom: ROW_SPACING },
                uniform && { height: UNIFORM_ROW_HEIGHT },
            ]}
            onPress={() => onSelect(item)}
        >
            <View
                style={{
                    width: '100%',
                    alignItems: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    borderRadius: 9,
                    backgroundColor: selected ? theme.accentSoft : 'transparent',
                }}
            >
                <PreviewImage
                    uri={getModelPreviewUrl(getPreviewName(item))}
                    size={32}
                    marginRight={12}
                />
                <Text
                    style={{
                        flex: 1,
                        marginRight: 8,
                        color: theme.normalText,
                        fontSize: 14,
                        fontWeight: '600',
                    }}
                >
                    {item.name}
                </Text>
                <Text style={{ color: theme.mutedText, fontSize: 12, fontWeight: '700' }}>
                    {item.id}
                </Text>
            </View>
        </TouchableOpacity>
    );
});

const MenuDesktop = ({
    selectedItemId,
    onSelectItem,
    catalogQuery,
    uniformRows = false,
}: Props) => {
    const { theme } = useTheme();
    const { list, searchInput, status, error, hasMore, clearSearch, retry, loadMore } =
        catalogQuery;
    const listRef = useRef<NativeFlatList<CatalogListItem>>(null);
    const shownItem = useRef<CatalogListItem | null>(null);

    const selectItem = useCallback(
        (item: CatalogListItem) => {
            shownItem.current = item;
            onSelectItem(item);
        },
        [onSelectItem]
    );

    useEffect(() => {
        if (selectedItemId < 0 || searchInput) {
            return;
        }

        const index = list.findIndex((item) => item.id === selectedItemId);
        const item = list[index];
        if (item) {
            if (shownItem.current !== item) {
                shownItem.current = item;
                listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0.5 });
            }
        } else if (hasMore && status === 'ready' && !catalogQuery.loadMoreError) {
            loadMore();
        }
    }, [catalogQuery.loadMoreError, hasMore, list, loadMore, searchInput, selectedItemId, status]);

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
                    Browse models
                </Text>
                <Text style={{ color: theme.mutedText, fontSize: 13, marginTop: 5 }}>
                    Choose a model to preview
                </Text>
            </View>
            {searchInput ? (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginHorizontal: 22,
                    }}
                >
                    <Text
                        numberOfLines={1}
                        style={{ flex: 1, color: theme.mutedText, fontSize: 13 }}
                    >
                        Results for "{searchInput}"
                    </Text>
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Clear model search"
                        onPress={clearSearch}
                    >
                        <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '700' }}>
                            Clear
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : null}
            <CatalogStatus
                status={status}
                hasItems={list.length > 0}
                error={error}
                onRetry={retry}
            />
            <FlatList
                ref={listRef}
                style={{ flex: 1, minHeight: 0, marginTop: 14 }}
                contentContainerStyle={{
                    paddingHorizontal: 14,
                    paddingBottom: 20,
                    direction: 'ltr',
                }}
                data={list}
                keyExtractor={(item) => String(item.id)}
                onEndReached={catalogQuery.loadMore}
                onEndReachedThreshold={0.5}
                getItemLayout={
                    uniformRows
                        ? (_, index) => ({
                              length: UNIFORM_ROW_HEIGHT + ROW_SPACING,
                              offset: (UNIFORM_ROW_HEIGHT + ROW_SPACING) * index,
                              index,
                          })
                        : undefined
                }
                initialNumToRender={uniformRows ? undefined : list.length}
                onScrollToIndexFailed={({ index, averageItemLength }) =>
                    listRef.current?.scrollToOffset({
                        offset: index * averageItemLength,
                        animated: false,
                    })
                }
                ListFooterComponent={
                    <CatalogStatus
                        status={status}
                        hasItems={list.length > 0}
                        error={error}
                        onRetry={retry}
                        isLoadingMore={status === 'loading' && list.length > 0}
                        loadMoreError={catalogQuery.loadMoreError}
                    />
                }
                renderItem={({ item }) => (
                    <CatalogRow
                        item={item}
                        selected={item.id === selectedItemId}
                        uniform={uniformRows}
                        onSelect={selectItem}
                    />
                )}
            />
        </View>
    );
};

export default React.memo(MenuDesktop);
