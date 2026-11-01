import React, { useCallback, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, FlatList, TextInput } from 'react-native-web';
import type { FlatList as NativeFlatList } from 'react-native';
import { useTheme } from 'src/theme/ThemeContext';
import type { CatalogListItem } from 'src/domain/catalog';
import type { UseCatalogQueryResult } from 'src/hooks/useCatalogQuery';
import CatalogStatus from '../CatalogStatus';
import Row from '../Row';

const UNIFORM_ROW_HEIGHT = 43;
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
                    paddingVertical: 13,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    borderRadius: 9,
                    backgroundColor: selected ? theme.accentSoft : 'transparent',
                }}
            >
                <Text style={{ color: theme.normalText, fontSize: 14, fontWeight: '600' }}>
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
    const { list, searchInput, status, error, hasMore, search, clearSearch, retry, loadMore } =
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
                            placeholder="Search for a model by name or id"
                            placeholderTextColor={theme.textBoxPlaceholder}
                            accessibilityLabel="Search for a model by name or id"
                            onChangeText={search}
                        />
                    </View>
                }
                rightContainerStyle={{ height: '100%', flex: undefined }}
                rightComponent={
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Clear model search"
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
