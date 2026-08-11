import React from 'react';
import { Pressable, View, Text } from 'react-native-web';
import type { StyleProp, ViewStyle } from 'react-native-web';
import RoundCard from '../RoundCard';
import { useTheme } from 'src/theme/ThemeContext';
import ModalCloseButton from '../ModalCloseButton';
import type { InfoRow } from 'src/domain/catalog';

interface Props {
    title: string;
    data?: InfoRow[];
    style?: StyleProp<ViewStyle>;
    onClose?: () => void;
    collapsible?: boolean;
    initiallyExpanded?: boolean;
}

const ModelInfo = (props: Props) => {
    const { theme } = useTheme();

    const { title, data, style, onClose, collapsible = false, initiallyExpanded = true } = props;
    const [expanded, setExpanded] = React.useState(initiallyExpanded);

    return (
        <RoundCard
            color={theme.elementBg}
            padding={18}
            style={[{ position: 'relative' }, style]}
            shadowed
        >
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: expanded ? 14 : 0,
                }}
            >
                <Pressable
                    disabled={!collapsible}
                    onPress={() => setExpanded((current) => !current)}
                    style={{ alignItems: 'center', flex: 1, flexDirection: 'row', minWidth: 0 }}
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
                        {title}
                    </Text>
                    {collapsible && (
                        <Text style={{ color: theme.mutedText, fontSize: 18 }}>
                            {expanded ? '▾' : '▸'}
                        </Text>
                    )}
                </Pressable>
            </View>
            {onClose && (
                <ModalCloseButton
                    onPress={onClose}
                    color={theme.title}
                    style={{ position: 'absolute', top: 8, right: 8 }}
                />
            )}
            {expanded && (
                <View style={{ justifyContent: 'flex-start', width: '100%' }}>
                    {data?.length ? (
                        data.map((item) => {
                            return (
                                <View
                                    key={item.label}
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginTop: 11,
                                    }}
                                >
                                    <Text
                                        style={{
                                            marginRight: 8,
                                            fontWeight: '700',
                                            fontSize: 12,
                                            color: theme.mutedText,
                                        }}
                                    >
                                        {item.label}
                                    </Text>
                                    <Text
                                        style={{
                                            flex: 1,
                                            fontSize: 13,
                                            color: theme.normalText,
                                            textAlign: 'right',
                                        }}
                                    >
                                        {item.value}
                                    </Text>
                                </View>
                            );
                        })
                    ) : (
                        <Text style={{ color: theme.mutedText, fontSize: 13 }}>
                            No model selected.
                        </Text>
                    )}
                </View>
            )}
        </RoundCard>
    );
};

export default React.memo(ModelInfo);
