import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native-web';
import { NEARBY_RADIUS } from 'src/domain/placementCatalog';
import type { MapPoint, NearbyObject } from 'src/domain/placementCatalog';
import { useTheme } from 'src/theme/ThemeContext';
import RadarMap from '../RadarMap';

interface Props {
    point: MapPoint | null;
    results: NearbyObject[];
    onSelectPoint: (point: MapPoint) => void;
    isMobileView: boolean;
}

const MapStage = ({ point, results, onSelectPoint, isMobileView }: Props) => {
    const { theme } = useTheme();
    const [area, setArea] = useState({ width: 0, height: 0 });
    const size = Math.max(0, Math.min(area.width, area.height));
    const markers = useMemo(() => results.map(({ position: [x, y] }) => ({ x, y })), [results]);

    return (
        <View style={[styles.stage, isMobileView && styles.mobileStage]}>
            <View style={styles.stageHeader}>
                <View style={{ flexShrink: 1 }}>
                    <Text style={[styles.stageEyebrow, { color: theme.mutedText }]}>MAP</Text>
                    <Text style={[styles.stageTitle, { color: theme.title }]}>San Andreas</Text>
                </View>
                <View style={[styles.stageBadge, { backgroundColor: theme.accentSoft }]}>
                    <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '800' }}>
                        {point ? `${point.x}, ${point.y}` : 'No spot selected'}
                    </Text>
                </View>
            </View>
            <View
                style={[styles.mapArea, isMobileView && styles.mobileMapArea]}
                onLayout={(event) =>
                    setArea({
                        width: event.nativeEvent.layout.width,
                        height: event.nativeEvent.layout.height,
                    })
                }
            >
                {size > 0 && (
                    <View style={{ width: size }}>
                        <RadarMap
                            markers={markers}
                            selectedPoint={point}
                            selectedRadius={NEARBY_RADIUS}
                            accessibilityLabel="Choose a spot on the map"
                            onPress={onSelectPoint}
                        />
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
    mapArea: {
        flex: 1,
        minHeight: 0,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        marginBottom: 28,
        marginHorizontal: 28,
    },
    mobileMapArea: {
        marginTop: 96,
        marginBottom: 16,
        marginHorizontal: 16,
    },
});

export default React.memo(MapStage);
