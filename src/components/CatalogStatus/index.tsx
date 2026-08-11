import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native-web';
import type { CatalogQueryStatus } from 'src/hooks/useCatalogQuery';
import { useTheme } from 'src/theme/ThemeContext';

interface Props {
    status: CatalogQueryStatus;
    hasItems: boolean;
    error: string | null;
    onRetry: () => void;
    isLoadingMore?: boolean;
    loadMoreError?: string | null;
}

const CatalogStatus = ({
    status,
    hasItems,
    error,
    onRetry,
    isLoadingMore = false,
    loadMoreError = null,
}: Props) => {
    const { theme } = useTheme();

    if (hasItems) {
        if (loadMoreError) {
            return (
                <View style={{ alignItems: 'center', padding: 12 }}>
                    <Text style={{ color: theme.mutedText, fontSize: 13, textAlign: 'center' }}>
                        {loadMoreError}
                    </Text>
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Retry loading more models"
                        onPress={onRetry}
                        style={{ marginTop: 8 }}
                    >
                        <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '700' }}>
                            Retry
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (isLoadingMore) {
            return (
                <View style={{ alignItems: 'center', padding: 12 }}>
                    <ActivityIndicator color={theme.accent} />
                    <Text style={{ color: theme.mutedText, fontSize: 13, marginTop: 6 }}>
                        Loading more models…
                    </Text>
                </View>
            );
        }

        return null;
    }

    if (status === 'loading' || status === 'idle') {
        return (
            <View style={{ alignItems: 'center', padding: 24 }}>
                <ActivityIndicator color={theme.accent} />
                <Text style={{ color: theme.mutedText, fontSize: 13, marginTop: 8 }}>
                    Loading models…
                </Text>
            </View>
        );
    }

    if (status === 'error') {
        return (
            <View style={{ alignItems: 'center', padding: 24 }}>
                <Text style={{ color: theme.mutedText, fontSize: 13, textAlign: 'center' }}>
                    {error || 'The model list could not be loaded.'}
                </Text>
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Retry loading models"
                    onPress={onRetry}
                    style={{ marginTop: 12 }}
                >
                    <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '700' }}>
                        Retry
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ alignItems: 'center', padding: 24 }}>
            <Text style={{ color: theme.mutedText, fontSize: 13 }}>No models found.</Text>
        </View>
    );
};

export default CatalogStatus;
