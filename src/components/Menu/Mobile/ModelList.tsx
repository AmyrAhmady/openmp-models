import React, { useCallback } from 'react';
import { View, TouchableOpacity, Text, TextInput, FlatList } from 'react-native-web';
import Row from '../../Row';
import { useTheme } from 'src/theme/ThemeContext';
import ModalCloseButton from 'src/components/ModalCloseButton';
import MobileModal from 'src/components/MobileModal';
import type { CatalogListItem } from 'src/domain/catalog';
import CatalogStatus from 'src/components/CatalogStatus';
import type { CatalogQueryStatus } from 'src/hooks/useCatalogQuery';

interface Props {
    visible: boolean;
    onRequestClose: () => void;
    onSearch?: (query: string) => void;
    onSearchEnd?: () => void;
    searchInput: string;
    data: CatalogListItem[];
    selectedItemId: number;
    onSelect: (model: CatalogListItem) => void;
    status: CatalogQueryStatus;
    error: string | null;
    loadMoreError: string | null;
    onRetry: () => void;
    onLoadMore: () => void;
}

interface CatalogRowProps {
    item: CatalogListItem;
    selected: boolean;
    onSelect: (item: CatalogListItem) => void;
    theme: ReturnType<typeof useTheme>['theme'];
}

const CatalogRow = React.memo(({ item, selected, onSelect, theme }: CatalogRowProps) => (
    <TouchableOpacity
        style={{
            paddingHorizontal: '7%',
            backgroundColor: selected ? theme.accentSoft : 'transparent',
        }}
        onPress={() => onSelect(item)}
        accessibilityRole="button"
        accessibilityLabel={`Select ${item.name}`}
        accessibilityState={{ selected }}
    >
        <View
            style={{
                height: '100%',
                width: '100%',
                alignItems: 'center',
                paddingVertical: 20,
                flexDirection: 'row',
                justifyContent: 'space-between',
            }}
        >
            <Text style={{ color: theme.normalText, fontSize: 16 }}>{item.name}</Text>
            <Text style={{ color: theme.mutedText, fontSize: 16 }}>{item.id}</Text>
        </View>
        <View
            style={{
                borderBottomWidth: 0.5,
                borderColor: theme.lines,
                marginHorizontal: '2%',
            }}
        />
    </TouchableOpacity>
));

const ModelList = (props: Props) => {
    const {
        visible,
        onRequestClose,
        onSearch,
        onSearchEnd,
        searchInput,
        data,
        selectedItemId,
        onSelect,
        status,
        error,
        loadMoreError,
        onRetry,
        onLoadMore,
    } = props;

    const { theme } = useTheme();
    const closeModal = useCallback(() => {
        onSearchEnd?.();
        onRequestClose();
    }, [onRequestClose, onSearchEnd]);

    const selectModel = useCallback(
        (model: CatalogListItem) => {
            closeModal();
            onSelect(model);
        },
        [closeModal, onSelect]
    );

    return (
        <MobileModal
            visible={visible}
            animationType="slide"
            fullScreenContent
            accessibilityLabel="Model selector"
            onRequestClose={closeModal}
        >
            <View
                style={{
                    backgroundColor: theme.mainBg,
                    flex: 1,
                    minWidth: 0,
                    minHeight: 0,
                    width: '100%',
                    paddingTop: 5,
                }}
            >
                <Row
                    style={{
                        height: 70,
                        width: '100%',
                        flexShrink: 0,
                        backgroundColor: 'transparent',
                    }}
                    centerContainerStyle={{ flex: undefined }}
                    leftContainerStyle={{ height: '100%', flex: 1 }}
                    leftComponent={
                        <View style={{ width: '100%', paddingHorizontal: 10 }}>
                            <TextInput
                                value={searchInput}
                                style={{
                                    borderWidth: 0.5,
                                    borderRadius: 10,
                                    borderColor: '#999',
                                    height: 60,
                                    width: '100%',
                                    paddingHorizontal: 8,
                                }}
                                placeholderTextColor={theme.textBoxPlaceholder}
                                placeholder={'Search for a model by name or id'}
                                accessibilityLabel="Search for a model by name or id"
                                onChangeText={(text) => {
                                    if (text.length) {
                                        if (onSearch) {
                                            onSearch(text);
                                        }
                                    } else {
                                        if (onSearchEnd) {
                                            onSearchEnd();
                                        }
                                    }
                                }}
                            />
                        </View>
                    }
                    rightContainerStyle={{ height: '100%', flex: undefined }}
                    rightComponent={<ModalCloseButton onPress={closeModal} />}
                />
                <CatalogStatus
                    status={status}
                    hasItems={data.length > 0}
                    error={error}
                    onRetry={onRetry}
                />
                <FlatList
                    style={{ flex: 1, minWidth: 0, minHeight: 0, width: '100%' }}
                    data={data}
                    keyExtractor={(item) => String(item.id)}
                    onEndReached={onLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        <CatalogStatus
                            status={status}
                            hasItems={data.length > 0}
                            error={error}
                            onRetry={onRetry}
                            isLoadingMore={status === 'loading' && data.length > 0}
                            loadMoreError={loadMoreError}
                        />
                    }
                    renderItem={({ item }) => (
                        <CatalogRow
                            item={item}
                            selected={item.id === selectedItemId}
                            onSelect={selectModel}
                            theme={theme}
                        />
                    )}
                />
            </View>
        </MobileModal>
    );
};

export default React.memo(ModelList);
