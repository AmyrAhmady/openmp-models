import React, { useCallback, useMemo, useState } from 'react';
import type { NextPage } from 'next';
import { StyleSheet, View } from 'react-native-web';
import ColorPicker from 'src/components/ColorPicker';
import Header from 'src/components/Header';
import MenuDesktop from 'src/components/Menu/Desktop';
import MenuMobile from 'src/components/Menu/Mobile';
import ModelInfo from 'src/components/ModelInfo';
import ModelStage from 'src/components/ModelStage';
import VehicleModPicker from 'src/components/VehicleModPicker';
import { ThemeProvider } from 'src/theme/ThemeContext';
import type { ModelType } from 'src/domain/catalog';
import { getCatalogInfoRows } from 'src/domain/catalogInfo';
import { backgroundColors } from 'src/theme/colorPalette';
import { useCatalogQuery } from 'src/hooks/useCatalogQuery';
import { useResponsiveView } from 'src/hooks/useResponsiveView';
import { useModelSelection } from 'src/hooks/useModelSelection';
import { useThemeController } from 'src/hooks/useThemeController';

const Main: NextPage = () => {
    const isMobileView = useResponsiveView();
    const [modelType, setModelType] = useState<ModelType>('vehicle');
    const { themeMode, theme, backgroundSelection, onThemeModeChange, onSelectColor } =
        useThemeController();
    const catalogQuery = useCatalogQuery(modelType);
    const {
        info,
        selectedModelType,
        models,
        modelStatus,
        modelError,
        onModelTypeChange,
        onSelectItem,
        retryModel,
        availableModifications,
        selectedModificationIds,
        onToggleModification,
    } = useModelSelection(modelType);

    const handleModelTypeChange = useCallback(
        (type: { value: ModelType }): void => {
            onModelTypeChange(type);
            setModelType(type.value);
        },
        [onModelTypeChange]
    );
    const infoRows = useMemo(() => (info ? getCatalogInfoRows(info) : []), [info]);

    return (
        <ThemeProvider mode={themeMode}>
            <View style={[styles.container, { backgroundColor: theme.mainBg }]}>
                <Header
                    isMobile={isMobileView}
                    modelType={modelType}
                    themeMode={themeMode}
                    onThemeModeChange={onThemeModeChange}
                    onModelTypeChange={handleModelTypeChange}
                />
                <View
                    style={{
                        flexDirection: isMobileView ? 'column' : 'row',
                        flex: 1,
                        minHeight: 0,
                        minWidth: 0,
                        width: '100%',
                        backgroundColor: theme.mainBg,
                    }}
                >
                    {isMobileView ? (
                        <MenuMobile
                            selectedItemId={selectedModelType === modelType && info ? info.id : -1}
                            onSelectColor={onSelectColor}
                            selectedColor={backgroundSelection.color}
                            modelData={infoRows}
                            onSelectItem={onSelectItem}
                            catalogQuery={catalogQuery}
                            modelType={modelType}
                            modifications={availableModifications}
                            selectedModificationIds={selectedModificationIds}
                            onToggleModification={onToggleModification}
                        />
                    ) : (
                        <View style={styles.desktopMenuColumn}>
                            <MenuDesktop
                                selectedItemId={
                                    selectedModelType === modelType && info ? info.id : -1
                                }
                                onSelectItem={onSelectItem}
                                catalogQuery={catalogQuery}
                            />
                        </View>
                    )}
                    <ModelStage
                        modelType={modelType}
                        info={info}
                        models={models}
                        modelStatus={modelStatus}
                        modelError={modelError}
                        backgroundColor={backgroundSelection.color}
                        retryModel={retryModel}
                        isMobileView={isMobileView}
                    />
                    {isMobileView ? null : (
                        <View style={styles.desktopDetailsColumn}>
                            {modelType === 'vehicle' && (
                                <VehicleModPicker
                                    style={{ marginBottom: 14 }}
                                    modifications={availableModifications}
                                    selectedIds={selectedModificationIds}
                                    onToggle={onToggleModification}
                                    collapsible
                                    initiallyExpanded={false}
                                />
                            )}
                            <ColorPicker
                                isMobileView={isMobileView}
                                title="Background color"
                                style={{ marginBottom: 14 }}
                                colors={backgroundColors}
                                selectedColor={backgroundSelection.color}
                                rows={2}
                                onSelect={onSelectColor}
                                collapsible
                                initiallyExpanded={false}
                            />
                            <ModelInfo
                                title="Model info"
                                style={{ marginBottom: 14 }}
                                data={infoRows}
                                collapsible
                                initiallyExpanded={false}
                            />
                        </View>
                    )}
                </View>
            </View>
        </ThemeProvider>
    );
};

export default Main;

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        height: '100%',
    },
    desktopMenuColumn: {
        width: 300,
        flexShrink: 0,
        height: '100%',
    },
    desktopDetailsColumn: {
        width: 320,
        flexShrink: 0,
        height: '100%',
        padding: 18,
    },
});
