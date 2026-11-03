import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native-web';
import type { StyleProp, ViewStyle } from 'react-native-web';
import {
    MAP_TILE_COUNT,
    getRadarTileUrl,
    mapToWorld,
    worldToMap,
} from 'src/domain/placementCatalog';
import type { MapPoint } from 'src/domain/placementCatalog';
import { useTheme } from 'src/theme/ThemeContext';

interface Props {
    markers: MapPoint[];
    markerSize?: number;
    accessibilityLabel?: string;
    onPress?: (point: MapPoint) => void;
    style?: StyleProp<ViewStyle>;
}

const TILE_INDEXES = Array.from({ length: MAP_TILE_COUNT * MAP_TILE_COUNT }, (_, index) => index);

const MARKER_COLOR = '#e5484d';

const RadarMap = ({
    markers,
    markerSize = 7,
    accessibilityLabel = 'San Andreas map',
    onPress,
    style,
}: Props) => {
    const { theme } = useTheme();
    const [size, setSize] = useState(0);
    const edge = (index: number) => Math.round((index * size) / MAP_TILE_COUNT);

    return (
        <Pressable
            accessibilityRole={onPress ? 'button' : 'image'}
            accessibilityLabel={accessibilityLabel}
            disabled={!onPress}
            onLayout={(event) => setSize(event.nativeEvent.layout.width)}
            onPress={(event) =>
                onPress?.(
                    mapToWorld(
                        { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY },
                        size
                    )
                )
            }
            style={[
                {
                    width: '100%',
                    aspectRatio: 1,
                    overflow: 'hidden',
                    borderRadius: 10,
                    backgroundColor: theme.textBox,
                },
                style,
            ]}
        >
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                {size > 0 &&
                    TILE_INDEXES.map((index) => {
                        const column = index % MAP_TILE_COUNT;
                        const row = Math.floor(index / MAP_TILE_COUNT);
                        return (
                            <Image
                                key={index}
                                source={{ uri: getRadarTileUrl(index) }}
                                style={{
                                    position: 'absolute',
                                    left: edge(column),
                                    top: edge(row),
                                    width: edge(column + 1) - edge(column),
                                    height: edge(row + 1) - edge(row),
                                }}
                            />
                        );
                    })}
                {size > 0 &&
                    markers.map((marker, index) => {
                        const point = worldToMap(marker, size);
                        return (
                            <View
                                key={index}
                                style={{
                                    position: 'absolute',
                                    left: point.x - markerSize / 2,
                                    top: point.y - markerSize / 2,
                                    width: markerSize,
                                    height: markerSize,
                                    borderRadius: markerSize / 2,
                                    borderWidth: 1,
                                    borderColor: '#ffffff',
                                    backgroundColor: MARKER_COLOR,
                                }}
                            />
                        );
                    })}
            </View>
        </Pressable>
    );
};

export default React.memo(RadarMap);
