import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { StyleSheet, View } from 'react-native-web';
import ColorPicker from 'src/components/ColorPicker';
import Header from 'src/components/Header';
import MenuDesktop from 'src/components/Menu/Desktop';
import MenuMobile from 'src/components/Menu/Mobile';
import TextureMenuMobile from 'src/components/Menu/Mobile/TextureMenuMobile';
import ModelInfo from 'src/components/ModelInfo';
import ModelStage from 'src/components/ModelStage';
import VehicleModPicker from 'src/components/VehicleModPicker';
import VehicleColorPicker from 'src/components/VehicleColorPicker';
import AnimationBrowser from 'src/components/AnimationBrowser';
import TextureMenuDesktop from 'src/components/Menu/TextureDesktop';
import TextureStage from 'src/components/TextureStage';
import TextureGrid from 'src/components/TextureGrid';
import TextureUsageList from 'src/components/TextureUsageList';
import { ThemeProvider } from 'src/theme/ThemeContext';
import type { ModelType } from 'src/domain/catalog';
import { getCatalogInfoRows, getTextureInfoRows } from 'src/domain/catalogInfo';
import { textureClient } from 'src/catalog/textureClient';
import { backgroundColors } from 'src/theme/colorPalette';
import { vehicleColorOptions } from 'src/domain/vehicleColors';
import { useCatalogQuery } from 'src/hooks/useCatalogQuery';
import { useResponsiveView } from 'src/hooks/useResponsiveView';
import { useModelSelection } from 'src/hooks/useModelSelection';
import { useThemeController } from 'src/hooks/useThemeController';
import { useTextureQuery } from 'src/hooks/useTextureQuery';
import { useTextureSelection } from 'src/hooks/useTextureSelection';
import type { TextureListItem, TextureUsage } from 'src/domain/textureCatalog';
import type { CatalogListItem } from 'src/domain/catalog';
import type { ParsedAnimation } from 'src/animation/ifpParser';
import type { AnimationSelection } from 'src/components/AnimationBrowser';
import { useShareableUrl } from 'src/hooks/useShareableUrl';
import {
    DEFAULT_SHAREABLE_URL_STATE,
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
    const [texturesSelected, setTexturesSelected] = useState(false);
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
    const requestedPendingModel = useRef<ShareableUrlState | null>(null);
    const openModelTexture = useRef<string | null>(null);
    const {
        ready: shareableUrlReady,
        hasQuery: shareableUrlHasQuery,
        state: shareableUrlState,
        pushState,
    } = useShareableUrl();
    const { themeMode, theme, backgroundSelection, onThemeModeChange, onSelectColor } =
        useThemeController();
    const catalogQuery = useCatalogQuery(modelType);
    const textureQuery = useTextureQuery(texturesSelected);
    const {
        request: textureRequest,
        texture,
        textureStatus,
        textureError,
        selectTexture,
        retryTexture,
    } = useTextureSelection();
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
        const pending = pendingUrlState.current;
        const isPendingUrlSelection =
            pending?.animationLibraryId === selection.libraryId &&
            pending.animationName === selection.animationName;

        setSelectedAnimation(selection.animation);
        setAnimationSelection(selection);
        setAnimationTarget({
            libraryId: selection.libraryId,
            animationName: selection.animationName,
        });
        if (!isPendingUrlSelection) {
            localUrlChange.current = true;
            restoringUrl.current = false;
            syncUrlEnabled.current = true;
        }
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
            setTexturesSelected(false);
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
                texturesSelected: false,
                textureDictionary: null,
                textureName: null,
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
                texturesSelected: false,
                textureDictionary: null,
                textureName: null,
            });
        },
        [backgroundSelection, modelType, onSelectItem, pushState]
    );

    const urlTexture = useMemo<TextureListItem | null>(
        () => (textureRequest?.txd ? { txd: textureRequest.txd, name: textureRequest.name } : null),
        [textureRequest]
    );
    const pushTextureState = useCallback(
        (texture: TextureListItem | null): void => {
            localUrlChange.current = true;
            restoringUrl.current = false;
            syncUrlEnabled.current = true;
            pushState({
                ...DEFAULT_SHAREABLE_URL_STATE,
                modelType,
                backgroundColor:
                    backgroundSelection.source === 'custom' ? backgroundSelection.color : null,
                texturesSelected: true,
                textureDictionary: texture?.txd ?? null,
                textureName: texture?.name ?? null,
            });
        },
        [backgroundSelection, modelType, pushState]
    );
    const handleSelectTexturesTab = useCallback((): void => {
        setTexturesSelected(true);
        pushTextureState(urlTexture);
    }, [pushTextureState, urlTexture]);
    const handleSelectTexture = useCallback(
        (texture: TextureListItem): void => {
            if (texture.txd === urlTexture?.txd && texture.name === urlTexture.name) {
                return;
            }

            selectTexture({ name: texture.name, txd: texture.txd });
            pushTextureState(texture);
        },
        [pushTextureState, selectTexture, urlTexture]
    );
    const handleOpenModelTexture = useCallback(
        (name: string): void => {
            if (!info) {
                return;
            }

            const source = { type: modelType, id: info.id };
            const requestKey = `${modelType}:${info.id}:${name}`;
            openModelTexture.current = requestKey;
            textureClient.getItem(name, source).then(
                ({ item }) => {
                    if (openModelTexture.current !== requestKey) {
                        return;
                    }

                    openModelTexture.current = null;
                    setTexturesSelected(true);
                    if (item.txd !== urlTexture?.txd || item.name !== urlTexture.name) {
                        selectTexture({ name: item.name, txd: item.txd });
                    }
                    pushTextureState(item);
                },
                () => {
                    if (openModelTexture.current !== requestKey) {
                        return;
                    }

                    openModelTexture.current = null;
                    setTexturesSelected(true);
                    selectTexture({ name, ...source });
                    pushTextureState(null);
                }
            );
        },
        [info, modelType, pushTextureState, selectTexture, urlTexture]
    );
    useEffect(() => {
        openModelTexture.current = null;
    }, [info, modelType, texturesSelected]);
    const handleOpenTextureUsage = useCallback(
        (usage: TextureUsage): void => {
            pushState({
                ...DEFAULT_SHAREABLE_URL_STATE,
                modelType: usage.type,
                modelId: usage.id,
                backgroundColor:
                    backgroundSelection.source === 'custom' ? backgroundSelection.color : null,
            });
        },
        [backgroundSelection, pushState]
    );
    const modelTextureNames = useMemo(
        () => models[0]?.textures.map((item) => item.name) ?? [],
        [models]
    );
    const textureRows = useMemo(() => (texture ? getTextureInfoRows(texture) : []), [texture]);

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
            texturesSelected,
            textureDictionary: texturesSelected ? (urlTexture?.txd ?? null) : null,
            textureName: texturesSelected ? (urlTexture?.name ?? null) : null,
        }),
        [
            animationSelection,
            backgroundSelection,
            info,
            modelType,
            selectedModelType,
            selectedModificationIds,
            texturesSelected,
            urlTexture,
            vehicleColor,
            vehicleColorsChanged,
        ]
    );
    const handleSelectModelType = useCallback(
        (type: { value: ModelType }): void => {
            if (!texturesSelected || type.value !== modelType) {
                handleModelTypeChange(type);
                return;
            }

            setTexturesSelected(false);
            localUrlChange.current = true;
            restoringUrl.current = false;
            syncUrlEnabled.current = true;
            pushState({
                ...shareableState,
                texturesSelected: false,
                textureDictionary: null,
                textureName: null,
            });
        },
        [handleModelTypeChange, modelType, pushState, shareableState, texturesSelected]
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
        if (isInitialUrl) {
            requestedPendingModel.current = shareableUrlState;
        }
        setSelectedAnimation(null);
        setAnimationSelection({ libraryId: null, animationName: null, animation: null });
        setAnimationTarget({
            libraryId: shareableUrlState.animationLibraryId,
            animationName: shareableUrlState.animationName,
        });
        setVehicleColorsChanged(
            shareableUrlState.primaryColorId !== null || shareableUrlState.secondaryColorId !== null
        );

        setTexturesSelected(shareableUrlState.texturesSelected);
        if (shareableUrlState.texturesSelected) {
            selectTexture(
                shareableUrlState.textureDictionary && shareableUrlState.textureName
                    ? {
                          name: shareableUrlState.textureName,
                          txd: shareableUrlState.textureDictionary,
                      }
                    : null
            );
            return;
        }

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
        selectTexture,
        shareableUrlReady,
        shareableUrlHasQuery,
        shareableUrlState,
    ]);

    useEffect(() => {
        const pending = pendingUrlState.current;
        if (!shareableUrlReady || !pending) {
            return;
        }
        if (pending.texturesSelected) {
            const textureRestored =
                pending.textureName === null ||
                (textureRequest?.txd === pending.textureDictionary &&
                    textureRequest?.name === pending.textureName &&
                    textureStatus !== 'loading');
            if (texturesSelected && textureRestored) {
                restoringUrl.current = false;
                pendingUrlState.current = null;
            }
            return;
        }
        if (modelType !== pending.modelType) {
            return;
        }
        if (pending.modelId !== null && info?.id !== pending.modelId) {
            if (
                modelStatus === 'idle' &&
                selectedModelType === null &&
                requestedPendingModel.current !== pending
            ) {
                requestedPendingModel.current = pending;
                onSelectModelId(pending.modelId);
            }
            return;
        }
        if (pending.modelId !== null && modelStatus === 'loading') {
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
        onSelectModelId,
        onSelectVehicleColor,
        onSetModificationIds,
        pendingUrlState,
        selectedModelType,
        selectedModificationIds,
        shareableUrlReady,
        textureRequest,
        texturesSelected,
        textureStatus,
        vehicleColor,
    ]);

    useEffect(() => {
        if (
            !shareableUrlReady ||
            !syncUrlEnabled.current ||
            restoringUrl.current ||
            (texturesSelected ? !urlTexture : !info)
        ) {
            return;
        }

        if (window.location.search === serializeShareableUrl(shareableState)) {
            localUrlChange.current = false;
            return;
        }

        pushState(shareableState);
    }, [info, pushState, shareableState, shareableUrlReady, texturesSelected, urlTexture]);
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
                    texturesSelected={texturesSelected}
                    onSelectTextures={handleSelectTexturesTab}
                    themeMode={themeMode}
                    onThemeModeChange={onThemeModeChange}
                    onModelTypeChange={handleSelectModelType}
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
                    {isMobileView && texturesSelected ? (
                        <TextureMenuMobile
                            texture={texture}
                            textureData={textureRows}
                            textureQuery={textureQuery}
                            onSelectTexture={handleSelectTexture}
                            onSelectUsage={handleOpenTextureUsage}
                            onSelectColor={handleBackgroundColor}
                            selectedColor={backgroundSelection.color}
                        />
                    ) : isMobileView ? (
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
                            textures={modelTextureNames}
                            onOpenTexture={handleOpenModelTexture}
                        />
                    ) : texturesSelected ? (
                        <View style={styles.desktopMenuColumn}>
                            <TextureMenuDesktop
                                selectedTexture={texture}
                                onSelectTexture={handleSelectTexture}
                                textureQuery={textureQuery}
                            />
                        </View>
                    ) : (
                        <View style={styles.desktopMenuColumn}>
                            <MenuDesktop
                                selectedItemId={
                                    selectedModelType === modelType && info ? info.id : -1
                                }
                                onSelectItem={handleSelectItem}
                                catalogQuery={catalogQuery}
                                uniformRows={modelType === 'object'}
                            />
                        </View>
                    )}
                    {texturesSelected ? (
                        <TextureStage
                            texture={texture}
                            status={textureStatus}
                            error={textureError}
                            backgroundColor={backgroundSelection.color}
                            retry={retryTexture}
                            isMobileView={isMobileView}
                        />
                    ) : (
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
                    )}
                    {isMobileView ? null : texturesSelected ? (
                        <View style={styles.desktopDetailsColumn}>
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
                                title="Texture info"
                                style={{ marginBottom: 14 }}
                                data={textureRows}
                                collapsible
                            />
                            {texture && (
                                <>
                                    <TextureUsageList
                                        style={{ marginBottom: 14 }}
                                        usage={texture.usedBy}
                                        onSelect={handleOpenTextureUsage}
                                    />
                                    <TextureGrid
                                        title={`In ${texture.txd}.txd`}
                                        style={{ marginBottom: 14 }}
                                        textures={texture.dictionary}
                                        selectedName={texture.name}
                                        emptyText="This texture file is empty."
                                        onSelect={(name) =>
                                            handleSelectTexture({ txd: texture.txd, name })
                                        }
                                    />
                                </>
                            )}
                        </View>
                    ) : (
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
                            <TextureGrid
                                title="Textures"
                                style={{ marginBottom: 14 }}
                                textures={modelTextureNames}
                                emptyText="No model selected."
                                onSelect={handleOpenModelTexture}
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
