import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native-web';
import { getTextureUrl } from 'src/domain/textureCatalog';
import type { TextureDetails } from 'src/domain/textureCatalog';
import type { TextureLoadStatus } from 'src/hooks/useTextureSelection';
import { useTheme } from 'src/theme/ThemeContext';
import TextureImage from '../TextureImage';

interface Props {
    texture: TextureDetails | null;
    status: TextureLoadStatus;
    error: string | null;
    backgroundColor: string;
    retry: () => void;
    isMobileView: boolean;
}

const TextureStage = ({ texture, status, error, backgroundColor, retry, isMobileView }: Props) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.stage, isMobileView && styles.mobileStage, { backgroundColor }]}>
            <View style={styles.stageHeader}>
                <View style={{ flexShrink: 1 }}>
                    <Text style={[styles.stageEyebrow, { color: theme.mutedText }]}>
                        {texture ? `${texture.txd.toUpperCase()}.TXD` : 'TEXTURE'}
                    </Text>
                    <Text style={[styles.stageTitle, { color: theme.title }]}>
                        {texture?.name ?? 'Choose a texture'}
                    </Text>
                </View>
                <View style={[styles.stageBadge, { backgroundColor: theme.accentSoft }]}>
                    <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '800' }}>
                        {texture ? `${texture.width} × ${texture.height}` : 'No texture selected'}
                    </Text>
                </View>
            </View>
            <View style={styles.viewer}>
                {status === 'loading' ? (
                    <View style={styles.stageMessage}>
                        <ActivityIndicator color={theme.accent} />
                        <Text style={[styles.stageMessageText, { color: theme.mutedText }]}>
                            Loading texture…
                        </Text>
                    </View>
                ) : status === 'error' ? (
                    <View style={styles.stageMessage}>
                        <Text style={[styles.stageMessageTitle, { color: theme.title }]}>
                            Texture unavailable
                        </Text>
                        <Text style={[styles.stageMessageText, { color: theme.mutedText }]}>
                            {error}
                        </Text>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Retry loading texture"
                            onPress={retry}
                            style={[styles.retryButton, { backgroundColor: theme.accent }]}
                        >
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : texture ? (
                    <View style={styles.imageFrame}>
                        <TextureImage
                            uri={getTextureUrl(texture.name)}
                            alt={texture.name}
                            fit="contain"
                            style={{ width: '100%', height: '100%', maxWidth: 512, maxHeight: 512 }}
                        />
                    </View>
                ) : (
                    <View style={styles.stageMessage}>
                        <Text style={[styles.stageMessageTitle, { color: theme.title }]}>
                            Choose a texture
                        </Text>
                        <Text style={[styles.stageMessageText, { color: theme.mutedText }]}>
                            Select a texture from the list to preview it here.
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    stage: {
        flex: 1,
        position: 'relative',
        minWidth: 0,
        minHeight: 0,
    },
    mobileStage: {
        width: '100%',
    },
    stageHeader: {
        position: 'absolute',
        top: 24,
        left: 28,
        right: 28,
        zIndex: 2,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    stageEyebrow: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.4,
    },
    stageTitle: {
        fontSize: 25,
        fontWeight: '800',
        marginTop: 5,
    },
    stageBadge: {
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderRadius: 8,
    },
    viewer: {
        flex: 1,
        minHeight: 0,
    },
    imageFrame: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 110,
        paddingBottom: 40,
        paddingHorizontal: 40,
    },
    stageMessage: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
    },
    stageMessageTitle: {
        fontSize: 16,
        fontWeight: '800',
        textAlign: 'center',
    },
    stageMessageText: {
        fontSize: 13,
        marginTop: 8,
        textAlign: 'center',
        maxWidth: 320,
    },
    retryButton: {
        borderRadius: 8,
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    retryButtonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '800',
    },
});

export default React.memo(TextureStage);
