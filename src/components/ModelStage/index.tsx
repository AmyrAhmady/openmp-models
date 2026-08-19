import React from 'react';
import dynamic from 'next/dynamic';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native-web';
import type { CatalogItem, ModelType } from 'src/domain/catalog';
import type { ModelLoadStatus } from 'src/hooks/useModelSelection';
import type { ModelPreviewData } from 'src/domain/modelPreview';
import type { ParsedAnimation } from 'src/animation/ifpParser';
import { useTheme } from 'src/theme/ThemeContext';

const ModelViewer = dynamic(() => import('src/components/ModelViewer'), { ssr: false });

interface Props {
    modelType: ModelType;
    info: CatalogItem | null;
    models: ModelPreviewData[];
    animation: ParsedAnimation | null;
    modelStatus: ModelLoadStatus;
    modelError: string | null;
    backgroundColor: string;
    retryModel: () => void;
    isMobileView: boolean;
}

const ModelStage = ({
    modelType,
    info,
    models,
    animation,
    modelStatus,
    modelError,
    backgroundColor,
    retryModel,
    isMobileView,
}: Props) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.stage, isMobileView && styles.mobileStage, { backgroundColor }]}>
            <View style={styles.stageHeader}>
                <View>
                    <Text style={[styles.stageEyebrow, { color: theme.mutedText }]}>
                        {modelType === 'vehicle' ? 'VEHICLE' : modelType.toUpperCase()}
                    </Text>
                    <Text style={[styles.stageTitle, { color: theme.title }]}>
                        {info?.name ?? 'Choose a model'}
                    </Text>
                </View>
                <View style={[styles.stageBadge, { backgroundColor: theme.accentSoft }]}>
                    <Text
                        style={{
                            color: theme.accent,
                            fontSize: 12,
                            fontWeight: '800',
                        }}
                    >
                        {info ? `ID ${info.id}` : 'No model selected'}
                    </Text>
                </View>
            </View>
            <View style={styles.viewer}>
                {modelStatus === 'loading' ? (
                    <View style={styles.stageMessage}>
                        <ActivityIndicator color={theme.accent} />
                        <Text style={[styles.stageMessageText, { color: theme.mutedText }]}>
                            Loading model…
                        </Text>
                    </View>
                ) : modelStatus === 'error' ? (
                    <View style={styles.stageMessage}>
                        <Text style={[styles.stageMessageTitle, { color: theme.title }]}>
                            Model unavailable
                        </Text>
                        <Text style={[styles.stageMessageText, { color: theme.mutedText }]}>
                            {modelError}
                        </Text>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Retry loading model"
                            onPress={retryModel}
                            style={[styles.retryButton, { backgroundColor: theme.accent }]}
                        >
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : modelStatus === 'ready' && models.length ? (
                    <ModelViewer
                        models={models}
                        autoSpin={false}
                        animation={animation}
                        showWheelSpinTest={modelType === 'vehicle'}
                    />
                ) : modelStatus === 'idle' ? (
                    <View style={styles.stageMessage}>
                        <Text style={[styles.stageMessageTitle, { color: theme.title }]}>
                            {info ? 'Preparing preview' : 'Choose a model'}
                        </Text>
                        <Text style={[styles.stageMessageText, { color: theme.mutedText }]}>
                            {info
                                ? 'Your 3D preview will appear shortly.'
                                : 'Select a model from the catalog to preview it here.'}
                        </Text>
                    </View>
                ) : null}
            </View>
            <Text style={[styles.stageHint, { color: theme.mutedText }]}>
                Drag to rotate · Scroll to zoom
            </Text>
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
    stageHint: {
        position: 'absolute',
        bottom: 22,
        left: 28,
        fontSize: 12,
    },
});

export default React.memo(ModelStage);
