import React, { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native-web';
import type { StyleProp, ViewStyle } from 'react-native-web';
import {
    MAP_TILE_COUNT,
    WORLD_SIZE,
    getRadarTileUrl,
    mapToWorld,
    worldToMap,
} from 'src/domain/placementCatalog';
import type { MapPoint } from 'src/domain/placementCatalog';
import { useTheme } from 'src/theme/ThemeContext';

interface Props {
    markers: MapPoint[];
    markerSize?: number;
    selectedPoint?: MapPoint | null;
    selectedRadius?: number;
    accessibilityLabel?: string;
    onPress?: (point: MapPoint) => void;
    style?: StyleProp<ViewStyle>;
}

const TILE_INDEXES = Array.from({ length: MAP_TILE_COUNT * MAP_TILE_COUNT }, (_, index) => index);

const MARKER_COLOR = '#e5484d';

const RadarMap = ({
    markers,
    markerSize = 7,
    selectedPoint = null,
    selectedRadius = 0,
    accessibilityLabel = 'San Andreas map',
    onPress,
    style,
}: Props) => {
    const { theme } = useTheme();
    const [size, setSize] = useState(0);
    const frame = useRef<HTMLDivElement | null>(null);
    const edge = (index: number) => Math.round((index * size) / MAP_TILE_COUNT);
    const selected = selectedPoint ? worldToMap(selectedPoint, size) : null;
    const ringSize = Math.max(14, (selectedRadius * 2 * size) / WORLD_SIZE);

    return (
        <Pressable
            accessibilityRole={onPress ? 'button' : 'image'}
            accessibilityLabel={accessibilityLabel}
            disabled={!onPress}
            onLayout={(event) => setSize(event.nativeEvent.layout.width)}
            onPress={(event) => {
                const bounds = frame.current?.getBoundingClientRect();
                if (!bounds || !onPress) {
                    return;
                }

                const { pageX, pageY } = event.nativeEvent;
                onPress(
                    mapToWorld(
                        {
                            x: pageX - bounds.left - window.scrollX,
                            y: pageY - bounds.top - window.scrollY,
                        },
                        size
                    )
                );
            }}
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
            <View
                ref={(node) => {
                    frame.current = node instanceof HTMLDivElement ? node : null;
                }}
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
            >
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
                {size > 0 && selected && (
                    <View
                        style={{
                            position: 'absolute',
                            left: selected.x - ringSize / 2,
                            top: selected.y - ringSize / 2,
                            width: ringSize,
                            height: ringSize,
                            borderRadius: ringSize / 2,
                            borderWidth: 2,
                            borderColor: theme.accent,
                            backgroundColor: theme.accentSoft,
                            opacity: 0.85,
                        }}
                    />
                )}
            </View>
        </Pressable>
    );
};

export default React.memo(RadarMap);
