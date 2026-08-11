import { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native-web';
import type { ModelData, SceneController } from 'src/rendering/types';
import Scene from 'src/rendering/Scene';
import { reportError } from 'src/monitoring/reportError';

interface ModelViewerProps {
    models: ModelData[];
    autoSpin: boolean;
    backgroundColor?: string;
}

interface LatestSceneProps {
    models: ModelData[];
    autoSpin: boolean;
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
    backgroundColor = 'transparent',
}: ModelViewerProps) {
    const rootElementRef = useRef<HTMLDivElement | null>(null);
    const sceneRef = useRef<SceneController | null>(null);
    const sceneInitializedRef = useRef(false);
    const latestPropsRef = useRef<LatestSceneProps>({ models, autoSpin });
    const [mountAttempt, setMountAttempt] = useState(0);
    const [sceneError, setSceneError] = useState<string | null>(null);
    latestPropsRef.current = { models, autoSpin };

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
        void scene.setModel(models, autoSpin).catch((error: unknown) => {
            if (!active) {
                return;
            }

            reportSceneError(error, 'load selected 3D model');
            setSceneError(getSceneErrorMessage(error, 'The 3D preview could not load this model.'));
        });

        return () => {
            active = false;
        };
    }, [models, autoSpin]);

    useEffect(() => {
        sceneRef.current?.setBackground(backgroundColor);
    }, [backgroundColor]);

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
        </div>
    );
}
