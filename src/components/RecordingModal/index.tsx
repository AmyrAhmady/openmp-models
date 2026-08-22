import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native-web';
import MobileModal from 'src/components/MobileModal';
import ModalCloseButton from 'src/components/ModalCloseButton';
import { convertWebmToFormat, type RecordingFormat } from 'src/recording/convertRecording';
import { useTheme } from 'src/theme/ThemeContext';

interface Props {
    visible: boolean;
    webmBlob: Blob | null;
    fileBaseName: string;
    onRequestClose: () => void;
}

type ConversionState =
    { status: 'loading' } | { status: 'ready'; url: string } | { status: 'error'; message: string };

const initialConversionState: ConversionState = { status: 'loading' };

function formatLabel(format: RecordingFormat): string {
    return format.toUpperCase();
}

const RecordingModal = ({ visible, webmBlob, fileBaseName, onRequestClose }: Props) => {
    const { theme } = useTheme();
    const [mp4, setMp4] = useState<ConversionState>(initialConversionState);
    const [gif, setGif] = useState<ConversionState>(initialConversionState);
    const [webmUrl, setWebmUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!webmBlob) {
            setWebmUrl(null);
            return;
        }

        const url = URL.createObjectURL(webmBlob);
        setWebmUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [webmBlob]);

    useEffect(() => {
        if (!webmBlob) {
            setMp4(initialConversionState);
            setGif(initialConversionState);
            return;
        }

        if (!visible) {
            return;
        }

        let active = true;
        setMp4(initialConversionState);
        setGif(initialConversionState);

        const convert = async (
            format: RecordingFormat,
            setState: React.Dispatch<React.SetStateAction<ConversionState>>
        ): Promise<void> => {
            try {
                const blob = await convertWebmToFormat(webmBlob, format);
                if (!active) {
                    return;
                }

                setState({ status: 'ready', url: URL.createObjectURL(blob) });
            } catch (error: unknown) {
                if (!active) {
                    return;
                }

                setState({
                    status: 'error',
                    message: error instanceof Error ? error.message : 'Conversion failed.',
                });
            }
        };

        void (async () => {
            await convert('mp4', setMp4);
            await convert('gif', setGif);
        })();

        return () => {
            active = false;
        };
    }, [visible, webmBlob]);

    useEffect(
        () => () => {
            if (mp4.status === 'ready') {
                URL.revokeObjectURL(mp4.url);
            }
        },
        [mp4]
    );

    useEffect(
        () => () => {
            if (gif.status === 'ready') {
                URL.revokeObjectURL(gif.url);
            }
        },
        [gif]
    );

    const renderDownload = (
        format: RecordingFormat,
        state: ConversionState,
        url: string | null,
        extension: string
    ) => (
        <View
            style={{
                alignItems: 'center',
                borderColor: theme.lines,
                borderRadius: 10,
                borderWidth: 1,
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
            }}
        >
            <Text style={{ color: theme.title, fontSize: 14, fontWeight: '700' }}>
                {formatLabel(format)}
            </Text>
            {state.status === 'loading' ? (
                <View style={{ alignItems: 'center', flexDirection: 'row' }}>
                    <ActivityIndicator color={theme.accent} size="small" />
                    <Text style={{ color: theme.mutedText, fontSize: 12, marginLeft: 8 }}>
                        Converting…
                    </Text>
                </View>
            ) : state.status === 'ready' ? (
                <a
                    href={url ?? state.url}
                    download={`${fileBaseName}.${extension}`}
                    style={{
                        backgroundColor: theme.accent,
                        borderRadius: 7,
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: '800',
                        padding: '8px 10px',
                        textDecoration: 'none',
                    }}
                >
                    Download
                </a>
            ) : (
                <Text style={{ color: '#b42318', fontSize: 12, maxWidth: 180, textAlign: 'right' }}>
                    {state.message}
                </Text>
            )}
        </View>
    );

    return (
        <MobileModal
            visible={visible}
            onRequestClose={onRequestClose}
            accessibilityLabel="Recording downloads"
            contentStyle={{
                backgroundColor: theme.elementBg,
                borderRadius: 16,
                maxWidth: 430,
                padding: 22,
                width: '100%',
            }}
        >
            <View style={{ alignItems: 'center', flexDirection: 'row', marginBottom: 8 }}>
                <Text style={{ color: theme.title, flex: 1, fontSize: 18, fontWeight: '800' }}>
                    Recording ready
                </Text>
                <ModalCloseButton onPress={onRequestClose} color={theme.title} />
            </View>
            <Text style={{ color: theme.mutedText, fontSize: 13, lineHeight: 19 }}>
                Download the recording directly from your browser. MP4 and GIF conversion may take a
                moment.
            </Text>
            {webmUrl && (
                <View
                    style={{
                        alignItems: 'center',
                        borderColor: theme.lines,
                        borderRadius: 10,
                        borderWidth: 1,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginTop: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                    }}
                >
                    <Text style={{ color: theme.title, fontSize: 14, fontWeight: '700' }}>
                        WEBM
                    </Text>
                    <a
                        href={webmUrl}
                        download={`${fileBaseName}.webm`}
                        style={{
                            backgroundColor: theme.accent,
                            borderRadius: 7,
                            color: '#ffffff',
                            fontSize: 12,
                            fontWeight: '800',
                            padding: '8px 10px',
                            textDecoration: 'none',
                        }}
                    >
                        Download
                    </a>
                </View>
            )}
            {webmUrl && renderDownload('mp4', mp4, mp4.status === 'ready' ? mp4.url : null, 'mp4')}
            {webmUrl && renderDownload('gif', gif, gif.status === 'ready' ? gif.url : null, 'gif')}
        </MobileModal>
    );
};

export default React.memo(RecordingModal);
