import { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native-web';
import type { ModelData, SceneController } from 'src/rendering/types';
import Scene from 'src/rendering/Scene';
import { reportError } from 'src/monitoring/reportError';
import type { ParsedAnimation } from 'src/animation/ifpParser';

interface ModelViewerProps {
    models: ModelData[];
    autoSpin: boolean;
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
            {showWheelSpinTest && !sceneError ? (
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={
                        wheelSpin ? 'Stop wheel spin test' : 'Start wheel spin test'
                    }
                    onPress={() => setWheelSpin((current) => !current)}
                    style={{
                        backgroundColor: wheelSpin ? '#635bff' : 'rgba(255, 255, 255, 0.85)',
                        borderColor: '#635bff',
                        borderRadius: 8,
                        borderWidth: 1,
                        bottom: 18,
                        right: 18,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        position: 'absolute',
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
        </div>
    );
}
