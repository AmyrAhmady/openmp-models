import React from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native-web';
import type { StyleProp, ViewStyle } from 'react-native-web';
import { getModelPreviewUrl } from 'src/domain/globalSearch';
import { NEARBY_RADIUS } from 'src/domain/placementCatalog';
import type { MapPoint, NearbyObject } from 'src/domain/placementCatalog';
import type { PlacementLoadStatus } from 'src/hooks/usePlacements';
import { useTheme } from 'src/theme/ThemeContext';
import PreviewImage from '../PreviewImage';

interface Props {
    point: MapPoint | null;
    results: NearbyObject[];
    status: PlacementLoadStatus;
    onSelect: (item: NearbyObject) => void;
    style?: StyleProp<ViewStyle>;
}

function describe({ distance, count }: NearbyObject): string {
    const away = `${Math.round(distance)} m away`;
    return count > 1 ? `${away}, ${count} placed here` : away;
}

const NearbyList = ({ point, results, status, onSelect, style }: Props) => {
    const { theme } = useTheme();
    const message = !point
        ? 'Click the map to list the objects placed around that spot.'
        : status === 'error'
          ? 'The nearby objects could not be loaded. Check your connection and try again.'
          : status === 'ready' && !results.length
            ? `No objects are placed within ${NEARBY_RADIUS} m of this spot.`
            : null;

    if (point && status === 'loading') {
        return <ActivityIndicator color={theme.accent} style={[{ marginTop: 20 }, style]} />;
    }

    if (message) {
        return (
            <Text style={[{ color: theme.mutedText, fontSize: 13, lineHeight: 19 }, style]}>
                {message}
            </Text>
        );
    }

    return (
        <FlatList
            style={style}
            data={results}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${item.name}`}
                    onPress={() => onSelect(item)}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7 }}
                >
                    <PreviewImage uri={getModelPreviewUrl(item.name)} size={32} marginRight={12} />
                    <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                        <Text
                            numberOfLines={1}
                            style={{ color: theme.normalText, fontSize: 14, fontWeight: '600' }}
                        >
                            {item.name}
                        </Text>
                        <Text style={{ color: theme.mutedText, fontSize: 12, marginTop: 2 }}>
                            {describe(item)}
                        </Text>
                    </View>
                    <Text style={{ color: theme.mutedText, fontSize: 12, fontWeight: '700' }}>
                        {item.id}
                    </Text>
                </Pressable>
            )}
        />
    );
};

export default React.memo(NearbyList);
