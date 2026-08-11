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

interface ModelFrameEntry {
    index: number;
    frame: ModelExport[number];
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
    } = {
        spin: true,
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
        this.sceneData = models;
        this.options.spin = autoSpin;
        this.textureUrlLookup = createTextureUrlLookup(models[0]?.textures ?? []);
        const generation = ++this.modelLoadGeneration;

        if (!this.renderer || !this.camera || !this.scene) {
            return;
        }

        this.renderScheduler.setSpinning(autoSpin, false);
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

    setSpin(autoSpin: boolean): void {
        this.options.spin = autoSpin;
        if (!this.renderer || !this.scene || !this.camera) {
            return;
        }

        this.needUpdate = true;
        this.renderScheduler.setSpinning(autoSpin);
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
            this.scene.rotation.y += 0.01;
            this.renderOnce();
        } else if (this.needUpdate) {
            this.renderOnce();
            this.needUpdate = false;
        }
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

        const spotLight = new THREE.SpotLight(0xffffff, 0.3);
        spotLight.position.set(0, 3, 50);

        this.scene.add(spotLight);

        await this.addModelToScene(model);
        if (
            generation !== this.modelLoadGeneration ||
            this.disposed ||
            !this.scene ||
            !this.camera
        ) {
            return;
        }
        this.scene.add(new THREE.AmbientLight(-1, 1));

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
            rotation = this.defaultRotation || { x: -1.55, y: 0, z: -1.55 };
        } else {
            rotation = this.defaultRotation || { x: 0, y: 0, z: 0 };
        }

        if (!model.instance) {
            return;
        }
        model.instance.rotation.set(rotation.x, rotation.y, rotation.z);

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

        const spotLight = new THREE.SpotLight(0xffffff, 2.5, 60);
        spotLight.position.set(10, 10, 0);

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
        this.lightHolder.add(spotLight);
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
        this.scene.add(new THREE.AmbientLight(0xffffff, 1));
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
            this.camera.position.set(-modelSize.x * 0.8, modelSize.y / 0.78, -modelSize.z);
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

    private createHierarchy(
        parentObject: THREE.Object3D,
        parentFrame: number,
        model: Model,
        childrenByParent: Map<number, ModelFrameEntry[]>
    ) {
        const children = childrenByParent.get(parentFrame) ?? [];
        for (const { index, frame: objectData } of children) {
            const object3d = new THREE.Object3D();

            object3d.name = objectData.name;

            const matrix = Service.computeMatrix(objectData);
            object3d.matrixAutoUpdate = false;
            if (parentFrame !== -1) {
                object3d.matrix.copy(matrix);
            } else {
                model.instance = object3d;
            }

            parentObject.add(object3d);

            if (model.wheelIndex !== -1 && Scene.wheelDummies.has(objectData.name)) {
                if (objectData.name.includes('wheel_r')) {
                    const herr_euler = new THREE.Euler().setFromRotationMatrix(object3d.matrix);

                    herr_euler.y = Math.PI;

                    object3d.matrix.makeRotationFromEuler(herr_euler).copyPosition(matrix);
                }

                this.createObjectMesh(model.object, model.wheelIndex, object3d, model.color);
            } else {
                this.createObjectMesh(model.object, index, object3d, model.color);
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
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        this.textureCache.set(url, texture);
        return texture;
    }

    private createObjectMesh(
        modelExport: ModelExport,
        frameIndex: number,
        object: THREE.Object3D,
        color: ModelData['color']
    ) {
        const frame = modelExport[frameIndex];
        if (frame === undefined || frame.geometry === null) {
            return;
        }

        const matsByName: (THREE.MeshPhongMaterial | THREE.MeshBasicMaterial)[] = [];
        const geometry = frame.geometry;

        geometry.textures.forEach((texture, msplit) => {
            let alpha = texture.color[3] * (1 / 255);

            if (texture.name === 'smoketest1a_sfw') {
                alpha = 0;
            }

            const textureUrl = this.textureUrlLookup.get(normalizeTextureName(texture.name));
            let curColor = 0x000000;
            if (textureUrl) {
                curColor =
                    texture.color[2] |
                    (texture.color[1] << 8) |
                    (texture.color[0] << 16) |
                    (texture.color[3] << 24);
            }

            const specialColorType = Scene.specialColorTypes.get(
                getRgbKey(texture.color[0], texture.color[1], texture.color[2])
            );
            if (specialColorType === 'primary' && color?.primary !== undefined) {
                curColor = this.sceneService.getVehicleColor(color.primary);
            } else if (specialColorType === 'secondary' && color?.secondary !== undefined) {
                curColor = this.sceneService.getVehicleColor(color.secondary);
            }

            const materialKey = `${textureUrl ?? 'basic'}:${curColor >>> 0}:${alpha}`;
            let material = this.materialCache.get(materialKey);
            if (!material) {
                material = textureUrl
                    ? new THREE.MeshPhongMaterial({
                          map: this.getOrLoadTexture(textureUrl),
                          shininess: 25,
                          side: THREE.FrontSide,
                          flatShading: true,
                      })
                    : new THREE.MeshBasicMaterial();

                material.color.fromArray([
                    ((curColor >> 16) & 0xff) * (1 / 255),
                    ((curColor >> 8) & 0xff) * (1 / 255),
                    (curColor & 0xff) * (1 / 255),
                ]);
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
        indexedGeometry.groups.forEach((group) =>
            geometryMesh.addGroup(group.start, group.count, group.materialIndex)
        );
        geometryMesh.computeVertexNormals();

        const newMesh = new THREE.Mesh(geometryMesh, matsByName);

        if (frame.scaleDown) {
            newMesh.scale.set(frame.scaleDown.x, frame.scaleDown.y, frame.scaleDown.z);
        }

        object.add(newMesh);
    }
}
