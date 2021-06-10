import { ModelData } from "./types";
import Service from "./Service";
import * as _ from "lodash";
import Scene from "./Scene";

export default class Model {
    scene: Scene;
    data: ModelData | null = null;
    object: any;
    wheelIndex: number;
    instance: any;
    matsByName = [];

    color?: {
        primary: number;
        secondary: number;
    };

    Service: Service;

    modifications: number[] = [];

    textures: any[];

    constructor(scene: Scene, data: ModelData) {
        this.scene = scene;
        this.Service = Service.instance;
        this.data = data;
        this.wheelIndex = -1;
        this.textures = [];
    }

    setColor(color: any) {
        this.color = color;
    }

    findPartIndex(part: string): number {
        for (let i = 0; i < _.size(this.object); i++) {
            if (_.get(this.object, `${i}.name`) === part) {
                return Number(i);
            }
        }

        return -1;
    }

    applyTextures() {
        if (!this.object || !this.object[0]) {
            return;
        }

        if (this.textures && this.textures.length) {
            this.textures.forEach((texture) => {
                if (
                    texture[2] !== "none" &&
                    this.object[0].geometry.textures[texture[0]]
                ) {
                    this.object[0].geometry.textures[0].name = texture[3];
                    const color = Number(texture[4]);
                    if (texture.color) {
                        this.object[0].geometry.textures[texture[0]].color = [
                            (color >> 16) & 0xff,
                            (color >> 8) & 0xff,
                            color & 0xff,
                            (color >> 24) & 0xff,
                        ];
                    }
                }
            });
        }
    }

    async load() {
        this.object = this.data?.obj;
        this.wheelIndex = this.findPartIndex("wheel");
        if (this.modifications && _.size(this.modifications)) {
            await this.applyModifications();
        }
    }

    async loadModelData() {
        let result: any = {};
        await fetch("https://assets.open.mp/assets/models/exports/" + this.data?.name + ".json")
            .then((r) => r.json())
            .then((data) => {
                result = data;
            })
            .catch((error) => {
                console.log(error.message);
            });

        if (result.error) {
            result = {};
        }

        this.object = result;
        this.wheelIndex = this.findPartIndex("wheel");
        this.applyTextures();

        if (this.modifications && _.size(this.modifications)) {
            await this.applyModifications();
        }
    }

    async applyModifications() {
        for await (const modid of this.modifications) {
            const info = this.Service.getModificationType(modid);

            if (!info) {
                return false;
            }

            const mod = new Model(this.scene,
                {
                    type: "object",
                    name: info.model,
                    obj: {},
                    textures: [],
                });


            await mod.loadModelData();

            const index = this.findPartIndex(info.type);

            if (index === -1) {
                return false;
            }

            for await (const part of mod.object) {
                if ("geometry" in part) {
                    this.object[index].geometry = part.geometry;
                    if (info.type === "wheel") {
                        this.object[index].scaleDown = {
                            x: 1,
                            y: 0.8,
                            z: 0.8,
                        };
                    }
                }
            };
        }
    }
}
