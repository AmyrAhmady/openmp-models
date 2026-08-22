import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Text, TouchableOpacity, View } from 'react-native-web';
import type { ModelData, SceneController } from 'src/rendering/types';
import Scene from 'src/rendering/Scene';
import { reportError } from 'src/monitoring/reportError';
import type { ParsedAnimation } from 'src/animation/ifpParser';

const RecordingModal = dynamic(() => import('src/components/RecordingModal'), { ssr: false });

interface ModelViewerProps {
    models: ModelData[];
    autoSpin: boolean;
    modelId: number | null;
    animation?: ParsedAnimation | null;
    backgroundColor?: string;
    showWheelSpinTest?: boolean;
}

interface LatestSceneProps {
    models: ModelData[];
    autoSpin: boolean;
    animation: ParsedAnimation | null;
}

function getSceneErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

function reportSceneError(error: unknown, operation: string): void {
    reportError(error, {
        source: 'ModelViewer',
        operation,
    });
}

export default function ModelViewer({
    models,
    autoSpin,
    modelId,
    animation = null,
    backgroundColor = 'transparent',
    showWheelSpinTest = false,
}: ModelViewerProps) {
    const rootElementRef = useRef<HTMLDivElement | null>(null);
    const sceneRef = useRef<SceneController | null>(null);
    const sceneInitializedRef = useRef(false);
    const latestPropsRef = useRef<LatestSceneProps>({ models, autoSpin, animation });
    const [mountAttempt, setMountAttempt] = useState(0);
    const [sceneError, setSceneError] = useState<string | null>(null);
    const [wheelSpin, setWheelSpin] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingError, setRecordingError] = useState<string | null>(null);
    const [recordedWebm, setRecordedWebm] = useState<Blob | null>(null);
    const [recordingFileBaseName, setRecordingFileBaseName] = useState('omp-model-recording');
    const recorderRef = useRef<MediaRecorder | null>(null);
    const recordingStreamRef = useRef<MediaStream | null>(null);
    const recordingChunksRef = useRef<Blob[]>([]);
    latestPropsRef.current = { models, autoSpin, animation };

    useEffect(() => {
        setSceneError(null);
        const scene = new Scene(models, autoSpin);
        sceneRef.current = scene;
        let active = true;

        void scene
            .mount(rootElementRef.current)
            .then(() => {
                if (!active) {
                    return;
                }

                sceneInitializedRef.current = true;
                const latestProps = latestPropsRef.current;
                if (latestProps.models !== models || latestProps.autoSpin !== autoSpin) {
                    void scene
                        .setModel(latestProps.models, latestProps.autoSpin)
                        .then(() => scene.setAnimation(latestProps.animation))
                        .catch((error: unknown) => {
                            if (!active) {
                                return;
                            }

                            reportSceneError(error, 'synchronize model after mount');
                            setSceneError(
                                getSceneErrorMessage(
                                    error,
                                    'The 3D preview could not load this model.'
                                )
                            );
                        });
                } else {
                    scene.setAnimation(latestProps.animation);
                }
            })
            .catch((error: unknown) => {
                if (!active) {
                    return;
                }

                scene.dispose();
                sceneInitializedRef.current = false;
                if (sceneRef.current === scene) {
                    sceneRef.current = null;
                }
                reportSceneError(error, 'initialize 3D preview');
                setSceneError(
                    getSceneErrorMessage(error, 'The 3D preview could not be initialized.')
                );
            });

        return () => {
            active = false;
            sceneInitializedRef.current = false;
            scene.dispose();
            if (sceneRef.current === scene) {
                sceneRef.current = null;
            }
        };
    }, [mountAttempt]);

    useEffect(() => {
        if (!sceneInitializedRef.current) {
            return;
        }

        const scene = sceneRef.current;
        if (!scene) {
            return;
        }

        let active = true;
        setSceneError(null);
        void scene
            .setModel(models, autoSpin)
            .then(() => scene.setAnimation(latestPropsRef.current.animation))
            .catch((error: unknown) => {
                if (!active) {
                    return;
                }

                reportSceneError(error, 'load selected 3D model');
                setSceneError(
                    getSceneErrorMessage(error, 'The 3D preview could not load this model.')
                );
            });

        return () => {
            active = false;
        };
    }, [models, autoSpin]);

    useEffect(() => {
        if (!sceneInitializedRef.current) {
            return;
        }

        sceneRef.current?.setAnimation(animation);
    }, [animation]);

    useEffect(() => {
        sceneRef.current?.setBackground(backgroundColor);
    }, [backgroundColor]);

    useEffect(() => {
        sceneRef.current?.setWheelSpin(wheelSpin);
        return () => sceneRef.current?.setWheelSpin(false);
    }, [wheelSpin]);

    const stopRecording = useCallback((): void => {
        const recorder = recorderRef.current;
        if (!recorder || recorder.state === 'inactive') {
            return;
        }

        recorder.stop();
    }, []);

    const startRecording = useCallback((): void => {
        const canvas = sceneRef.current?.getCanvas();
        if (!canvas || typeof canvas.captureStream !== 'function') {
            setRecordingError('This browser cannot record the 3D preview.');
            return;
        }

        if (typeof MediaRecorder === 'undefined') {
            setRecordingError('This browser does not support WebM recording.');
            return;
        }

        const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(
            (candidate) => MediaRecorder.isTypeSupported(candidate)
        );

        if (!mimeType) {
            setRecordingError('This browser does not support a compatible WebM format.');
            return;
        }

        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, { mimeType });
        const randomSuffix = Array.from({ length: 6 }, () =>
            'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36))
        ).join('');
        recordingChunksRef.current = [];
        recordingStreamRef.current = stream;
        recorderRef.current = recorder;
        setRecordedWebm(null);
        setRecordingFileBaseName(`omp-model-${modelId ?? 'unknown'}-${randomSuffix}`);
        setRecordingError(null);
        setIsRecording(true);

        recorder.ondataavailable = (event: BlobEvent) => {
            if (event.data.size > 0) {
                recordingChunksRef.current.push(event.data);
            }
        };
        recorder.onerror = () => {
            setRecordingError('The recording could not be completed.');
            setIsRecording(false);
            recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
            recordingStreamRef.current = null;
            recorderRef.current = null;
        };
        recorder.onstop = () => {
            const blob = new Blob(recordingChunksRef.current, { type: 'video/webm' });
            recordingChunksRef.current = [];
            recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
            recordingStreamRef.current = null;
            recorderRef.current = null;
            setIsRecording(false);

            if (blob.size > 0) {
                setRecordedWebm(blob);
            } else {
                setRecordingError('The recording was empty.');
            }
        };
        recorder.start(1000);
    }, [modelId]);

    useEffect(
        () => () => {
            const recorder = recorderRef.current;
            if (recorder && recorder.state !== 'inactive') {
                recorder.stop();
            }
            recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
        },
        []
    );

    return (
        <div
            ref={rootElementRef}
            style={{
                height: '100%',
                width: '100%',
                backgroundColor,
            }}
        >
            {sceneError ? (
                <View
                    style={{
                        alignItems: 'center',
                        height: '100%',
                        justifyContent: 'center',
                        paddingHorizontal: 24,
                    }}
                >
                    <Text
                        accessibilityRole="alert"
                        style={{
                            color: '#6b7280',
                            fontSize: 14,
                            textAlign: 'center',
                        }}
                    >
                        3D preview unavailable
                    </Text>
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Retry 3D preview"
                        onPress={() => setMountAttempt((attempt) => attempt + 1)}
                        style={{
                            backgroundColor: '#635bff',
                            borderRadius: 8,
                            marginTop: 14,
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                        }}
                    >
                        <Text
                            style={{
                                color: '#ffffff',
                                fontSize: 13,
                                fontWeight: '800',
                            }}
                        >
                            Retry
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : null}
            {!sceneError ? (
                <View
                    style={{
                        alignItems: 'flex-end',
                        bottom: 18,
                        position: 'absolute',
                        right: 18,
                    }}
                >
                    {recordingError ? (
                        <Text
                            accessibilityRole="alert"
                            style={{
                                color: '#b42318',
                                fontSize: 11,
                                marginBottom: 6,
                                maxWidth: 220,
                                textAlign: 'right',
                            }}
                        >
                            {recordingError}
                        </Text>
                    ) : null}
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={isRecording ? 'Stop recording' : 'Record model preview'}
                        onPress={isRecording ? stopRecording : startRecording}
                        style={{
                            backgroundColor: isRecording ? '#b42318' : 'rgba(255, 255, 255, 0.9)',
                            borderColor: isRecording ? '#b42318' : '#635bff',
                            borderRadius: 8,
                            borderWidth: 1,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                        }}
                    >
                        <Text
                            style={{
                                color: isRecording ? '#ffffff' : '#635bff',
                                fontSize: 12,
                                fontWeight: '800',
                            }}
                        >
                            {isRecording ? 'Stop recording' : 'Record'}
                        </Text>
                    </TouchableOpacity>
                    {showWheelSpinTest ? (
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel={
                                wheelSpin ? 'Stop wheel spin test' : 'Start wheel spin test'
                            }
                            onPress={() => setWheelSpin((current) => !current)}
                            style={{
                                backgroundColor: wheelSpin
                                    ? '#635bff'
                                    : 'rgba(255, 255, 255, 0.85)',
                                borderColor: '#635bff',
                                borderRadius: 8,
                                borderWidth: 1,
                                marginTop: 8,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                            }}
                        >
                            <Text
                                style={{
                                    color: wheelSpin ? '#ffffff' : '#635bff',
                                    fontSize: 12,
                                    fontWeight: '800',
                                }}
                            >
                                {wheelSpin ? 'Stop wheel spin' : 'Test wheel spin'}
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            ) : null}
            {recordedWebm ? (
                <RecordingModal
                    visible
                    webmBlob={recordedWebm}
                    fileBaseName={recordingFileBaseName}
                    onRequestClose={() => setRecordedWebm(null)}
                />
            ) : null}
        </div>
    );
}
