import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { StyleSheet, View } from 'react-native-web';
import ColorPicker from 'src/components/ColorPicker';
import Header from 'src/components/Header';
import MenuDesktop from 'src/components/Menu/Desktop';
import MenuMobile from 'src/components/Menu/Mobile';
import ModelInfo from 'src/components/ModelInfo';
import ModelStage from 'src/components/ModelStage';
import VehicleModPicker from 'src/components/VehicleModPicker';
import VehicleColorPicker from 'src/components/VehicleColorPicker';
import AnimationBrowser from 'src/components/AnimationBrowser';
import { ThemeProvider } from 'src/theme/ThemeContext';
import type { ModelType } from 'src/domain/catalog';
import { getCatalogInfoRows } from 'src/domain/catalogInfo';
import { backgroundColors } from 'src/theme/colorPalette';
import { vehicleColorOptions } from 'src/domain/vehicleColors';
import { useCatalogQuery } from 'src/hooks/useCatalogQuery';
import { useResponsiveView } from 'src/hooks/useResponsiveView';
import { useModelSelection } from 'src/hooks/useModelSelection';
import { useThemeController } from 'src/hooks/useThemeController';
import type { CatalogListItem } from 'src/domain/catalog';
import type { ParsedAnimation } from 'src/animation/ifpParser';
import type { AnimationSelection } from 'src/components/AnimationBrowser';
import { useShareableUrl } from 'src/hooks/useShareableUrl';
import {
    parseShareableUrl,
    serializeShareableUrl,
    type ShareableUrlState,
} from 'src/domain/shareableUrl';
import { getPageMetadata, type PageMetadata } from 'src/domain/pageMetadata';

interface MainProps {
    initialMetadata: PageMetadata;
}

const Main: NextPage<MainProps> = ({ initialMetadata }) => {
    const isMobileView = useResponsiveView();
    const [modelType, setModelType] = useState<ModelType>('vehicle');
    const [selectedAnimation, setSelectedAnimation] = useState<ParsedAnimation | null>(null);
    const [animationSelection, setAnimationSelection] = useState<AnimationSelection>({
        libraryId: null,
        animationName: null,
        animation: null,
    });
    const [animationTarget, setAnimationTarget] = useState({
        libraryId: null as string | null,
        animationName: null as string | null,
    });
    const [vehicleColorsChanged, setVehicleColorsChanged] = useState(false);
    const syncUrlEnabled = useRef(false);
    const restoringUrl = useRef(true);
    const seenUrlKey = useRef<string | null>(null);
    const localUrlChange = useRef(false);
    const pendingUrlState = useRef<ShareableUrlState | null>(null);
    const {
        ready: shareableUrlReady,
        hasQuery: shareableUrlHasQuery,
        state: shareableUrlState,
        pushState,
    } = useShareableUrl();
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
        onSetModificationIds,
        vehicleColor,
        onSelectVehicleColor,
        onSelectModelId,
    } = useModelSelection(modelType, {
        ready: shareableUrlReady,
        type: shareableUrlState.modelType,
        modelId: shareableUrlState.modelId,
    });

    const handleAnimationSelection = useCallback((selection: AnimationSelection): void => {
        setSelectedAnimation(selection.animation);
        setAnimationSelection(selection);
        setAnimationTarget({
            libraryId: selection.libraryId,
            animationName: selection.animationName,
        });
        localUrlChange.current = true;
        restoringUrl.current = false;
        syncUrlEnabled.current = true;
    }, []);

    const handleVehicleModification = useCallback(
        (modification: Parameters<typeof onToggleModification>[0]): void => {
            localUrlChange.current = true;
            restoringUrl.current = false;
            syncUrlEnabled.current = true;
            onToggleModification(modification);
        },
        [onToggleModification]
    );

    const handleBackgroundColor = useCallback(
        (color: string): void => {
            localUrlChange.current = true;
            restoringUrl.current = false;
            syncUrlEnabled.current = true;
            onSelectColor(color);
        },
        [onSelectColor]
    );

    const handleVehicleColor = useCallback(
        (slot: 'primary' | 'secondary', colorId: number): void => {
            setVehicleColorsChanged(true);
            localUrlChange.current = true;
            restoringUrl.current = false;
            syncUrlEnabled.current = true;
            onSelectVehicleColor(slot, colorId);
        },
        [onSelectVehicleColor]
    );

    const handleModelTypeChange = useCallback(
        (type: { value: ModelType }): void => {
            setSelectedAnimation(null);
            setAnimationSelection({ libraryId: null, animationName: null, animation: null });
            setAnimationTarget({ libraryId: null, animationName: null });
            setVehicleColorsChanged(false);
            onModelTypeChange(type);
            setModelType(type.value);
            localUrlChange.current = true;
            restoringUrl.current = false;
            syncUrlEnabled.current = true;
            pushState({
                modelType: type.value,
                modelId: null,
                animationLibraryId: null,
                animationName: null,
                modificationIds: [],
                primaryColorId: null,
                secondaryColorId: null,
                backgroundColor:
                    backgroundSelection.source === 'custom' ? backgroundSelection.color : null,
            });
        },
        [backgroundSelection, onModelTypeChange, pushState]
    );
    const handleSelectItem = useCallback(
        (item: CatalogListItem): void => {
            setSelectedAnimation(null);
            setAnimationSelection({ libraryId: null, animationName: null, animation: null });
            setAnimationTarget({ libraryId: null, animationName: null });
            setVehicleColorsChanged(false);
            onSelectItem(item);
            localUrlChange.current = true;
            restoringUrl.current = false;
            syncUrlEnabled.current = true;
            pushState({
                modelType,
                modelId: item.id,
                animationLibraryId: null,
                animationName: null,
                modificationIds: [],
                primaryColorId: null,
                secondaryColorId: null,
                backgroundColor:
                    backgroundSelection.source === 'custom' ? backgroundSelection.color : null,
            });
        },
        [backgroundSelection, modelType, onSelectItem, pushState]
    );

    const shareableState = useMemo<ShareableUrlState>(
        () => ({
            modelType,
            modelId: selectedModelType === modelType && info ? info.id : null,
            animationLibraryId: modelType === 'skin' ? animationSelection.libraryId : null,
            animationName: modelType === 'skin' ? animationSelection.animationName : null,
            modificationIds: modelType === 'vehicle' ? [...selectedModificationIds] : [],
            primaryColorId:
                modelType === 'vehicle' && vehicleColorsChanged
                    ? (vehicleColor?.primary ?? null)
                    : null,
            secondaryColorId:
                modelType === 'vehicle' && vehicleColorsChanged
                    ? (vehicleColor?.secondary ?? null)
                    : null,
            backgroundColor:
                backgroundSelection.source === 'custom' ? backgroundSelection.color : null,
        }),
        [
            animationSelection,
            backgroundSelection,
            info,
            modelType,
            selectedModelType,
            selectedModificationIds,
            vehicleColor,
            vehicleColorsChanged,
        ]
    );

    useEffect(() => {
        if (!shareableUrlReady) {
            return;
        }

        const urlKey = serializeShareableUrl(shareableUrlState);
        if (seenUrlKey.current === urlKey) {
            return;
        }

        if (localUrlChange.current) {
            localUrlChange.current = false;
            seenUrlKey.current = urlKey;
            restoringUrl.current = false;
            pendingUrlState.current = null;
            syncUrlEnabled.current = shareableUrlHasQuery;
            return;
        }

        const isInitialUrl = seenUrlKey.current === null;
        seenUrlKey.current = urlKey;
        restoringUrl.current = true;
        syncUrlEnabled.current = shareableUrlHasQuery;
        pendingUrlState.current = shareableUrlState;
        setSelectedAnimation(null);
        setAnimationSelection({ libraryId: null, animationName: null, animation: null });
        setAnimationTarget({
            libraryId: shareableUrlState.animationLibraryId,
            animationName: shareableUrlState.animationName,
        });
        setVehicleColorsChanged(
            shareableUrlState.primaryColorId !== null || shareableUrlState.secondaryColorId !== null
        );

        if (modelType !== shareableUrlState.modelType) {
            onModelTypeChange({ value: shareableUrlState.modelType });
            setModelType(shareableUrlState.modelType);
        } else if (!isInitialUrl && shareableUrlState.modelId !== null) {
            onSelectModelId(shareableUrlState.modelId);
        }
    }, [
        modelType,
        onModelTypeChange,
        onSelectModelId,
        shareableUrlReady,
        shareableUrlHasQuery,
        shareableUrlState,
    ]);

    useEffect(() => {
        const pending = pendingUrlState.current;
        if (!shareableUrlReady || !pending || modelType !== pending.modelType) {
            return;
        }
        if (
            pending.modelId !== null &&
            (info?.id !== pending.modelId || modelStatus === 'loading')
        ) {
            return;
        }
        if (pending.modelId === null && modelStatus === 'loading') {
            return;
        }

        if (modelType === 'vehicle') {
            const validIds = pending.modificationIds.filter((id) =>
                availableModifications.some((modification) => Number(modification.id) === id)
            );
            const selectedIds = [...selectedModificationIds].sort((left, right) => left - right);
            const requestedIds = [...validIds].sort((left, right) => left - right);
            if (selectedIds.join(',') !== requestedIds.join(',')) {
                onSetModificationIds(validIds);
                return;
            }
            if (
                pending.primaryColorId !== null &&
                vehicleColor?.primary !== pending.primaryColorId
            ) {
                onSelectVehicleColor('primary', pending.primaryColorId);
                return;
            }
            if (
                pending.secondaryColorId !== null &&
                vehicleColor?.secondary !== pending.secondaryColorId
            ) {
                onSelectVehicleColor('secondary', pending.secondaryColorId);
                return;
            }
        }

        if (pending.backgroundColor && backgroundSelection.color !== pending.backgroundColor) {
            onSelectColor(pending.backgroundColor);
            return;
        }

        if (
            modelType === 'skin' &&
            pending.animationLibraryId &&
            pending.animationName &&
            (animationSelection.libraryId !== pending.animationLibraryId ||
                animationSelection.animationName !== pending.animationName)
        ) {
            return;
        }

        restoringUrl.current = false;
        pendingUrlState.current = null;
    }, [
        animationSelection,
        availableModifications,
        backgroundSelection,
        info,
        modelStatus,
        modelType,
        onSelectColor,
        onSelectVehicleColor,
        onSetModificationIds,
        pendingUrlState,
        selectedModificationIds,
        shareableUrlReady,
        vehicleColor,
    ]);

    useEffect(() => {
        if (!shareableUrlReady || !syncUrlEnabled.current || restoringUrl.current || !info) {
            return;
        }

        if (window.location.search === serializeShareableUrl(shareableState)) {
            localUrlChange.current = false;
            return;
        }

        pushState(shareableState);
    }, [info, pushState, shareableState, shareableUrlReady]);
    const infoRows = useMemo(() => (info ? getCatalogInfoRows(info) : []), [info]);
    const metadataItem =
        shareableUrlState.modelId !== null &&
        selectedModelType === shareableUrlState.modelType &&
        info?.id === shareableUrlState.modelId
            ? info
            : null;
    const pageMetadata = shareableUrlReady
        ? getPageMetadata(shareableUrlState, shareableUrlHasQuery, metadataItem)
        : initialMetadata;

    return (
        <ThemeProvider mode={themeMode}>
            <Head>
                <title>{pageMetadata.title}</title>
                <meta name="description" content={pageMetadata.description} />
                <meta property="og:type" content="website" />
                <meta property="og:title" content={pageMetadata.title} />
                <meta property="og:description" content={pageMetadata.description} />
                <meta name="twitter:card" content="summary" />
                <meta name="twitter:title" content={pageMetadata.title} />
                <meta name="twitter:description" content={pageMetadata.description} />
            </Head>
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
                            onSelectColor={handleBackgroundColor}
                            selectedColor={backgroundSelection.color}
                            modelData={infoRows}
                            onSelectItem={handleSelectItem}
                            catalogQuery={catalogQuery}
                            modelType={modelType}
                            modifications={availableModifications}
                            selectedModificationIds={selectedModificationIds}
                            onToggleModification={handleVehicleModification}
                            primaryVehicleColorId={vehicleColor?.primary ?? 0}
                            secondaryVehicleColorId={vehicleColor?.secondary ?? 0}
                            onSelectVehicleColor={handleVehicleColor}
                            onSelectAnimation={setSelectedAnimation}
                            onSelectionChange={handleAnimationSelection}
                            initialAnimationLibraryId={animationTarget.libraryId}
                            initialAnimationName={animationTarget.animationName}
                        />
                    ) : (
                        <View style={styles.desktopMenuColumn}>
                            <MenuDesktop
                                selectedItemId={
                                    selectedModelType === modelType && info ? info.id : -1
                                }
                                onSelectItem={handleSelectItem}
                                catalogQuery={catalogQuery}
                            />
                        </View>
                    )}
                    <ModelStage
                        modelType={modelType}
                        info={info}
                        models={models}
                        animation={selectedAnimation}
                        modelStatus={modelStatus}
                        modelError={modelError}
                        backgroundColor={backgroundSelection.color}
                        retryModel={retryModel}
                        isMobileView={isMobileView}
                    />
                    {isMobileView ? null : (
                        <View style={styles.desktopDetailsColumn}>
                            {modelType === 'skin' && (
                                <AnimationBrowser
                                    style={{ marginBottom: 14 }}
                                    collapsible
                                    initiallyExpanded={true}
                                    onSelectAnimation={setSelectedAnimation}
                                    onSelectionChange={handleAnimationSelection}
                                    initialLibraryId={animationTarget.libraryId}
                                    initialAnimationName={animationTarget.animationName}
                                />
                            )}
                            {modelType === 'vehicle' && (
                                <>
                                    <VehicleModPicker
                                        style={{ marginBottom: 14 }}
                                        modifications={availableModifications}
                                        selectedIds={selectedModificationIds}
                                        onToggle={handleVehicleModification}
                                        collapsible
                                        initiallyExpanded={false}
                                    />
                                    <VehicleColorPicker
                                        style={{ marginBottom: 14 }}
                                        colors={vehicleColorOptions}
                                        primaryColorId={vehicleColor?.primary ?? 0}
                                        secondaryColorId={vehicleColor?.secondary ?? 0}
                                        onSelect={handleVehicleColor}
                                        collapsible
                                        initiallyExpanded={false}
                                    />
                                </>
                            )}
                            <ColorPicker
                                isMobileView={isMobileView}
                                title="Background color"
                                style={{ marginBottom: 14 }}
                                colors={backgroundColors}
                                selectedColor={backgroundSelection.color}
                                rows={2}
                                onSelect={handleBackgroundColor}
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

export const getServerSideProps: GetServerSideProps<MainProps> = async ({ resolvedUrl }) => {
    const queryStart = resolvedUrl.indexOf('?');
    const search = queryStart === -1 ? '' : resolvedUrl.slice(queryStart);
    const { findCatalogItem } = await import('src/catalog/catalogRegistry');
    const state = parseShareableUrl(search);
    const item = state.modelId === null ? null : findCatalogItem(state.modelType, state.modelId);

    return {
        props: {
            initialMetadata: getPageMetadata(state, search.length > 0, item ?? null),
        },
    };
};

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
