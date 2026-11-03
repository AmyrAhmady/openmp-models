import React from 'react';
import { Text, View } from 'react-native-web';
import { NEARBY_RADIUS } from 'src/domain/placementCatalog';
import type { MapPoint, NearbyObject } from 'src/domain/placementCatalog';
import type { PlacementLoadStatus } from 'src/hooks/usePlacements';
import { useTheme } from 'src/theme/ThemeContext';
import NearbyList from '../NearbyList';

interface Props {
    point: MapPoint | null;
    results: NearbyObject[];
    status: PlacementLoadStatus;
    onSelect: (item: NearbyObject) => void;
}

const MapMenuDesktop = ({ point, results, status, onSelect }: Props) => {
    const { theme } = useTheme();

    return (
        <View
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: theme.elementBg,
                borderRightWidth: 1,
                borderColor: theme.lines,
            }}
        >
            <View style={{ paddingHorizontal: 22, paddingTop: 22, paddingBottom: 14 }}>
                <Text style={{ color: theme.title, fontSize: 19, fontWeight: '800' }}>
                    Nearby objects
                </Text>
                <Text style={{ color: theme.mutedText, fontSize: 13, marginTop: 5 }}>
                    {point && status === 'ready'
                        ? `${results.length} within ${NEARBY_RADIUS} m`
                        : `Within ${NEARBY_RADIUS} m of the spot you click`}
                </Text>
            </View>
            <NearbyList
                point={point}
                results={results}
                status={status}
                onSelect={onSelect}
                style={{ flex: 1, paddingHorizontal: 22 }}
            />
        </View>
    );
};

export default React.memo(MapMenuDesktop);
