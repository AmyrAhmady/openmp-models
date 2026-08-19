import type { ModelData, SceneController, Vector3D } from './types';
import Model from './Model';
import * as THREE from 'three';
import Service from './Service';
import type { ModelExport } from 'src/domain/modelAssets';
import { getModelExport, isModelAssetAbortError } from 'src/domain/modelAssetClient';
import type { ModelAssetLoader } from 'src/domain/modelAssetClient';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildIndexedGeometry } from './geometryBuilder';
import RenderScheduler from './renderScheduler';
import { createTextureUrlLookup, normalizeTextureName } from './textureLookup';
import type { AnimationKeyframe, ParsedAnimation } from 'src/animation/ifpParser';

function disposeMaterial(material: THREE.Material, disposedTextures: Set<THREE.Texture>): void {
    const materialWithMaps = material as THREE.Material & {
        map?: THREE.Texture | null;
        envMap?: THREE.Texture | null;
    };

    if (materialWithMaps.map && !disposedTextures.has(materialWithMaps.map)) {
        materialWithMaps.map.dispose();
        disposedTextures.add(materialWithMaps.map);
    }
    if (materialWithMaps.envMap && !disposedTextures.has(materialWithMaps.envMap)) {
        materialWithMaps.envMap.dispose();
        disposedTextures.add(materialWithMaps.envMap);
    }
    material.dispose();
}

function disposeSceneGraph(
    scene: THREE.Scene,
    disposedTextures = new Set<THREE.Texture>(),
    disposedMaterials = new Set<THREE.Material>(),
    disposedGeometries = new Set<THREE.BufferGeometry>()
): void {
    scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) {
            return;
        }

        if (!disposedGeometries.has(object.geometry)) {
            disposedGeometries.add(object.geometry);
            object.geometry.dispose();
        }
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
            if (disposedMaterials.has(material)) {
                return;
            }

            disposedMaterials.add(material);
            disposeMaterial(material, disposedTextures);
        });
    });
}

function configureShadowLight(light: THREE.DirectionalLight): void {
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.bias = -0.0005;
    light.shadow.normalBias = 0.02;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 120;
    light.shadow.camera.left = -30;
    light.shadow.camera.right = 30;
    light.shadow.camera.top = 30;
    light.shadow.camera.bottom = -30;
}

interface ModelFrameEntry {
    index: number;
    frame: ModelExport[number];
}

interface SceneViewState {
    position: THREE.Vector3;
    quaternion: THREE.Quaternion;
    sceneRotation: THREE.Euler;
    target: THREE.Vector3 | null;
    zoom: number;
}

interface AnimationTarget {
    object: THREE.Object3D;
    bindMatrix: THREE.Matrix4;
    bindPosition: THREE.Vector3;
    bindScale: THREE.Vector3;
}

interface AnimationModelTarget {
    object: THREE.Object3D;
    bindMatrix: THREE.Matrix4;
}

type SpecialColorType = 'primary' | 'secondary';

interface SpecialColorTable {
    primary: readonly [number, number, number];
    tertiary: readonly [number, number, number];
    light_lf: readonly [number, number, number];
    light_rf: readonly [number, number, number];
    light_rf_bug: readonly [number, number, number];
    '': readonly [number, number, number];
    secondary: readonly [number, number, number];
}

function getRgbKey(red: number, green: number, blue: number): string {
    return `${red}:${green}:${blue}`;
}

function createFrameChildrenLookup(modelExport: ModelExport): Map<number, ModelFrameEntry[]> {
    const childrenByParent = new Map<number, ModelFrameEntry[]>();

    modelExport.forEach((frame, index) => {
        if (frame.damaged) {
            return;
        }

        const children = childrenByParent.get(frame.parent);
        const entry = { index, frame };
        if (children) {
            children.push(entry);
        } else {
            childrenByParent.set(frame.parent, [entry]);
        }
    });

    return childrenByParent;
}

function hasAlternateSkinOrientation(modelExport: ModelExport): boolean {
    const childrenByParent = createFrameChildrenLookup(modelExport);
    const bounds = new THREE.Box3();
    const vertex = new THREE.Vector3();
    let hasVertices = false;

    const visit = (parentFrame: number, parentMatrix: THREE.Matrix4): void => {
        const children = childrenByParent.get(parentFrame) ?? [];

        for (const { frame } of children) {
            const frameMatrix =
                parentFrame === -1
                    ? parentMatrix
                    : parentMatrix.clone().multiply(Service.computeMatrix(frame));

            if (frame.geometry) {
                for (const modelVertex of frame.geometry.vertices) {
                    vertex
                        .set(modelVertex.x, modelVertex.y, modelVertex.z)
                        .applyMatrix4(frameMatrix);
                    bounds.expandByPoint(vertex);
                    hasVertices = true;
                }
            }

            visit(frame.frame, frameMatrix);
        }
    };

    visit(-1, new THREE.Matrix4());

    if (!hasVertices) {
        return false;
    }

    const size = bounds.getSize(new THREE.Vector3());

    // Normal skin exports are vertical along the transformed Z axis. A small
    // group of exports has its mesh geometry rotated around the Y axis while
    // retaining the same frame hierarchy, making X the dominant body axis.
    return size.x > size.z;
}

const alternateSkinRotation = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().set(0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1)
);

const animationGroundRotation = new THREE.Matrix4().makeRotationY(-Math.PI / 2);

interface SceneDependencies {
    createRenderer: (parameters: THREE.WebGLRendererParameters) => THREE.WebGLRenderer;
    createTextureLoader: () => THREE.TextureLoader;
    createControls: (camera: THREE.Camera, domElement: HTMLCanvasElement) => OrbitControls;
}

const defaultSceneDependencies: SceneDependencies = {
    createRenderer: (parameters) => new THREE.WebGLRenderer(parameters),
    createTextureLoader: () => new THREE.TextureLoader(),
    createControls: (camera, domElement) => new OrbitControls(camera, domElement),
};

export default class Scene implements SceneController {
    alpha: boolean = true;
    cameraPos?: Vector3D;

    defaultRotation?: Vector3D;

    sceneData: ModelData[] = [];

    models: Model[] = [];

    renderer: THREE.WebGLRenderer | null = null;
    scene: THREE.Scene | null = null;
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera | null = null;
    lightHolder: THREE.Group | null = null;
    controls: OrbitControls | null = null;
    needUpdate: boolean = true;
    options: {
        spin: boolean;
        wheelSpin: boolean;
    } = {
        spin: true,
        wheelSpin: false,
    };

    ortho: boolean = false;

    rootElement: HTMLDivElement | null = null;
    sceneService: Service;

    private static readonly wheelDummies: ReadonlySet<string> = new Set([
        'wheel_rf_dummy',
        'wheel_lf_dummy',
        'wheel_lb_dummy',
        'wheel_rb_dummy',
    ]);

    private static readonly doubleSidedTextures: ReadonlySet<string> = new Set([
        'vehiclesteering128',
    ]);

    private static readonly specialColors: Readonly<SpecialColorTable> = {
        primary: [60, 255, 0],
        tertiary: [0, 255, 255],
        light_lf: [255, 175, 0],
        light_rf: [0, 255, 200],
        light_rf_bug: [185, 255, 200],
        '': [255, 0, 175],
        secondary: [255, 0, 175],
    };

    private static readonly specialColorTypes: ReadonlyMap<string, SpecialColorType> = new Map([
        [
            getRgbKey(
                Scene.specialColors.primary[0],
                Scene.specialColors.primary[1],
                Scene.specialColors.primary[2]
            ),
            'primary',
        ],
        [
            getRgbKey(
                Scene.specialColors.secondary[0],
                Scene.specialColors.secondary[1],
                Scene.specialColors.secondary[2]
            ),
            'secondary',
        ],
    ]);

    private resizeHandler = () => this.onWindowResize();
    private controlChangeHandler = () => this.onControlChange();
    private modelLoadGeneration = 0;
    private disposed = false;
    private textureLoader: THREE.TextureLoader;
    private textureCache = new Map<string, THREE.Texture>();
    private textureUrlLookup = new Map<string, string>();
    private materialCache = new Map<string, THREE.MeshPhongMaterial | THREE.MeshBasicMaterial>();
    private readonly loadModelExport: ModelAssetLoader;
    private modelLoadAbortController: AbortController | null = null;
    private backgroundColor = 'transparent';
    private visibilityHandler = () => this.onVisibilityChange();
    private readonly renderScheduler: RenderScheduler;
    private readonly dependencies: SceneDependencies;
    private activeAnimation: ParsedAnimation | null = null;
    private animationStartTime = 0;
    private animationTargets = new Map<string, AnimationTarget>();
    private animationModelTarget: AnimationModelTarget | null = null;

    constructor(
        models: ModelData[],
        autoSpin: boolean,
        loadModelExport: ModelAssetLoader = getModelExport,
        dependencies: Partial<SceneDependencies> = {}
    ) {
        this.options.spin = autoSpin;
        this.sceneService = new Service();
        this.sceneData = models;
        this.textureUrlLookup = createTextureUrlLookup(models[0]?.textures ?? []);
        this.loadModelExport = loadModelExport;
        this.dependencies = { ...defaultSceneDependencies, ...dependencies };
        this.textureLoader = this.dependencies.createTextureLoader();
        this.renderScheduler = new RenderScheduler(
            (spinning) => this.renderScheduledFrame(spinning),
            { spinning: autoSpin }
        );
    }

    async setModel(models: ModelData[], autoSpin = this.options.spin): Promise<void> {
        const previousModel = this.sceneData[0];
        const nextModel = models[0];
        const viewState =
            previousModel &&
            nextModel &&
            previousModel.type === nextModel.type &&
            previousModel.name === nextModel.name
                ? this.captureViewState()
                : null;

        this.sceneData = models;
        this.options.spin = autoSpin;
        this.textureUrlLookup = createTextureUrlLookup(models[0]?.textures ?? []);
        const generation = ++this.modelLoadGeneration;

        if (!this.renderer || !this.camera || !this.scene) {
            return;
        }

        this.renderScheduler.setSpinning(autoSpin, false);
        this.restoreAnimationModelTarget();
        this.activeAnimation = null;
        this.animationTargets.clear();
        this.animationModelTarget = null;
        this.clearSceneResources();
        this.scene = new THREE.Scene();
        this.lightHolder = null;
        this.models = [];
        this.textureCache.clear();
        this.materialCache.clear();

        this.modelLoadAbortController?.abort();
        const abortController = new AbortController();
        this.modelLoadAbortController = abortController;

        try {
            await this.loadCurrentModel(generation, abortController.signal);
            if (viewState && generation === this.modelLoadGeneration && !this.disposed) {
                this.restoreViewState(viewState);
            }
            if (generation === this.modelLoadGeneration && !this.disposed) {
                this.setSpin(this.options.spin);
            }
        } catch (error) {
            if (!isModelAssetAbortError(error)) {
                throw error;
            }
        } finally {
            if (this.modelLoadAbortController === abortController) {
                this.modelLoadAbortController = null;
            }
        }
    }

    private captureViewState(): SceneViewState | null {
        if (!this.camera) {
            return null;
        }

        return {
            position: this.camera.position.clone(),
            quaternion: this.camera.quaternion.clone(),
            sceneRotation: this.scene?.rotation.clone() ?? new THREE.Euler(),
            target: this.controls?.target?.clone() ?? null,
            zoom: this.camera.zoom,
        };
    }

    private restoreViewState(viewState: SceneViewState): void {
        if (!this.camera) {
            return;
        }

        this.scene?.rotation.copy(viewState.sceneRotation);
        this.camera.position.copy(viewState.position);
        this.camera.quaternion.copy(viewState.quaternion);
        this.camera.zoom = viewState.zoom;

        if (viewState.target && this.controls?.target) {
            this.controls.target.copy(viewState.target);
            this.controls.update();
        }

        this.camera.updateProjectionMatrix();
        this.render();
    }

    private async loadCurrentModel(generation: number, signal: AbortSignal): Promise<void> {
        const modelData = this.sceneData[0];
        if (!modelData || !this.scene || !this.camera || this.disposed) {
            this.needUpdate = true;
            return;
        }

        if (modelData.type === 'skin' || modelData.type === 'object') {
            await this.setupSkinOrObject(modelData, generation, signal);
        } else if (modelData.type === 'vehicle') {
            await this.setupVehicle(modelData, generation, signal);
        }

        if (generation !== this.modelLoadGeneration || this.disposed) {
            return;
        }

        this.needUpdate = true;
    }

    private clearSceneResources(): void {
        const disposedTextures = new Set<THREE.Texture>();
        const disposedMaterials = new Set<THREE.Material>();
        const disposedGeometries = new Set<THREE.BufferGeometry>();

        if (this.scene) {
            disposeSceneGraph(this.scene, disposedTextures, disposedMaterials, disposedGeometries);
            this.scene.clear();
        }

        for (const material of Array.from(this.materialCache.values())) {
            if (disposedMaterials.has(material)) {
                continue;
            }

            disposedMaterials.add(material);
            disposeMaterial(material, disposedTextures);
        }

        for (const texture of Array.from(this.textureCache.values())) {
            if (disposedTextures.has(texture)) {
                continue;
            }

            disposedTextures.add(texture);
            texture.dispose();
        }
    }

    dispose(): void {
        if (this.disposed) {
            return;
        }

        this.disposed = true;
        this.modelLoadGeneration++;
        this.modelLoadAbortController?.abort();
        this.modelLoadAbortController = null;

        this.renderScheduler.dispose();

        window.removeEventListener('resize', this.resizeHandler);
        document.removeEventListener('visibilitychange', this.visibilityHandler);
        if (this.controls) {
            this.controls.removeEventListener('change', this.controlChangeHandler);
            this.controls.dispose();
        }
        this.clearSceneResources();

        if (this.renderer) {
            if (this.renderer.domElement.parentNode === this.rootElement) {
                this.rootElement?.removeChild(this.renderer.domElement);
            }
            this.renderer.dispose();
            this.renderer = null;
        }

        this.controls = null;
        this.camera = null;
        this.scene = null;
        this.rootElement = null;
        this.models = [];
        this.activeAnimation = null;
        this.animationTargets.clear();
        this.animationModelTarget = null;
        this.textureCache.clear();
        this.materialCache.clear();
    }

    async mount(rootElement: HTMLDivElement | null): Promise<void> {
        if (this.renderer) {
            this.dispose();
        }

        this.rootElement = rootElement;
        this.disposed = false;

        if (this.rootElement === null) {
            throw new Error('The 3D preview has no mount element.');
        }

        this.createRenderer();
        this.createScene();
        this.setupCamera();
        this.applyBackgroundColor();
        window.addEventListener('resize', this.resizeHandler);
        document.addEventListener('visibilitychange', this.visibilityHandler);

        const generation = ++this.modelLoadGeneration;
        this.modelLoadAbortController?.abort();
        const abortController = new AbortController();
        this.modelLoadAbortController = abortController;

        try {
            await this.loadCurrentModel(generation, abortController.signal);
            if (!this.disposed) {
                this.setSpin(this.options.spin);
            }
        } catch (error) {
            if (!isModelAssetAbortError(error)) {
                throw error;
            }
        } finally {
            if (this.modelLoadAbortController === abortController) {
                this.modelLoadAbortController = null;
            }
        }
    }

    setBackground(color: string): void {
        this.backgroundColor = color;
        this.applyBackgroundColor();
        this.render();
    }

    setAnimation(animation: ParsedAnimation | null): void {
        this.restoreAnimationTargets();
        this.restoreAnimationModelTarget();
        this.activeAnimation = null;
        this.animationTargets.clear();
        this.animationModelTarget = null;

        if (animation && this.sceneData[0]?.type === 'skin' && this.models[0]?.instance) {
            this.captureAnimationTargets(this.models[0].instance);
            this.captureAnimationModelTarget(this.models[0].instance);
            this.activeAnimation = animation;
            this.animationStartTime = this.getAnimationClock();
        }

        this.needUpdate = true;
        this.renderScheduler.setSpinning(
            this.options.spin || this.options.wheelSpin || Boolean(this.activeAnimation)
        );
    }

    setSpin(autoSpin: boolean): void {
        this.options.spin = autoSpin;
        if (!this.renderer || !this.scene || !this.camera) {
            return;
        }

        this.needUpdate = true;
        this.renderScheduler.setSpinning(
            autoSpin || this.options.wheelSpin || Boolean(this.activeAnimation)
        );
    }

    setWheelSpin(spinning: boolean): void {
        this.options.wheelSpin = spinning;
        this.needUpdate = true;
        if (spinning) {
            this.renderScheduler.setSpinning(true);
            return;
        }

        this.renderScheduler.setSpinning(
            this.options.spin || Boolean(this.activeAnimation)
        );
        this.render();
    }

    render(): void {
        if (!this.renderer || !this.scene || !this.camera) {
            return;
        }

        this.needUpdate = true;
        this.renderScheduler.request();
    }

    private applyBackgroundColor(): void {
        if (!this.renderer) {
            return;
        }

        if (this.backgroundColor === 'transparent') {
            this.renderer.setClearColor(0x000000, 0);
            return;
        }

        this.renderer.setClearColor(this.backgroundColor, 1);
    }

    private onVisibilityChange(): void {
        if (document.hidden) {
            this.renderScheduler.cancel();
            return;
        }

        this.render();
    }

    createRenderer() {
        this.renderer = this.dependencies.createRenderer({
            antialias: true,
            alpha: this.alpha,
        });
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        if ('shadowMap' in this.renderer && this.renderer.shadowMap) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        const { width, height } = this.getViewportSize();
        this.renderer.setSize(width, height);
        this.applyBackgroundColor();

        this.rootElement!.appendChild(this.renderer.domElement);
    }

    createScene() {
        // Create a scene
        this.scene = new THREE.Scene();
    }

    setupCamera() {
        const { width, height } = this.getViewportSize();
        const ratio = width / height;

        this.camera = this.ortho
            ? new THREE.OrthographicCamera(-ratio, ratio, 1, -1, 0.5, 200)
            : new THREE.PerspectiveCamera(50, ratio, 0.5, 200);
        const camera = this.camera;
        const renderer = this.renderer;
        if (!camera || !renderer) {
            return;
        }

        if (this.cameraPos) {
            camera.position.set(this.cameraPos.x, this.cameraPos.y, this.cameraPos.z);
        } else {
            camera.position.set(0, 0.2, 6);
        }

        camera.lookAt(0, -1, 0);

        this.controls = this.dependencies.createControls(camera, renderer.domElement);
        this.controls.enabled = true;
        this.controls.addEventListener('change', this.controlChangeHandler);
    }

    onControlChange() {
        this.needUpdate = true;
        if (!this.options.spin) {
            this.render();
        }
    }

    private getViewportSize(): { width: number; height: number } {
        return {
            width: Math.max(1, this.rootElement?.offsetWidth ?? 0),
            height: Math.max(1, this.rootElement?.offsetHeight ?? 0),
        };
    }

    onWindowResize() {
        if (this.rootElement && this.camera && this.renderer) {
            const { width, height } = this.getViewportSize();
            const ratio = width / height;
            if (this.camera instanceof THREE.PerspectiveCamera) {
                this.camera.aspect = ratio;
            } else {
                const verticalSize = this.camera.top - this.camera.bottom;
                this.camera.left = (-ratio * verticalSize) / 2;
                this.camera.right = (ratio * verticalSize) / 2;
            }
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
            this.render();
        }
    }

    private renderOnce(): void {
        if (!this.renderer || !this.scene || !this.camera) {
            return;
        }

        if (this.lightHolder) {
            this.lightHolder.quaternion.copy(this.camera.quaternion);
        }

        this.renderer.render(this.scene, this.camera);
    }

    private renderScheduledFrame(spinning: boolean): void {
        if (this.disposed || !this.renderer || !this.scene || !this.camera) {
            return;
        }

        if (spinning) {
            if (this.activeAnimation) {
                this.applyAnimationFrame(this.getAnimationClock());
            }
            if (this.options.spin) {
                this.scene.rotation.y += 0.01;
            }
            if (this.options.wheelSpin && this.sceneData[0]?.type === 'vehicle') {
                this.rotateWheels(0.12);
            }
            this.renderOnce();
        } else if (this.needUpdate) {
            this.renderOnce();
            this.needUpdate = false;
        }
    }

    private getAnimationClock(): number {
        return typeof performance !== 'undefined' ? performance.now() : Date.now();
    }

    private captureAnimationTargets(root: THREE.Object3D): void {
        root.traverse((object) => {
            if (!object.name || object === root) {
                return;
            }

            const bindPosition = new THREE.Vector3();
            const bindScale = new THREE.Vector3();
            object.matrix.decompose(bindPosition, new THREE.Quaternion(), bindScale);

            const target: AnimationTarget = {
                object,
                bindMatrix: object.matrix.clone(),
                bindPosition,
                bindScale,
            };

            this.animationTargets.set(object.name, target);
            const trimmedName = object.name.trim();
            if (trimmedName && !this.animationTargets.has(trimmedName)) {
                this.animationTargets.set(trimmedName, target);
            }
        });
    }

    private restoreAnimationTargets(): void {
        this.animationTargets.forEach((target) => {
            target.object.matrixAutoUpdate = false;
            target.object.matrix.copy(target.bindMatrix);
            target.object.matrixWorldNeedsUpdate = true;
        });
    }

    private captureAnimationModelTarget(root: THREE.Object3D): void {
        root.updateMatrix();
        this.animationModelTarget = {
            object: root,
            bindMatrix: root.matrix.clone(),
        };

        root.matrixAutoUpdate = false;
        root.matrix.copy(this.animationModelTarget.bindMatrix).premultiply(animationGroundRotation);
        root.matrixWorldNeedsUpdate = true;
    }

    private restoreAnimationModelTarget(): void {
        if (!this.animationModelTarget) {
            return;
        }

        this.animationModelTarget.object.matrixAutoUpdate = true;
        this.animationModelTarget.object.matrix.copy(this.animationModelTarget.bindMatrix);
        this.animationModelTarget.object.matrixWorldNeedsUpdate = true;
    }

    private getAnimationDuration(animation: ParsedAnimation): number {
        return Math.max(
            animation.tracks.reduce(
                (duration, track) => Math.max(duration, track.frames.at(-1)?.time ?? 0),
                0
            ),
            1 / 60
        );
    }

    private sampleAnimationTrack(
        frames: AnimationKeyframe[],
        time: number,
        duration: number
    ): { rotation: THREE.Quaternion; translation: THREE.Vector3 | null } | null {
        if (!frames.length) {
            return null;
        }

        const firstFrame = frames[0];
        if (!firstFrame) {
            return null;
        }

        if (frames.length === 1) {
            return {
                rotation: new THREE.Quaternion(...firstFrame.rotation).normalize(),
                translation: firstFrame.translation
                    ? new THREE.Vector3(...firstFrame.translation)
                    : null,
            };
        }

        const wrappedTime = time % duration;
        const secondFrame = frames[1];
        if (!secondFrame) {
            return null;
        }

        let first: AnimationKeyframe = firstFrame;
        let second: AnimationKeyframe = secondFrame;
        let progress = 0;
        const lastFrame = frames[frames.length - 1];
        if (!lastFrame) {
            return null;
        }

        if (wrappedTime >= lastFrame.time) {
            first = lastFrame;
            second = firstFrame;
            const span = Math.max(duration - first.time + second.time, 1 / 60);
            progress = Math.min(1, (wrappedTime - first.time) / span);
        } else {
            for (let index = 1; index < frames.length; index += 1) {
                const previousFrame = frames[index - 1];
                const nextFrame = frames[index];
                if (previousFrame && nextFrame && wrappedTime <= nextFrame.time) {
                    first = previousFrame;
                    second = nextFrame;
                    const span = Math.max(second.time - first.time, 1 / 60);
                    progress = Math.min(1, Math.max(0, (wrappedTime - first.time) / span));
                    break;
                }
            }
        }

        const rotation = new THREE.Quaternion(...first.rotation)
            .normalize()
            .slerp(new THREE.Quaternion(...second.rotation).normalize(), progress);
        const translation =
            first.translation && second.translation
                ? new THREE.Vector3(...first.translation).lerp(
                      new THREE.Vector3(...second.translation),
                      progress
                  )
                : first.translation
                  ? new THREE.Vector3(...first.translation)
                  : second.translation
                    ? new THREE.Vector3(...second.translation)
                    : null;

        return { rotation, translation };
    }

    private applyAnimationFrame(now: number): void {
        if (!this.activeAnimation || !this.models[0]?.instance) {
            return;
        }

        const duration = this.getAnimationDuration(this.activeAnimation);
        const time = Math.max(0, (now - this.animationStartTime) / 1000);

        for (const track of this.activeAnimation.tracks) {
            const target =
                this.animationTargets.get(track.name) ??
                this.animationTargets.get(track.name.trim()) ??
                (track.boneId === 0 ? this.animationTargets.get('Root') : undefined);
            if (!target) {
                continue;
            }

            const frame = this.sampleAnimationTrack(track.frames, time, duration);
            if (!frame) {
                continue;
            }

            target.object.matrixAutoUpdate = false;
            if (track.boneId === 0) {
                target.object.matrix
                    .copy(target.bindMatrix)
                    .multiply(
                        new THREE.Matrix4().compose(
                            frame.translation ?? target.bindPosition,
                            frame.rotation,
                            target.bindScale
                        )
                    );
            } else {
                target.object.matrix.compose(
                    frame.translation ?? target.bindPosition,
                    frame.rotation,
                    target.bindScale
                );
            }
            target.object.matrixWorldNeedsUpdate = true;
        }

        this.models[0].instance.updateMatrixWorld(true);
    }

    private rotateWheels(angle: number): void {
        this.scene?.traverse((object) => {
            if (
                object instanceof THREE.Mesh &&
                object.parent instanceof THREE.Object3D &&
                Scene.wheelDummies.has(object.parent.name)
            ) {
                object.rotation.x += angle;
            }
        });
    }

    async setupSkinOrObject(
        modelData: ModelData,
        generation = this.modelLoadGeneration,
        signal = this.modelLoadAbortController?.signal
    ) {
        if (
            generation !== this.modelLoadGeneration ||
            this.disposed ||
            !this.scene ||
            !this.camera
        ) {
            return;
        }

        if (!signal) {
            return;
        }

        const model = new Model(modelData, this.sceneService, (name) =>
            this.loadModelExport(name, { signal })
        );
        await model.load();
        if (
            generation !== this.modelLoadGeneration ||
            this.disposed ||
            !this.scene ||
            !this.camera
        ) {
            return;
        }

        if (modelData.type !== 'skin') {
            const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
            keyLight.position.set(4, 8, 10);
            configureShadowLight(keyLight);

            this.scene.add(keyLight);
            this.scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, 1.1));
        }

        await this.addModelToScene(model);
        if (
            generation !== this.modelLoadGeneration ||
            this.disposed ||
            !this.scene ||
            !this.camera
        ) {
            return;
        }
        if (modelData.type === 'skin') {
            if (this.camera instanceof THREE.PerspectiveCamera) {
                this.camera.fov = 40;
            }
            this.camera.zoom = 1.5;
        } else {
            if (this.camera instanceof THREE.PerspectiveCamera) {
                this.camera.fov = 2.5;
            }
            this.camera.zoom = 0.1;
        }

        this.camera.updateProjectionMatrix();

        let rotation = { x: 0, y: 0, z: 0 };
        if (modelData.type === 'skin') {
            rotation = this.defaultRotation || { x: 0, y: Math.PI / 2, z: Math.PI / 2 };
        } else {
            rotation = this.defaultRotation || { x: 0, y: 0, z: 0 };
        }

        if (!model.instance) {
            return;
        }
        model.instance.rotation.set(rotation.x, rotation.y, rotation.z);

        if (modelData.type === 'skin' && hasAlternateSkinOrientation(model.object)) {
            model.instance.quaternion.multiply(alternateSkinRotation);
        }

        this.createSkinnedMeshes(model);

        this.needUpdate = true;
    }

    async setupVehicle(
        modelData: ModelData,
        generation = this.modelLoadGeneration,
        signal = this.modelLoadAbortController?.signal
    ) {
        if (
            generation !== this.modelLoadGeneration ||
            this.disposed ||
            !this.scene ||
            !this.camera
        ) {
            return;
        }

        const keyLight = new THREE.DirectionalLight(0xffffff, 3);
        keyLight.position.set(8, 10, 8);
        configureShadowLight(keyLight);

        if (!signal) {
            return;
        }

        const vehicleModel = new Model(modelData, this.sceneService, (name) =>
            this.loadModelExport(name, { signal })
        );

        if (modelData.color) {
            vehicleModel.setColor(modelData.color);
        }

        if (modelData.modifications) {
            vehicleModel.modifications = modelData.modifications;
        }

        await vehicleModel.load();
        if (
            generation !== this.modelLoadGeneration ||
            this.disposed ||
            !this.scene ||
            !this.camera
        ) {
            return;
        }

        this.lightHolder = new THREE.Group();
        this.lightHolder.add(keyLight);
        this.scene.add(this.lightHolder);

        const model = await this.addModelToScene(vehicleModel);
        if (
            generation !== this.modelLoadGeneration ||
            this.disposed ||
            !this.scene ||
            !this.camera
        ) {
            return;
        }
        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, 1.2));
        if (this.camera instanceof THREE.PerspectiveCamera) {
            this.camera.fov = 50;
        }
        this.camera.zoom = 0.5;
        this.camera.updateProjectionMatrix();

        if (!model || !model.instance) {
            return;
        }

        const box = new THREE.Box3().setFromObject(model.instance);
        const modelSize = box.getSize(new THREE.Vector3());

        if (!this.ortho && model) {
            this.camera.position.set(-modelSize.x * 1.0, modelSize.y / 3.0, -modelSize.z / 0.4);
            this.camera.lookAt(0, 0, 0);
            this.camera.updateProjectionMatrix();
        }

        if (this.ortho && model && this.camera instanceof THREE.OrthographicCamera) {
            const { width, height } = this.getViewportSize();
            const ratio = width / height;
            const scope = modelSize.z * 1.5;

            const _viewport = {
                left: (-ratio * scope) / 2,
                right: (ratio * scope) / 2,
                top: scope / 2,
                bottom: -scope / 2,
                near: -2000,
                far: 2000,
            };

            this.camera.left = _viewport.left;
            this.camera.right = _viewport.right;
            this.camera.top = _viewport.top;
            this.camera.bottom = _viewport.bottom;

            this.camera.updateProjectionMatrix();
        }

        const rotation = this.defaultRotation || { x: 1.57, y: 3.14, z: 2.9 };
        if (!model.instance) {
            return;
        }
        model.instance.rotation.set(rotation.x, rotation.y, rotation.z);

        this.needUpdate = true;
    }

    async addModelToScene(model: Model) {
        if (!model || !this.scene || model.object.length === 0) {
            throw new Error('The selected model contains no renderable frames.');
        }

        this.models.push(model);

        this.createHierarchy(this.scene, -1, model, createFrameChildrenLookup(model.object));

        const instance = model.instance;
        if (!instance) {
            this.models.pop();
            throw new Error('The selected model hierarchy could not be created.');
        }

        instance.matrixAutoUpdate = true;
        instance.rotation.set(-Math.PI / 2, 0, 0);

        return model;
    }

    private createSkinnedMeshes(model: Model): void {
        if (model.data.type !== 'skin' || !model.instance) {
            return;
        }

        const root = model.instance;
        const objectsByFrame = new Map<number, THREE.Bone>();
        root.traverse((object) => {
            if (object instanceof THREE.Bone && typeof object.userData.modelFrameIndex === 'number') {
                objectsByFrame.set(object.userData.modelFrameIndex, object);
            }
        });
        root.updateMatrixWorld(true);

        model.object.forEach((frame, frameIndex) => {
            if (!frame.geometry?.skin) {
                return;
            }
            const geometryBone = objectsByFrame.get(frameIndex);
            if (geometryBone) {
                this.createObjectMesh(
                    model.object,
                    frameIndex,
                    geometryBone,
                    model.color,
                    model.data.type,
                    false,
                    true,
                    objectsByFrame,
                    geometryBone.matrixWorld.clone()
                );
            }
        });
    }

    private createHierarchy(
        parentObject: THREE.Object3D,
        parentFrame: number,
        model: Model,
        childrenByParent: Map<number, ModelFrameEntry[]>
    ) {
        const children = childrenByParent.get(parentFrame) ?? [];
        for (const { index, frame: objectData } of children) {
            const object3d = model.data.type === 'skin' ? new THREE.Bone() : new THREE.Object3D();

            object3d.name = objectData.name;
            object3d.userData.modelFrameIndex = index;

            const matrix = Service.computeMatrix(objectData);
            object3d.matrixAutoUpdate = false;
            if (parentFrame !== -1) {
                object3d.matrix.copy(matrix);
            } else {
                model.instance = object3d;
            }

            parentObject.add(object3d);

            const isWheelDummy = model.wheelIndex !== -1 && Scene.wheelDummies.has(objectData.name);
            const isWheelGeometryChild =
                model.wheelIndex !== -1 &&
                objectData.name === 'wheel' &&
                Scene.wheelDummies.has(parentObject.name);

            if (isWheelGeometryChild) {
                this.createHierarchy(object3d, objectData.frame, model, childrenByParent);
                continue;
            }

            if (isWheelDummy) {
                const isLeftWheel = matrix.elements[12] < 0;
                object3d.matrix.copy(matrix);
                if (isLeftWheel) {
                    object3d.matrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI));
                }

                this.createObjectMesh(
                    model.object,
                    model.wheelIndex,
                    object3d,
                    model.color,
                    model.data.type,
                    true
                );
            } else if (!objectData.geometry?.skin) {
                this.createObjectMesh(model.object, index, object3d, model.color, model.data.type);
            }

            this.createHierarchy(object3d, objectData.frame, model, childrenByParent);
        }
    }

    private getOrLoadTexture(url: string): THREE.Texture {
        const cachedTexture = this.textureCache.get(url);
        if (cachedTexture) {
            return cachedTexture;
        }

        const texture = this.textureLoader.load(
            url,
            () => {
                this.needUpdate = true;
                this.render();
            },
            undefined,
            () => {
                this.needUpdate = true;
                this.render();
            }
        );
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        this.textureCache.set(url, texture);
        return texture;
    }

    private createObjectMesh(
        modelExport: ModelExport,
        frameIndex: number,
        object: THREE.Object3D,
        color: ModelData['color'],
        modelType: ModelData['type'],
        doubleSided = false,
        skinned = false,
        bonesByFrame = new Map<number, THREE.Bone>(),
        skinBindMatrix?: THREE.Matrix4
    ) {
        const frame = modelExport[frameIndex];
        if (frame === undefined || frame.geometry === null) {
            return;
        }

        const matsByName: (THREE.MeshPhongMaterial | THREE.MeshBasicMaterial)[] = [];
        const geometry = frame.geometry;
        const useLighting = modelType !== 'skin';

        geometry.textures.forEach((texture, msplit) => {
            let alpha = texture.color[3] * (1 / 255);

            if (texture.name === 'smoketest1a_sfw') {
                alpha = 0;
            }

            const normalizedTextureName = normalizeTextureName(texture.name);
            const textureUrl = this.textureUrlLookup.get(normalizedTextureName);
            const materialIsDoubleSided =
                doubleSided || Scene.doubleSidedTextures.has(normalizedTextureName);
            const canApplyVehicleColor =
                modelType === 'vehicle' && !normalizedTextureName.includes('lights');

            let curColor =
                texture.color[2] |
                (texture.color[1] << 8) |
                (texture.color[0] << 16) |
                (texture.color[3] << 24);

            const specialColorType = Scene.specialColorTypes.get(
                getRgbKey(texture.color[0], texture.color[1], texture.color[2])
            );
            if (specialColorType === 'primary' && color?.primary !== undefined) {
                curColor = this.sceneService.getVehicleColor(color.primary);
            } else if (specialColorType === 'secondary' && color?.secondary !== undefined) {
                curColor = this.sceneService.getVehicleColor(color.secondary);
            }

            const materialKey = `${textureUrl ?? 'basic'}:${curColor >>> 0}:${alpha}:${materialIsDoubleSided}:${useLighting ? 'lit' : 'unlit'}`;
            let material = this.materialCache.get(materialKey);
            if (!material) {
                material = useLighting
                    ? new THREE.MeshPhongMaterial({
                          shininess: 25,
                          side: materialIsDoubleSided ? THREE.DoubleSide : THREE.FrontSide,
                          flatShading: true,
                      })
                    : new THREE.MeshBasicMaterial({
                          side: materialIsDoubleSided ? THREE.DoubleSide : THREE.FrontSide,
                      });
                if (textureUrl) {
                    material.map = this.getOrLoadTexture(textureUrl);
                }

                if (canApplyVehicleColor) {
                    material.color.fromArray([
                        ((curColor >> 16) & 0xff) * (1 / 255),
                        ((curColor >> 8) & 0xff) * (1 / 255),
                        (curColor & 0xff) * (1 / 255),
                    ]);
                }

                material.alphaTest = 0.5;
                material.transparent = alpha !== 1;
                if (alpha !== 1) {
                    material.opacity = alpha;
                }
                this.materialCache.set(materialKey, material);
            }

            matsByName[msplit] = material;
        });

        const indexedGeometry = buildIndexedGeometry(geometry);

        const geometryMesh = new THREE.BufferGeometry();
        geometryMesh.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(indexedGeometry.positions, 3)
        );
        geometryMesh.setAttribute('uv', new THREE.Float32BufferAttribute(indexedGeometry.uvs, 2));
        geometryMesh.setIndex(indexedGeometry.indices);
        if (skinned && geometry.skin) {
            geometryMesh.setAttribute(
                'skinIndex',
                new THREE.Uint16BufferAttribute(indexedGeometry.skinIndices, 4)
            );
            geometryMesh.setAttribute(
                'skinWeight',
                new THREE.Float32BufferAttribute(indexedGeometry.skinWeights, 4)
            );
        }
        indexedGeometry.groups.forEach((group) =>
            geometryMesh.addGroup(group.start, group.count, group.materialIndex)
        );
        geometryMesh.computeVertexNormals();

        let newMesh: THREE.Mesh;
        if (skinned && geometry.skin) {
            const bones = (geometry.skin.boneFrameIndices ?? []).map((frameIndex) =>
                bonesByFrame.get(frameIndex)
            );
            if (bones.length !== geometry.skin.boneCount || bones.some((bone) => !bone)) {
                return;
            }

            const skinnedMesh = new THREE.SkinnedMesh(
                geometryMesh,
                matsByName
            );
            const bindMatrix = skinBindMatrix ?? object.matrixWorld.clone();
            const bindMatrixInverse = bindMatrix.clone().invert();
            const boneInverses = geometry.skin.inverseMatrices.map((inverseMatrix) =>
                new THREE.Matrix4().fromArray(inverseMatrix).multiply(bindMatrixInverse)
            );
            const skeleton =
                boneInverses.length === bones.length
                    ? new THREE.Skeleton(bones as THREE.Bone[], boneInverses)
                    : new THREE.Skeleton(bones as THREE.Bone[]);
            skinnedMesh.bind(skeleton, bindMatrix);
            skinnedMesh.normalizeSkinWeights();
            newMesh = skinnedMesh;
        } else {
            newMesh = new THREE.Mesh(geometryMesh, matsByName);
        }
        newMesh.castShadow = true;
        newMesh.receiveShadow = true;

        if (frame.scaleDown) {
            newMesh.scale.set(frame.scaleDown.x, frame.scaleDown.y, frame.scaleDown.z);
        }

        if (skinned && skinBindMatrix) {
            object.updateMatrixWorld(true);
            newMesh.matrixAutoUpdate = false;
            newMesh.matrix.copy(object.matrixWorld.clone().invert().multiply(skinBindMatrix));
        }
        object.add(newMesh);
    }
}
