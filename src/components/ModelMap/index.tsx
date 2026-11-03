import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
    useWindowDimensions,
} from 'react-native-web';
import type { StyleProp, ViewStyle } from 'react-native-web';
import { usePlacements } from 'src/hooks/usePlacements';
import type { ModelPlacements } from 'src/domain/placementCatalog';
import { useTheme } from 'src/theme/ThemeContext';
import MobileModal from '../MobileModal';
import ModalCloseButton from '../ModalCloseButton';
import RadarMap from '../RadarMap';
import RoundCard from '../RoundCard';

interface Props {
    objectId: number | null;
    style?: StyleProp<ViewStyle>;
    onClose?: () => void;
    collapsible?: boolean;
    initiallyExpanded?: boolean;
}

function formatCoordinate(value: number): string {
    return value.toFixed(2);
}

function countPlacements(count: number): string {
    return `${count} ${count === 1 ? 'placement' : 'placements'}`;
}

function getSummary({ positions, interiors }: ModelPlacements): string {
    if (!positions.length && !interiors.length) {
        return 'This object is not placed anywhere in the game.';
    }

    if (!positions.length) {
        return `${countPlacements(interiors.length)} in an interior.`;
    }

    const world = `${countPlacements(positions.length)} on the map`;
    return interiors.length ? `${world}, ${interiors.length} in an interior.` : `${world}.`;
}

const ModelMap = ({
    objectId,
    style,
    onClose,
    collapsible = false,
    initiallyExpanded = true,
}: Props) => {
    const { theme } = useTheme();
    const [expanded, setExpanded] = useState(initiallyExpanded);
    const [poppedOut, setPoppedOut] = useState(false);
    const window = useWindowDimensions();
    const poppedOutSize = Math.max(0, Math.min(window.width - 80, window.height - 160));
    const { placements, status } = usePlacements(expanded ? objectId : null);
    const markers = useMemo(
        () => placements?.positions.map(([x, y]) => ({ x, y })) ?? [],
        [placements]
    );

    return (
        <RoundCard
            color={theme.elementBg}
            padding={18}
            style={[{ position: 'relative' }, style]}
            shadowed
        >
            <Pressable
                disabled={!collapsible}
                onPress={() => setExpanded((current) => !current)}
                style={{
                    alignItems: 'center',
                    flexDirection: 'row',
                    marginBottom: expanded ? 14 : 0,
                }}
            >
                <Text
                    style={{
                        flex: 1,
                        paddingRight: onClose ? 32 : 0,
                        fontSize: 16,
                        fontWeight: '800',
                        color: theme.title,
                    }}
                >
                    Map
                </Text>
                {collapsible && (
                    <Text style={{ color: theme.mutedText, fontSize: 18 }}>
                        {expanded ? '▾' : '▸'}
                    </Text>
                )}
            </Pressable>
            {onClose && (
                <ModalCloseButton
                    onPress={onClose}
                    color={theme.title}
                    style={{ position: 'absolute', top: 8, right: 8 }}
                />
            )}
            {expanded &&
                (objectId === null ? (
                    <Text style={{ color: theme.mutedText, fontSize: 13 }}>No model selected.</Text>
                ) : status === 'error' ? (
                    <Text style={{ color: theme.mutedText, fontSize: 13 }}>
                        The map could not be loaded. Check your connection and try again.
                    </Text>
                ) : !placements ? (
                    <ActivityIndicator color={theme.accent} />
                ) : (
                    <View>
                        <Text style={{ color: theme.mutedText, fontSize: 13, marginBottom: 12 }}>
                            {getSummary(placements)}
                        </Text>
                        {placements.positions.length > 0 &&
                            (onClose ? (
                                <RadarMap markers={markers} />
                            ) : (
                                <>
                                    <RadarMap
                                        markers={markers}
                                        accessibilityLabel="Open a larger map"
                                        onPress={() => setPoppedOut(true)}
                                    />
                                    <Text
                                        style={{
                                            color: theme.mutedText,
                                            fontSize: 11,
                                            marginTop: 6,
                                        }}
                                    >
                                        Click the map to open it larger.
                                    </Text>
                                </>
                            ))}
                        {placements.interiors.length > 0 && (
                            <ScrollView style={{ maxHeight: 160, marginTop: 12 }}>
                                {placements.interiors.map(([x, y, z, interior], index) => (
                                    <View
                                        key={index}
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            paddingVertical: 4,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: theme.mutedText,
                                                fontSize: 12,
                                                fontWeight: '700',
                                            }}
                                        >
                                            Interior {interior}
                                        </Text>
                                        <Text style={{ color: theme.normalText, fontSize: 12 }}>
                                            {[x, y, z].map(formatCoordinate).join(', ')}
                                        </Text>
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                ))}
            {!onClose && (
                <MobileModal
                    visible={poppedOut}
                    accessibilityLabel="Map dialog"
                    initialFocusSelector={'[aria-label="Close"]'}
                    onRequestClose={() => setPoppedOut(false)}
                    contentStyle={{ width: poppedOutSize + 36 }}
                >
                    <RoundCard
                        color={theme.elementBg}
                        padding={18}
                        style={{ position: 'relative' }}
                        shadowed
                    >
                        <Text
                            style={{
                                paddingRight: 32,
                                fontSize: 16,
                                fontWeight: '800',
                                color: theme.title,
                            }}
                        >
                            Map
                        </Text>
                        <ModalCloseButton
                            onPress={() => setPoppedOut(false)}
                            color={theme.title}
                            style={{ position: 'absolute', top: 8, right: 8 }}
                        />
                        {placements && (
                            <Text
                                style={{
                                    color: theme.mutedText,
                                    fontSize: 13,
                                    marginTop: 6,
                                    marginBottom: 12,
                                }}
                            >
                                {getSummary(placements)}
                            </Text>
                        )}
                        {poppedOut && <RadarMap markers={markers} markerSize={9} />}
                    </RoundCard>
                </MobileModal>
            )}
        </RoundCard>
    );
};

export default React.memo(ModelMap);
