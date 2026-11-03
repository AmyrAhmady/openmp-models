import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native-web';
import MobileModal from 'src/components/MobileModal';
import ModalCloseButton from 'src/components/ModalCloseButton';
import NearbyList from 'src/components/NearbyList';
import RoundCard from 'src/components/RoundCard';
import type { MapPoint, NearbyObject } from 'src/domain/placementCatalog';
import type { PlacementLoadStatus } from 'src/hooks/usePlacements';
import { useTheme } from 'src/theme/ThemeContext';

interface Props {
    point: MapPoint | null;
    results: NearbyObject[];
    status: PlacementLoadStatus;
    onSelect: (item: NearbyObject) => void;
    onOpenSearch: () => void;
}

const MapMenuMobile = ({ point, results, status, onSelect, onOpenSearch }: Props) => {
    const { theme } = useTheme();
    const [listVisible, setListVisible] = useState(false);
    const chipStyle = {
        alignItems: 'center',
        borderColor: theme.button,
        borderRadius: 100,
        borderWidth: 1.8,
        height: '2.5rem',
        justifyContent: 'center',
        marginBottom: 4,
        marginRight: 4,
        paddingHorizontal: 8,
    } as const;

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
                    style={chipStyle}
                    onPress={onOpenSearch}
                    accessibilityRole="button"
                    accessibilityLabel="Open search"
                >
                    <Text style={{ color: theme.button }}>Search</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={chipStyle}
                    onPress={() => setListVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Open nearby objects"
                >
                    <Text style={{ color: theme.button }}>
                        {point && status === 'ready'
                            ? `Nearby objects (${results.length})`
                            : 'Nearby objects'}
                    </Text>
                </TouchableOpacity>
            </View>
            <MobileModal
                visible={listVisible}
                animationType="fade"
                accessibilityLabel="Nearby objects dialog"
                initialFocusSelector={'[aria-label="Close"]'}
                onRequestClose={() => setListVisible(false)}
                contentStyle={{ width: '100%', maxWidth: 420 }}
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
                            marginBottom: 12,
                            fontSize: 16,
                            fontWeight: '800',
                            color: theme.title,
                        }}
                    >
                        Nearby objects
                    </Text>
                    <ModalCloseButton
                        onPress={() => setListVisible(false)}
                        color={theme.title}
                        style={{ position: 'absolute', top: 8, right: 8 }}
                    />
                    <NearbyList
                        point={point}
                        results={results}
                        status={status}
                        onSelect={(item) => {
                            setListVisible(false);
                            onSelect(item);
                        }}
                        style={{ maxHeight: 420 }}
                    />
                </RoundCard>
            </MobileModal>
        </>
    );
};

export default React.memo(MapMenuMobile);
