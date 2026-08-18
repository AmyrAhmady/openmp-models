import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native-web';
import type { StyleProp, ViewStyle } from 'react-native-web';
import { animationLibraries } from 'src/domain/animationCatalog';
import { getAnimationLibrary } from 'src/animation/animationLibraryClient';
import type { ParsedAnimationLibrary } from 'src/animation/ifpParser';
import { useTheme } from 'src/theme/ThemeContext';
import ModalCloseButton from '../ModalCloseButton';
import RoundCard from '../RoundCard';

interface Props {
    style?: StyleProp<ViewStyle>;
    onClose?: () => void;
    collapsible?: boolean;
    initiallyExpanded?: boolean;
}

interface PickerOption {
    label: string;
    value: string;
}

type LibraryStatus = 'idle' | 'loading' | 'ready' | 'error';

interface NativePickerProps {
    accessibilityLabel: string;
    enabled?: boolean;
    onChange: (value: string) => void;
    options: readonly PickerOption[];
    placeholder: string;
    selectedValue: string;
}

const NativePicker = ({
    accessibilityLabel,
    enabled = true,
    onChange,
    options,
    placeholder,
    selectedValue,
}: NativePickerProps) => {
    const { theme } = useTheme();

    return (
        <View
            style={{
                backgroundColor: theme.textBox,
                borderColor: theme.lines,
                borderRadius: 8,
                borderWidth: 1,
                minHeight: 44,
                opacity: enabled ? 1 : 0.5,
                overflow: 'hidden',
                width: '100%',
            }}
        >
            <select
                aria-label={accessibilityLabel}
                disabled={!enabled}
                value={selectedValue}
                style={{
                    backgroundColor: 'transparent',
                    border: 0,
                    color: theme.normalText,
                    fontSize: 13,
                    height: 44,
                    padding: '0 10px',
                    width: '100%',
                }}
                onChange={(event) => onChange(event.target.value)}
            >
                <option style={{ color: theme.mutedText }} value="">
                    {placeholder}
                </option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </View>
    );
};

const AnimationBrowser = ({
    style,
    onClose,
    collapsible = false,
    initiallyExpanded = true,
}: Props) => {
    const { theme } = useTheme();
    const [expanded, setExpanded] = useState(initiallyExpanded);
    const [selectedLibraryId, setSelectedLibraryId] = useState('');
    const [selectedAnimationName, setSelectedAnimationName] = useState('');
    const [libraryData, setLibraryData] = useState<ParsedAnimationLibrary | null>(null);
    const [status, setStatus] = useState<LibraryStatus>('idle');
    const [error, setError] = useState('');

    const selectedLibrary = useMemo(
        () => animationLibraries.find((library) => library.id === selectedLibraryId),
        [selectedLibraryId]
    );
    const animationOptions = useMemo<PickerOption[]>(
        () => libraryData?.animations.map(({ name }) => ({ label: name, value: name })) ?? [],
        [libraryData]
    );

    useEffect(() => {
        if (!selectedLibrary) {
            setLibraryData(null);
            setSelectedAnimationName('');
            setStatus('idle');
            setError('');
            return;
        }

        const controller = new AbortController();
        setLibraryData(null);
        setSelectedAnimationName('');
        setStatus('loading');
        setError('');

        getAnimationLibrary(selectedLibrary, controller.signal)
            .then((data) => {
                setLibraryData(data);
                setStatus('ready');
            })
            .catch((requestError: unknown) => {
                if (controller.signal.aborted) {
                    return;
                }

                setStatus('error');
                setError(
                    requestError instanceof Error
                        ? requestError.message
                        : 'Could not load the animation library.'
                );
            });

        return () => controller.abort();
    }, [selectedLibrary]);

    return (
        <RoundCard
            color={theme.elementBg}
            padding={18}
            style={[{ minWidth: 0, position: 'relative' }, style]}
            shadowed
        >
            <View
                style={{
                    alignItems: 'center',
                    flexDirection: 'row',
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
                            color: theme.title,
                            flex: 1,
                            fontSize: 16,
                            fontWeight: '800',
                            paddingRight: onClose ? 32 : 0,
                        }}
                    >
                        Animation Browser
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
                    style={{ position: 'absolute', right: 8, top: 8 }}
                />
            )}
            {expanded && (
                <View>
                    <Text style={{ color: theme.mutedText, fontSize: 12, marginBottom: 6 }}>
                        Animation library
                    </Text>
                    <View style={{ marginBottom: 12 }}>
                        <NativePicker
                            accessibilityLabel="Select an animation library"
                            options={animationLibraries.map(({ id, name }) => ({
                                label: name,
                                value: id,
                            }))}
                            placeholder="Select a library"
                            selectedValue={selectedLibraryId}
                            onChange={setSelectedLibraryId}
                        />
                    </View>
                    <Text style={{ color: theme.mutedText, fontSize: 12, marginBottom: 6 }}>
                        Animation
                    </Text>
                    <NativePicker
                        accessibilityLabel="Select an animation"
                        enabled={status === 'ready' && animationOptions.length > 0}
                        options={animationOptions}
                        placeholder={
                            status === 'loading' ? 'Loading animations...' : 'Select an animation'
                        }
                        selectedValue={selectedAnimationName}
                        onChange={setSelectedAnimationName}
                    />
                    {status === 'error' && (
                        <Text style={{ color: theme.mutedText, fontSize: 12, marginTop: 8 }}>
                            {error}
                        </Text>
                    )}
                    {selectedAnimationName && (
                        <Text style={{ color: theme.mutedText, fontSize: 12, marginTop: 8 }}>
                            Selected: {selectedAnimationName}
                        </Text>
                    )}
                </View>
            )}
        </RoundCard>
    );
};

export default React.memo(AnimationBrowser);
