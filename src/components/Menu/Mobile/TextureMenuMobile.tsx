import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native-web';
import MobileModal from 'src/components/MobileModal';
import ModalCloseButton from 'src/components/ModalCloseButton';
import ModelInfo from 'src/components/ModelInfo';
import TextureGrid from 'src/components/TextureGrid';
import TextureMenuDesktop from 'src/components/Menu/TextureDesktop';
import TextureUsageList from 'src/components/TextureUsageList';
import type { InfoRow } from 'src/domain/catalog';
import type { TextureDetails, TextureListItem, TextureUsage } from 'src/domain/textureCatalog';
import type { UseTextureQueryResult } from 'src/hooks/useTextureQuery';
import { useTheme } from 'src/theme/ThemeContext';
import BGColorPicker from './BGColorPicker';

interface Props {
    texture: TextureDetails | null;
    textureData: InfoRow[];
    textureQuery: UseTextureQueryResult;
    onSelectTexture: (texture: TextureListItem) => void;
    onSelectUsage: (usage: TextureUsage) => void;
    onSelectColor: (color: string) => void;
    selectedColor: string;
    onOpenSearch: () => void;
}

const TextureMenuMobile = ({
    texture,
    textureData,
    textureQuery,
    onSelectTexture,
    onSelectUsage,
    onSelectColor,
    selectedColor,
    onOpenSearch,
}: Props) => {
    const [listVisible, setListVisible] = useState(false);
    const [bgColorModalVisible, setBgColorModalVisible] = useState(false);
    const [infoVisible, setInfoVisible] = useState(false);
    const { theme } = useTheme();
    const closeList = () => {
        textureQuery.clearSearch();
        setListVisible(false);
    };

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
                    accessibilityLabel="Open texture selector"
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
                    onPress={onOpenSearch}
                    accessibilityRole="button"
                    accessibilityLabel="Open search"
                >
                    <Text style={{ color: theme.button }}>Search</Text>
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
                    onPress={() => setInfoVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Open texture information"
                >
                    <Text style={{ color: theme.button }}>Texture info</Text>
                </TouchableOpacity>
            </View>
            <MobileModal
                visible={listVisible}
                animationType="slide"
                fullScreenContent
                accessibilityLabel="Texture selector"
                onRequestClose={closeList}
            >
                <View style={{ flex: 1, minHeight: 0, backgroundColor: theme.elementBg }}>
                    <ModalCloseButton
                        onPress={closeList}
                        color={theme.title}
                        style={{ position: 'absolute', top: 14, right: 14, zIndex: 1 }}
                    />
                    <TextureMenuDesktop
                        selectedTexture={texture}
                        onSelectTexture={(item) => {
                            closeList();
                            onSelectTexture(item);
                        }}
                        textureQuery={textureQuery}
                        showSearch
                    />
                </View>
            </MobileModal>
            <BGColorPicker
                isMobileView={true}
                visible={bgColorModalVisible}
                onRequestClose={() => setBgColorModalVisible(false)}
                onSelect={onSelectColor}
                selectedColor={selectedColor}
            />
            <MobileModal
                visible={infoVisible}
                animationType="fade"
                accessibilityLabel="Texture information dialog"
                initialFocusSelector={'[aria-label="Close"]'}
                onRequestClose={() => setInfoVisible(false)}
                contentStyle={{ width: '100%', maxWidth: 420, maxHeight: '100%' }}
            >
                <ScrollView>
                    <ModelInfo
                        title="Texture info"
                        style={{ marginBottom: 12 }}
                        onClose={() => setInfoVisible(false)}
                        data={textureData}
                    />
                    {texture && (
                        <>
                            <TextureUsageList
                                style={{ marginBottom: 12 }}
                                usage={texture.usedBy}
                                onSelect={(usage) => {
                                    setInfoVisible(false);
                                    onSelectUsage(usage);
                                }}
                            />
                            <TextureGrid
                                title={`In ${texture.txd}.txd`}
                                textures={texture.dictionary}
                                selectedName={texture.name}
                                emptyText="This texture file is empty."
                                onSelect={(name) => onSelectTexture({ txd: texture.txd, name })}
                            />
                        </>
                    )}
                </ScrollView>
            </MobileModal>
        </>
    );
};

export default React.memo(TextureMenuMobile);
