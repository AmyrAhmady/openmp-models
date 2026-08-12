import type { ModelData } from './types';
import Service from './Service';
import * as THREE from 'three';
import type { ModelExport } from 'src/domain/modelAssets';
import type { ModelGeometry, ModelTexcoord } from 'src/domain/modelAssets';
import type { ModelAssetLoader } from 'src/domain/modelAssetClient';
import type { VehicleColorSelection } from 'src/domain/modelPreview';

function cloneModelExport(modelExport: ModelExport): ModelExport {
    return modelExport.map((frame) => ({ ...frame }));
}

function defaultTexcoords(count: number): ModelTexcoord[] {
    return Array.from({ length: count }, () => ({ uvx: 0, uvy: 0 }));
}

function mergeComponentGeometry(
    baseGeometry: ModelGeometry | null,
    componentGeometry: ModelGeometry
): ModelGeometry {
    if (!baseGeometry) {
        return componentGeometry;
    }

    const baseVertexCount = baseGeometry.vertices.length;
    const hasTexcoords = baseGeometry.texcoords !== undefined || componentGeometry.texcoords;
    const baseTexcoords = baseGeometry.texcoords ?? defaultTexcoords(baseVertexCount);
    const componentTexcoords =
        componentGeometry.texcoords ?? defaultTexcoords(componentGeometry.vertices.length);

    const mergedGeometry = {
        facetype: baseGeometry.facetype,
        vertices: [...baseGeometry.vertices, ...componentGeometry.vertices],
        textures: [
            ...baseGeometry.textures,
            ...componentGeometry.textures.map((texture) => ({
                ...texture,
                indices: texture.indices.map((index) => index + baseVertexCount),
            })),
        ],
    };

    return hasTexcoords
        ? { ...mergedGeometry, texcoords: [...baseTexcoords, ...componentTexcoords] }
        : mergedGeometry;
}

export default class Model {
    data: ModelData;
    object: ModelExport = [];
    wheelIndex: number;
    instance: THREE.Object3D | null = null;

    color?: VehicleColorSelection;

    private readonly service: Service;
    private readonly loadModelExport: ModelAssetLoader;

    modifications: number[] = [];

    constructor(data: ModelData, service: Service, loadModelExport: ModelAssetLoader) {
        this.service = service;
        this.data = data;
        this.loadModelExport = loadModelExport;
        this.wheelIndex = -1;
    }

    setColor(color: VehicleColorSelection): void {
        this.color = color;
    }

    findPartIndex(part: string): number {
        return this.object.findIndex((frame) => frame.name === part);
    }

    async load(): Promise<void> {
        this.object = cloneModelExport(this.data.obj);
        this.wheelIndex = this.findPartIndex('wheel');
        if (this.modifications.length) {
            await this.applyModifications();
        }
    }

    async loadModelData(): Promise<void> {
        this.object = cloneModelExport(await this.loadModelExport(this.data.name));

        this.wheelIndex = this.findPartIndex('wheel');

        if (this.modifications.length) {
            await this.applyModifications();
        }
    }

    async applyModifications(): Promise<void> {
        for (const modid of this.modifications) {
            const info = this.service.getModificationType(modid);

            if (!info) {
                continue;
            }

            const mod = new Model(
                {
                    type: 'object',
                    name: info.model,
                    obj: [],
                    textures: [],
                },
                this.service,
                this.loadModelExport
            );

            await mod.loadModelData();

            const index = this.findPartIndex(info.type);

            if (index === -1 || !this.object[index]) {
                continue;
            }

            for (const part of mod.object) {
                if (part.geometry) {
                    this.object[index].geometry =
                        info.type === 'wheel'
                            ? part.geometry
                            : mergeComponentGeometry(this.object[index].geometry, part.geometry);
                    if (info.type === 'wheel') {
                        this.object[index].scaleDown = {
                            x: 1,
                            y: 0.8,
                            z: 0.8,
                        };
                    }
                }
            }
        }
    }
}
