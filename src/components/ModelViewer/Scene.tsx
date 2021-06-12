import { ModelData, SceneSettings } from "./types";
import Model from "./Model";
import * as THREE from "three";
import Service from "./Service";
import _ from "lodash";
const OrbitControls = require("three-orbit-controls")(THREE);

export default class Scene {
    width: number = 0;
    height: number = 0;

    alpha: boolean = true;
    defaultRotZ: number = 0;
    cameraPos?: {
        x: number;
        y: number;
        z: number;
    };

    defaultRotation?: {
        x: number;
        y: number;
        z: number;
    };

    sceneData: ModelData[] = [];

    models: Model[] = [];

    renderer: any;
    scene: any;
    camera: any;
    lightHolder: any;
    controls: any;
    needUpdate: boolean = true;
    loaded: boolean = false;
    options: {
        spin: boolean;
        control: boolean;
    } = {
            spin: true,
            control: true,
        };

    ortho: boolean = false;

    meshlist: any[] = [];

    rootElement: HTMLDivElement | null = null;
    settings: SceneSettings;
    sceneService: Service;

    wheelyindex: any = -1;
    matsByName: any = {};

    wheeldummies: any = [
        "wheel_rf_dummy",
        "wheel_lf_dummy",
        "wheel_lb_dummy",
        "wheel_rb_dummy",
    ];

    SpecialColors: any = {
        primary: [60, 255, 0],
        tertiary: [0, 255, 255],
        light_lf: [255, 175, 0],
        light_rf: [0, 255, 200],
        light_rf_bug: [185, 255, 200],
        "": [255, 0, 175],
        secondary: [255, 0, 175],
    };

    texturesToLoad = 0;
    doNotStart = false;

    constructor(models: ModelData[], autoSpin: boolean) {
        this.settings = new SceneSettings();
        this.options.spin = autoSpin;
        this.sceneService = new Service();
        this.sceneData = models;
    }

    componentDidMount() {
        window.addEventListener("resize", () => this.onWindowResize());
    }

    async init(rootElement: HTMLDivElement | null) {
        this.rootElement = rootElement;

        if (this.rootElement === null) {
            console.log("Unable to attach canvas ");
            return;
        }

        this.createRenderer();
        this.createScene();
        this.setupCamera();

        if (this.sceneData.length) {
            if (this.sceneData[0].type === "skin" || this.sceneData[0].type === "object") {
                await this.setupSkinOrObject(this.sceneData[0]);
            } else if (this.sceneData[0].type === "vehicle") {
                await this.setupVehicle(this.sceneData[0]);
            }
        }

        this.animate();
    }

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: this.alpha,
            preserveDrawingBuffer: true,
        });
        this.renderer.setSize(
            this.rootElement!.offsetWidth,
            this.rootElement!.offsetHeight
        );

        this.rootElement!.appendChild(this.renderer.domElement);
    }

    createScene() {
        // Create a scene
        this.scene = new THREE.Scene();
    }

    setupCamera() {
        let ratio = this!.rootElement!.offsetWidth / this.rootElement!.offsetHeight;

        this.camera = new THREE.PerspectiveCamera(50, ratio, 0.5, 200);

        if (this.cameraPos) {
            this.camera.position.set(
                this.cameraPos.x,
                this.cameraPos.y,
                this.cameraPos.z
            );
        } else {
            this.camera.position.set(0, 0.2, 6);
        }

        this.camera.lookAt(0, -1, 0);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enabled = true;
        this.options.control = true;


        this.controls.addEventListener("change", () => this.onControlChange())
    }

    onControlChange() {
        this.needUpdate = true;
    }

    onWindowResize() {
        if (this.rootElement) {
            this.camera.aspect =
                this.rootElement!.offsetWidth / this.rootElement!.offsetHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(
                this.rootElement!.offsetWidth,
                this.rootElement!.offsetHeight
            );
            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame(() => { });
        }
    }

    animate() {
        this.controls.update();
        if (this.options.spin) {

            this.scene.rotation.y += 0.01;

            if (this.lightHolder)
                this.lightHolder.quaternion.copy(this.camera.quaternion);
            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame(this.animate.bind(this));
        } else {

            if (this.needUpdate) {
                if (this.lightHolder)
                    this.lightHolder.quaternion.copy(this.camera.quaternion);
                this.renderer.render(this.scene, this.camera);
                this.needUpdate = false;
            }
        }
        requestAnimationFrame(this.animate.bind(this));

    }

    async setupSkinOrObject(modelData: ModelData) {
        const spotLight = new THREE.SpotLight(0xffffff, 0.3);
        spotLight.position.set(0, 3, 50);

        spotLight.shadow.mapSize.width = 1024;
        spotLight.shadow.mapSize.height = 1024;

        spotLight.shadow.camera.near = 500;
        spotLight.shadow.camera.far = 4000;
        spotLight.shadow.camera.fov = 30;

        this.scene.add(spotLight);

        const model = new Model(this, modelData);

        model.load();
        await this.addModelToScene(model);
        this.scene.add(new THREE.AmbientLight(-1, 1));
        

        if (modelData.type === "skin") {
            this.camera.fov = 40;
            this.camera.zoom = 1.5;
        }
        else {
            this.camera.fov = 2.5;
            this.camera.zoom = 0.1;
        }

        this.camera.updateProjectionMatrix();

        let rotation = { x: 0, y: 0, z: 0 };
        if (modelData.type === "skin") {
            rotation = this.defaultRotation || { x: -1.55, y: 0, z: -1.55 };
        }
        else {
            rotation = this.defaultRotation || { x: 0, y: 0, z: 0 };
        }


        model.instance.rotation.set(rotation.x, rotation.y, rotation.z);

        requestAnimationFrame(() => {
            let timerCount = 0;
            const timerId = setInterval(() => {
                timerCount++;
                if (timerCount == 3)
                    clearInterval(timerId);
                this.renderer.render(this.scene, this.camera);
            }, 350);
        });
    }

    async setupVehicle(modelData: ModelData) {
        const spotLight = new THREE.SpotLight(0xffffff, 2.5, 60);
        spotLight.position.set(10, 10, 0);

        spotLight.castShadow = true;

        spotLight.shadow.mapSize.width = 1024;
        spotLight.shadow.mapSize.height = 1024;

        spotLight.shadow.camera.near = 500;
        spotLight.shadow.camera.far = 4000;
        spotLight.shadow.camera.fov = 0;

        this.lightHolder = new THREE.Group();
        this.lightHolder.add(spotLight);

        this.scene.add(this.lightHolder);

        const vehicleModel = new Model(this, modelData);

        if (modelData.color) {
            vehicleModel.setColor(modelData.color);
        }

        if (modelData.modifications) {
            vehicleModel.modifications = modelData.modifications;
        }

        await vehicleModel.load();
        const model = await this.addModelToScene(vehicleModel);
        this.scene.add(new THREE.AmbientLight(0xffffff, 1));
        this.camera.fov = 50;
        this.camera.zoom = 0.5;
        this.camera.updateProjectionMatrix();

        if (!model) {
            return;
        }

        const box = new THREE.Box3().setFromObject(model.instance);

        if (!this.ortho && model) {

            this.camera.position.set(
                -box.getSize(new THREE.Vector3()).x * 0.8,
                box.getSize(new THREE.Vector3()).y / 0.78,
                -box.getSize(new THREE.Vector3()).z * 1
            );
            this.camera.lookAt(0, 0, 0);
            this.camera.updateProjectionMatrix();
        }

        if (this.ortho && model) {
            const ratio =
                this.rootElement!.offsetWidth / this.rootElement!.offsetHeight;
            const scope = box.getSize(new THREE.Vector3()).z * 1.5;

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
        vehicleModel.instance.rotation.set(rotation.x, rotation.y, rotation.z);

        requestAnimationFrame(() => {
            let timerCount = 0;
            const timerId = setInterval(() => {
                timerCount++;
                if (timerCount == 3)
                    clearInterval(timerId);
                this.renderer.render(this.scene, this.camera);
            }, 350);
        });

    }

    async addModelToScene(model: Model) {

        if (!_.size(model.object) || !model) {
            console.log("Skipping", model.data?.name, "because empty object");
            return false;
        }

        this.models.push(model);

        this.CreateHierarchyForNew(this.scene, -1, model);

        model.instance.matrixAutoUpdate = true;
        model.instance.rotation.set(-Math.PI / 2, 0, 0);

        return model;
    }

    CreateHierarchyForNew(parentobject3d: any, forparent: any, model: Model) {
        for (let i = 0; i < _.size(model.object); i++) {
            if (model.object[i].parent === forparent && !model.object[i].damaged) {
                const object3dcreated = new THREE.Object3D();

                object3dcreated.name = model.object[i].name;

                const mutrix = Service.computeMatrix(model.object[i]);
                object3dcreated.matrixAutoUpdate = false;
                if (forparent !== -1) {
                    object3dcreated.matrix.copy(mutrix);
                } else {
                    model.instance = object3dcreated;
                }

                parentobject3d.add(object3dcreated);

                if (
                    model.wheelIndex !== -1 &&
                    this.wheeldummies.indexOf(model.object[i].name) !== -1
                ) {
                    if (model.object[i].name.indexOf("wheel_r")) {

                        const herr_euler = new THREE.Euler().setFromRotationMatrix(
                            object3dcreated.matrix
                        );

                        herr_euler.y = Math.PI;

                        object3dcreated.matrix
                            .makeRotationFromEuler(herr_euler)
                            .copyPosition(mutrix);
                    }

                    this.CreateObjectMesh(
                        model.object,
                        model.wheelIndex,
                        object3dcreated,
                        model.matsByName,
                        model.color,
                        model.data
                    );
                } else {
                    this.CreateObjectMesh(
                        model.object,
                        i,
                        object3dcreated,
                        model.matsByName,
                        model.color,
                        model.data
                    );
                }

                this.CreateHierarchyForNew(
                    object3dcreated,
                    model.object[i].frame,
                    model
                );
            }
        }
    }

    CreateObjectMesh(
        Object: any,
        i: any,
        whichobject: any,
        materials_all: any,
        color: any,
        modelData: ModelData | null
    ) {
        if (Object[i] === undefined || modelData === null) {
            return;
        }

        const matsByName = [];

        if (Object[i].geometry === null) {
            return;
        }

        const GeometryMesh = new THREE.Geometry();

        for (const msplitKey in Object[i].geometry.textures) {
            let msplit = parseInt(msplitKey);

            const texture = Object[i].geometry.textures[msplit];

            let alpha = texture.color[3] * (1 / 255);

            if (_.includes(["smoketest1a_sfw"], texture.name)) {
                alpha = 0;
            }

            if (matsByName[msplit] === undefined) {
                let textureUrl = "";
                modelData.textures.forEach((item) => {
                    if (item.name === texture.name) {
                        textureUrl = item.url;
                        return;
                    }
                });

                let curColor = 0xffffff;
                this.texturesToLoad++;
                if (texture.name) {
                    const texturey = new THREE.TextureLoader().load(
                        textureUrl,
                        () => {
                            this.texturesToLoad--;
                            if (this.texturesToLoad === 0) {
                                this.onTexturesLoaded();
                            }
                        },
                        () => { },
                        () => {
                            this.texturesToLoad--;
                            if (this.texturesToLoad === 0) {
                                this.onTexturesLoaded();
                            }
                        }
                    );

                    matsByName[msplit] = new THREE.MeshPhongMaterial({
                        map: texturey,
                        envMap: this.scene.background,
                        shininess: 25,
                        side: THREE.DoubleSide
                    });

                    if (matsByName[msplit].map !== null) {
                        matsByName[msplit].map!.wrapS = matsByName[
                            msplit
                        ].map!.wrapT = THREE.RepeatWrapping;
                    }

                    curColor =
                        texture.color[2] |
                        (texture.color[1] << 8) |
                        (texture.color[0] << 16) |
                        (texture.color[3] << 24);
                } else {
                    matsByName[msplit] = new THREE.MeshBasicMaterial();
                    curColor = 0x000000;
                }

                for (const colorType in this.SpecialColors) {
                    if (
                        this.SpecialColors[colorType][0] === texture.color[0] &&
                        this.SpecialColors[colorType][1] === texture.color[1] &&
                        this.SpecialColors[colorType][2] === texture.color[2]
                    ) {
                        if (colorType === "primary" && _.get(color, "primary") !== undefined) {
                            curColor = this.sceneService.getVehicleColor(color.primary);
                        } else if (
                            colorType === "secondary" &&
                            _.get(color, "secondary") !== undefined
                        ) {
                            curColor = this.sceneService.getVehicleColor(color.secondary);
                        }
                    }
                }

                matsByName[msplit].color.fromArray([
                    ((curColor >> 16) & 0xff) * (1 / 255),
                    ((curColor >> 8) & 0xff) * (1 / 255),
                    (curColor & 0xff) * (1 / 255),
                ]);

                // convert alpha into special handling
                matsByName[msplit].alphaTest = 0.5;

                matsByName[msplit].transparent = false;
                if (alpha !== 1) {
                    matsByName[msplit].opacity = alpha;
                    matsByName[msplit].transparent = true;
                }

                //}
            }

            Object[i].geometry.vertices.forEach(
                (vertex: { x: number; y: number; z: number }) => {
                    GeometryMesh.vertices.push(
                        new THREE.Vector3(vertex.x, vertex.y, vertex.z)
                    );
                }
            );

            if (Object[i].geometry.facetype === "Triangles") {
                for (let I = 0; I < texture.indices.length; I += 3) {
                    const normal = new THREE.Vector3();
                    const color = new THREE.Color(0xffffffff);

                    GeometryMesh.faces.push(
                        new THREE.Face3(
                            texture.indices[I],
                            texture.indices[I + 1],
                            texture.indices[I + 2],
                            normal,
                            color,
                            msplit
                        )
                    );

                    const uvs = [
                        new THREE.Vector2(
                            Object[i].geometry.texcoords[texture.indices[I]].uvx,
                            1 - (Object[i].geometry.texcoords[texture.indices[I]].uvy - 1)
                        ),
                        new THREE.Vector2(
                            Object[i].geometry.texcoords[texture.indices[I + 1]].uvx,
                            1 - (Object[i].geometry.texcoords[texture.indices[I + 1]].uvy - 1)
                        ),
                        new THREE.Vector2(
                            Object[i].geometry.texcoords[texture.indices[I + 2]].uvx,
                            1 - (Object[i].geometry.texcoords[texture.indices[I + 2]].uvy - 1)
                        ),
                    ];

                    GeometryMesh.faceVertexUvs[0].push(uvs);
                }
            } else if (Object[i].geometry.facetype === "Triangle_Strip") {
                for (let I = 0; I < texture.indices.length - 2; I += 1) {
                    let indexes = [];

                    if (I & 1) {
                        indexes = [
                            texture.indices[I],
                            texture.indices[I + 2],
                            texture.indices[I + 1],
                        ];
                    } else {
                        indexes = [
                            texture.indices[I],
                            texture.indices[I + 1],
                            texture.indices[I + 2],
                        ];
                    }

                    const normal = new THREE.Vector3();
                    const color = new THREE.Color(0xffffffff);

                    const face = new THREE.Face3(
                        indexes[0],
                        indexes[1],
                        indexes[2],
                        normal,
                        color,
                        msplit
                    );

                    GeometryMesh.faces.push(face);

                    if (
                        Object[i].geometry.texcoords &&
                        Object[i].geometry.texcoords[indexes[0]]
                    ) {
                        const uvs = [
                            new THREE.Vector2(
                                Object[i].geometry.texcoords[indexes[0]].uvx,
                                1 - (Object[i].geometry.texcoords[indexes[0]].uvy - 1)
                            ),
                            new THREE.Vector2(
                                Object[i].geometry.texcoords[indexes[1]].uvx,
                                1 - (Object[i].geometry.texcoords[indexes[1]].uvy - 1)
                            ),
                            new THREE.Vector2(
                                Object[i].geometry.texcoords[indexes[2]].uvx,
                                1 - (Object[i].geometry.texcoords[indexes[2]].uvy - 1)
                            ),
                        ];
                        GeometryMesh.faceVertexUvs[0].push(uvs);
                    }
                }
            } else {
                alert("fail.");
            }
        }

        GeometryMesh.computeVertexNormals();
        GeometryMesh.computeFaceNormals();

        const newmesh = new THREE.Mesh(GeometryMesh, matsByName);

        if (Object[i].scaleDown) {
            newmesh.scale.set(
                Object[i].scaleDown.x,
                Object[i].scaleDown.y,
                Object[i].scaleDown.z
            );
        }

        whichobject.add(newmesh);
        this.meshlist.push(newmesh);
    }

    onTexturesLoaded() {

    }
}
