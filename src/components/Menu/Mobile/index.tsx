import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native-web';
import ModelList from './ModelList';
import type { CatalogListItem, InfoRow, ModelType } from 'src/domain/catalog';
import type { UseCatalogQueryResult } from 'src/hooks/useCatalogQuery';
import ModalInfoMobile from './ModelInfoMobile';
import { useTheme } from 'src/theme/ThemeContext';
import BGColorPicker from './BGColorPicker';
import VehicleModPickerMobile from './VehicleModPickerMobile';
import type { VehicleModification } from 'src/domain/vehicleModifications';

interface Props {
    selectedItemId: number;
    onSelectItem: (model: CatalogListItem) => void;
    onSelectColor: (color: string) => void;
    selectedColor: string;
    modelData: InfoRow[];
    catalogQuery: UseCatalogQueryResult;
    modelType: ModelType;
    modifications: readonly VehicleModification[];
    selectedModificationIds: readonly number[];
    onToggleModification: (modification: VehicleModification) => void;
}

const MenuMobile = ({
    selectedItemId,
    onSelectItem,
    onSelectColor,
    selectedColor,
    modelData,
    catalogQuery,
    modelType,
    modifications,
    selectedModificationIds,
    onToggleModification,
}: Props) => {
    const [listVisible, setListVisible] = useState(false);
    const [bgColorModalVisible, setBgColorModalVisible] = useState(false);
    const [modelInfoModalVisible, setModelInfoModalVisible] = useState(false);
    const [vehicleModModalVisible, setVehicleModModalVisible] = useState(false);
    const { theme } = useTheme();

    return (
        <>
            <View
                style={{
                    alignItems: 'center',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    paddingHorizontal: 8,
                    paddingBottom: 4,
                    backgroundColor: theme.mainBg,
                    width: '100%',
                }}
            >
                <TouchableOpacity
                    style={{
                        alignItems: 'center',
                        borderRadius: 100,
                        height: '3rem',
                        justifyContent: 'center',
                        marginRight: 4,
                        width: '3rem',
                    }}
                    onPress={() => setListVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Open model selector"
                >
                    <View accessibilityElementsHidden style={{ width: 22 }}>
                        <View style={{ backgroundColor: theme.button, height: 2, width: '100%' }} />
                        <View
                            style={{
                                backgroundColor: theme.button,
                                height: 2,
                                marginTop: 4,
                                width: '100%',
                            }}
                        />
                        <View
                            style={{
                                backgroundColor: theme.button,
                                height: 2,
                                marginTop: 4,
                                width: '100%',
                            }}
                        />
                    </View>
                </TouchableOpacity>
                {modelType === 'vehicle' && (
                    <TouchableOpacity
                        style={{
                            alignItems: 'center',
                            borderColor: theme.button,
                            borderRadius: 100,
                            borderWidth: 1.8,
                            height: '2.5rem',
                            justifyContent: 'center',
                            marginBottom: 4,
                            marginRight: 4,
                            paddingHorizontal: 8,
                        }}
                        onPress={() => setVehicleModModalVisible(true)}
                        accessibilityRole="button"
                        accessibilityLabel="Open vehicle modifications selector"
                    >
                        <Text style={{ color: theme.button }}>
                            Vehicle modifications
                            {selectedModificationIds.length
                                ? ` (${selectedModificationIds.length})`
                                : ''}
                        </Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={{
                        alignItems: 'center',
                        borderColor: theme.button,
                        borderRadius: 100,
                        borderWidth: 1.8,
                        height: '2.5rem',
                        justifyContent: 'center',
                        marginBottom: 4,
                        marginRight: 4,
                        paddingHorizontal: 8,
                    }}
                    onPress={() => setBgColorModalVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Open background color selector"
                >
                    <Text style={{ color: theme.button }}>Background color</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        alignItems: 'center',
                        borderColor: theme.button,
                        borderRadius: 100,
                        borderWidth: 1.8,
                        height: '2.5rem',
                        justifyContent: 'center',
                        marginBottom: 4,
                        paddingHorizontal: 8,
                    }}
                    onPress={() => setModelInfoModalVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Open model information"
                >
                    <Text style={{ color: theme.button }}>Model info</Text>
                </TouchableOpacity>
            </View>
            <ModelList
                visible={listVisible}
                onRequestClose={() => setListVisible(false)}
                data={catalogQuery.list}
                searchInput={catalogQuery.searchInput}
                selectedItemId={selectedItemId}
                status={catalogQuery.status}
                error={catalogQuery.error}
                loadMoreError={catalogQuery.loadMoreError}
                onRetry={catalogQuery.retry}
                onLoadMore={catalogQuery.loadMore}
                onSelect={(item) => {
                    onSelectItem(item);
                    setListVisible(false);
                }}
                onSearch={catalogQuery.search}
                onSearchEnd={catalogQuery.clearSearch}
            />
            <BGColorPicker
                isMobileView={true}
                visible={bgColorModalVisible}
                onRequestClose={() => setBgColorModalVisible(false)}
                onSelect={onSelectColor}
                selectedColor={selectedColor}
            />
            <ModalInfoMobile
                data={modelData}
                visible={modelInfoModalVisible}
                onRequestClose={() => setModelInfoModalVisible(false)}
            />
            <VehicleModPickerMobile
                visible={vehicleModModalVisible}
                onRequestClose={() => setVehicleModModalVisible(false)}
                modifications={modifications}
                selectedIds={selectedModificationIds}
                onToggle={onToggleModification}
            />
        </>
    );
};

export default React.memo(MenuMobile);
