import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { StyleSheet, View } from 'react-native-web';
import ColorPicker from 'src/components/ColorPicker';
import Header from 'src/components/Header';
import MenuDesktop from 'src/components/Menu/Desktop';
import MenuMobile from 'src/components/Menu/Mobile';
import TextureMenuMobile from 'src/components/Menu/Mobile/TextureMenuMobile';
import MapMenuMobile from 'src/components/Menu/Mobile/MapMenuMobile';
import MapMenuDesktop from 'src/components/Menu/MapDesktop';
import MapStage from 'src/components/MapStage';
import ModelInfo from 'src/components/ModelInfo';
import ModelMap from 'src/components/ModelMap';
import ModelStage from 'src/components/ModelStage';
import VehicleModPicker from 'src/components/VehicleModPicker';
import VehicleColorPicker from 'src/components/VehicleColorPicker';
import AnimationBrowser from 'src/components/AnimationBrowser';
import TextureMenuDesktop from 'src/components/Menu/TextureDesktop';
import TextureStage from 'src/components/TextureStage';
import TextureGrid from 'src/components/TextureGrid';
import TextureUsageList from 'src/components/TextureUsageList';
import GlobalSearch from 'src/components/GlobalSearch';
import MobileModal from 'src/components/MobileModal';
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
import { usePreviewMode } from 'src/hooks/usePreviewMode';
import { useTextureSelection } from 'src/hooks/useTextureSelection';
import { useNearbyObjects } from 'src/hooks/useNearbyObjects';
import type { MapPoint, NearbyObject } from 'src/domain/placementCatalog';
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
    const [mapSelected, setMapSelected] = useState(false);
    const [mapPoint, setMapPoint] = useState<MapPoint | null>(null);
    const [searchVisible, setSearchVisible] = useState(false);
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
    const clearedPendingModel = useRef<ShareableUrlState | null>(null);
    const openModelTexture = useRef<string | null>(null);
    const pendingListSearch = useRef<{
        type: ModelType;
        query: string;
        list: CatalogListItem[];
    } | null>(null);
    const {
        ready: shareableUrlReady,
        hasQuery: shareableUrlHasQuery,
        state: shareableUrlState,
        pushState,
    } = useShareableUrl();
    const { themeMode, theme, backgroundSelection, onThemeModeChange, onSelectColor } =
        useThemeController();
    const { previewMode, onPreviewModeChange } = usePreviewMode();
    const catalogQuery = useCatalogQuery(modelType);
    const textureQuery = useTextureQuery(texturesSelected);
    const nearby = useNearbyObjects(mapSelected ? mapPoint : null);
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
        onClearSelection,
        onSelectItem,
        retryModel,
        availableModifications,
        selectedModificationIds,
        onToggleModification,
        onSetModificationIds,
        vehicleColor,
        onSelectVehicleColor,
        onSelectModelId,
    } = useModelSelection(
        modelType,
        {
            ready: shareableUrlReady,
            type: shareableUrlState.modelType,
            modelId: shareableUrlState.modelId,
        },
        shareableUrlReady &&
            previewMode === 'model' &&
            !texturesSelected &&
            !mapSelected &&
            !shareableUrlState.texturesSelected &&
            !shareableUrlState.mapSelected
    );

    const pushLocalState = useCallback(
        (state: ShareableUrlState): void => {
            localUrlChange.current = window.location.search !== serializeShareableUrl(state);
            restoringUrl.current = false;
            syncUrlEnabled.current = true;
            pushState(state);
        },
        [pushState]
    );

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
            setMapSelected(false);
            setSelectedAnimation(null);
            setAnimationSelection({ libraryId: null, animationName: null, animation: null });
            setAnimationTarget({ libraryId: null, animationName: null });
            setVehicleColorsChanged(false);
            onModelTypeChange(type);
            setModelType(type.value);
            pushLocalState({
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
                mapSelected: false,
                mapX: null,
                mapY: null,
            });
        },
        [backgroundSelection, onModelTypeChange, pushLocalState]
    );
    const handleSelectItem = useCallback(
        (item: CatalogListItem): void => {
            setSelectedAnimation(null);
            setAnimationSelection({ libraryId: null, animationName: null, animation: null });
            setAnimationTarget({ libraryId: null, animationName: null });
            setVehicleColorsChanged(false);
            onSelectItem(item);
            pushLocalState({
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
                mapSelected: false,
                mapX: null,
                mapY: null,
            });
        },
        [backgroundSelection, modelType, onSelectItem, pushLocalState]
    );

    const urlTexture = useMemo<TextureListItem | null>(
        () => (textureRequest?.txd ? { txd: textureRequest.txd, name: textureRequest.name } : null),
        [textureRequest]
    );
    const pushTextureState = useCallback(
        (item: TextureListItem | null): void => {
            pushLocalState({
                ...DEFAULT_SHAREABLE_URL_STATE,
                modelType,
                backgroundColor:
                    backgroundSelection.source === 'custom' ? backgroundSelection.color : null,
                texturesSelected: true,
                textureDictionary: item?.txd ?? null,
                textureName: item?.name ?? null,
            });
        },
        [backgroundSelection, modelType, pushLocalState]
    );
    const handleSelectTexturesTab = useCallback((): void => {
        setMapSelected(false);
        setTexturesSelected(true);
        pushTextureState(urlTexture);
    }, [pushTextureState, urlTexture]);
    const pushMapState = useCallback(
        (point: MapPoint | null): void => {
            pushLocalState({
                ...DEFAULT_SHAREABLE_URL_STATE,
                modelType,
                backgroundColor:
                    backgroundSelection.source === 'custom' ? backgroundSelection.color : null,
                mapSelected: true,
                mapX: point?.x ?? null,
                mapY: point?.y ?? null,
            });
        },
        [backgroundSelection, modelType, pushLocalState]
    );
    const handleSelectMapTab = useCallback((): void => {
        setTexturesSelected(false);
        setMapSelected(true);
        pushMapState(mapPoint);
    }, [mapPoint, pushMapState]);
    const handleSelectMapPoint = useCallback(
        (point: MapPoint): void => {
            const rounded = { x: Math.round(point.x), y: Math.round(point.y) };
            setMapPoint(rounded);
            pushMapState(rounded);
        },
        [pushMapState]
    );
    const handleSelectTexture = useCallback(
        (item: TextureListItem): void => {
            if (item.txd === urlTexture?.txd && item.name === urlTexture.name) {
                return;
            }

            selectTexture({ name: item.name, txd: item.txd });
            pushTextureState(item);
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
                    setMapSelected(false);
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
                    setMapSelected(false);
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
    const handleOpenModel = useCallback(
        (type: ModelType, id: number): void => {
            pushState({
                ...DEFAULT_SHAREABLE_URL_STATE,
                modelType: type,
                modelId: id,
                backgroundColor:
                    backgroundSelection.source === 'custom' ? backgroundSelection.color : null,
            });
        },
        [backgroundSelection, pushState]
    );
    const handleOpenTextureUsage = useCallback(
        (usage: TextureUsage): void => handleOpenModel(usage.type, usage.id),
        [handleOpenModel]
    );
    const handleOpenNearbyObject = useCallback(
        (item: NearbyObject): void => handleOpenModel('object', item.id),
        [handleOpenModel]
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
            mapSelected,
            mapX: mapSelected ? (mapPoint?.x ?? null) : null,
            mapY: mapSelected ? (mapPoint?.y ?? null) : null,
        }),
        [
            animationSelection,
            backgroundSelection,
            info,
            mapPoint,
            mapSelected,
            modelType,
            selectedModelType,
            selectedModificationIds,
            texturesSelected,
            urlTexture,
            vehicleColor,
            vehicleColorsChanged,
        ]
    );
    const handleModelTabChange = useCallback(
        (type: { value: ModelType }): void => {
            if (!texturesSelected && !mapSelected && type.value === modelType) {
                return;
            }
            if (type.value !== modelType) {
                handleModelTypeChange(type);
                return;
            }

            setTexturesSelected(false);
            setMapSelected(false);
            pushLocalState({
                ...shareableState,
                texturesSelected: false,
                textureDictionary: null,
                textureName: null,
                mapSelected: false,
                mapX: null,
                mapY: null,
            });
        },
        [
            handleModelTypeChange,
            mapSelected,
            modelType,
            pushLocalState,
            shareableState,
            texturesSelected,
        ]
    );
    const handleSearchModel = useCallback(
        (type: ModelType, item: CatalogListItem): void => {
            if (type === modelType && !texturesSelected && !mapSelected) {
                handleSelectItem(item);
            } else {
                handleOpenModel(type, item.id);
            }
        },
        [handleOpenModel, handleSelectItem, mapSelected, modelType, texturesSelected]
    );
    const handleSearchTexture = useCallback(
        (item: TextureListItem): void => {
            setMapSelected(false);
            setTexturesSelected(true);
            if (item.txd === urlTexture?.txd && item.name === urlTexture.name) {
                pushTextureState(item);
            } else {
                handleSelectTexture(item);
            }
        },
        [handleSelectTexture, pushTextureState, urlTexture]
    );
    const handleSearchShowAll = useCallback(
        (type: ModelType | 'texture', query: string): void => {
            if (type === 'texture') {
                handleSelectTexturesTab();
                textureQuery.search(query);
                return;
            }

            if (type === modelType) {
                handleModelTabChange({ value: type });
                catalogQuery.search(query);
                return;
            }

            pendingListSearch.current = { type, query, list: catalogQuery.list };
            handleModelTabChange({ value: type });
        },
        [catalogQuery, handleModelTabChange, handleSelectTexturesTab, modelType, textureQuery]
    );
    useEffect(() => {
        const pending = pendingListSearch.current;
        if (!pending || pending.type !== modelType) {
            return;
        }

        if (catalogQuery.status === 'ready' && catalogQuery.list !== pending.list) {
            pendingListSearch.current = null;
            catalogQuery.search(pending.query);
        }
    }, [catalogQuery, modelType]);

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
        setMapSelected(shareableUrlState.mapSelected);
        if (shareableUrlState.mapSelected) {
            const { mapX, mapY } = shareableUrlState;
            setMapPoint(mapX !== null && mapY !== null ? { x: mapX, y: mapY } : null);
            return;
        }
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
        } else if (!isInitialUrl) {
            clearedPendingModel.current = shareableUrlState;
            onClearSelection();
        }
    }, [
        modelType,
        onClearSelection,
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
        if (pending.mapSelected) {
            if (mapSelected) {
                restoringUrl.current = false;
                pendingUrlState.current = null;
            }
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
        if (texturesSelected || mapSelected || modelType !== pending.modelType) {
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
        if (clearedPendingModel.current === pending && info) {
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
        mapSelected,
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
            mapSelected ||
            (texturesSelected ? !urlTexture : !info)
        ) {
            return;
        }

        if (window.location.search === serializeShareableUrl(shareableState)) {
            localUrlChange.current = false;
            return;
        }

        pushLocalState(shareableState);
    }, [
        info,
        mapSelected,
        pushLocalState,
        shareableState,
        shareableUrlReady,
        texturesSelected,
        urlTexture,
    ]);
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
                    mapSelected={mapSelected}
                    onSelectTextures={handleSelectTexturesTab}
                    onSelectMap={handleSelectMapTab}
                    previewMode={previewMode}
                    onPreviewModeChange={onPreviewModeChange}
                    search={
                        <GlobalSearch
                            onSelectModel={handleSearchModel}
                            onSelectTexture={handleSearchTexture}
                            onShowAll={handleSearchShowAll}
                        />
                    }
                    themeMode={themeMode}
                    onThemeModeChange={onThemeModeChange}
                    onModelTypeChange={handleModelTabChange}
                />
                <MobileModal
                    visible={isMobileView && searchVisible}
                    accessibilityLabel="Search dialog"
                    placement="top"
                    onRequestClose={() => setSearchVisible(false)}
                    contentStyle={{ width: '100%', maxWidth: 480 }}
                >
                    <GlobalSearch
                        onSelectModel={(type, item) => {
                            setSearchVisible(false);
                            handleSearchModel(type, item);
                        }}
                        onSelectTexture={(item) => {
                            setSearchVisible(false);
                            handleSearchTexture(item);
                        }}
                        onShowAll={(type, query) => {
                            setSearchVisible(false);
                            handleSearchShowAll(type, query);
                        }}
                    />
                </MobileModal>
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
                    {isMobileView && mapSelected ? (
                        <MapMenuMobile
                            point={mapPoint}
                            results={nearby.results}
                            status={nearby.status}
                            onSelect={handleOpenNearbyObject}
                            onOpenSearch={() => setSearchVisible(true)}
                        />
                    ) : isMobileView && texturesSelected ? (
                        <TextureMenuMobile
                            texture={texture}
                            textureData={textureRows}
                            textureQuery={textureQuery}
                            onSelectTexture={handleSelectTexture}
                            onSelectUsage={handleOpenTextureUsage}
                            onSelectColor={handleBackgroundColor}
                            selectedColor={backgroundSelection.color}
                            onOpenSearch={() => setSearchVisible(true)}
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
                            previewMode={previewMode}
                            onPreviewModeChange={onPreviewModeChange}
                            onOpenSearch={() => setSearchVisible(true)}
                        />
                    ) : mapSelected ? (
                        <View style={styles.desktopMenuColumn}>
                            <MapMenuDesktop
                                point={mapPoint}
                                results={nearby.results}
                                status={nearby.status}
                                onSelect={handleOpenNearbyObject}
                            />
                        </View>
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
                    {mapSelected ? (
                        <MapStage
                            point={mapPoint}
                            results={nearby.results}
                            onSelectPoint={handleSelectMapPoint}
                            isMobileView={isMobileView}
                        />
                    ) : texturesSelected ? (
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
                            previewMode={previewMode}
                        />
                    )}
                    {isMobileView || mapSelected ? null : texturesSelected ? (
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
                                emptyText={
                                    previewMode === 'thumbnail' && info
                                        ? 'Switch to the 3D view to list its textures.'
                                        : 'No model selected.'
                                }
                                onSelect={handleOpenModelTexture}
                                collapsible
                                initiallyExpanded={false}
                            />
                            {modelType === 'object' && (
                                <ModelMap
                                    style={{ marginBottom: 14 }}
                                    objectId={
                                        selectedModelType === 'object' && info ? info.id : null
                                    }
                                    collapsible
                                    initiallyExpanded={false}
                                />
                            )}
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
