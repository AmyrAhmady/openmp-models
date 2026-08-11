import React from 'react';
import { View, TouchableOpacity, Text, FlatList, TextInput } from 'react-native-web';
import { useTheme } from 'src/theme/ThemeContext';
import type { CatalogListItem } from 'src/domain/catalog';
import type { UseCatalogQueryResult } from 'src/hooks/useCatalogQuery';
import CatalogStatus from '../CatalogStatus';
import Row from '../Row';

interface Props {
    selectedItemId: number;
    onSelectItem: (model: CatalogListItem) => void;
    catalogQuery: UseCatalogQueryResult;
}

interface CatalogRowProps {
    item: CatalogListItem;
    selected: boolean;
    onSelect: (item: CatalogListItem) => void;
}

const CatalogRow = React.memo(({ item, selected, onSelect }: CatalogRowProps) => {
    const { theme } = useTheme();

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Select ${item.name}`}
            accessibilityState={{ selected }}
            style={{ paddingHorizontal: 6, marginBottom: 4 }}
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

const MenuDesktop = ({ selectedItemId, onSelectItem, catalogQuery }: Props) => {
    const { theme } = useTheme();
    const { list, searchInput, status, error, search, clearSearch, retry } = catalogQuery;

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
                        onSelect={onSelectItem}
                    />
                )}
            />
        </View>
    );
};

export default React.memo(MenuDesktop);
