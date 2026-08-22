export type MatrixRow = [number, number, number, number];
export type ModelMatrix = [MatrixRow, MatrixRow, MatrixRow, MatrixRow];

export interface ModelVertex {
    x: number;
    y: number;
    z: number;
}

export interface ModelTexcoord {
    uvx: number;
    uvy: number;
}

export type TextureColor = [number, number, number, number];

export interface ModelTexture {
    color: TextureColor;
    indices: number[];
    name: string;
}

export interface ModelSkinData {
    boneCount: number;
    boneFrameIndices?: number[];
    boneIndices: [number, number, number, number][];
    inverseMatrices: number[][];
    weights: [number, number, number, number][];
}

export type ModelFaceType = 'Triangles' | 'Triangle_Strip';

export interface ModelGeometry {
    facetype: ModelFaceType;
    texcoords?: ModelTexcoord[];
    textures: ModelTexture[];
    vertices: ModelVertex[];
    skin?: ModelSkinData;
}

export interface ModelScale {
    x: number;
    y: number;
    z: number;
}

export interface ModelExportFrame {
    damaged: boolean;
    frame: number;
    geometry: ModelGeometry | null;
    matrix: ModelMatrix;
    name: string;
    parent: number;
    scaleDown?: ModelScale;
}

export type ModelExport = ModelExportFrame[];

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function isFiniteNumberArray(value: unknown): value is number[] {
    return Array.isArray(value) && value.every((item) => isFiniteNumber(item));
}

function findInvalidModelExportPath(value: unknown): string | null {
    if (!Array.isArray(value)) {
        return 'root';
    }

    for (let frameIndex = 0; frameIndex < value.length; frameIndex += 1) {
        const framePath = `frames[${frameIndex}]`;
        const frame = value[frameIndex];
        if (!isRecord(frame)) {
            return framePath;
        }

        if (typeof frame.damaged !== 'boolean') {
            return `${framePath}.damaged`;
        }
        if (!isFiniteNumber(frame.frame)) {
            return `${framePath}.frame`;
        }
        if (typeof frame.name !== 'string') {
            return `${framePath}.name`;
        }
        if (!isFiniteNumber(frame.parent)) {
            return `${framePath}.parent`;
        }

        const matrix = frame.matrix;
        if (!Array.isArray(matrix) || matrix.length !== 4) {
            return `${framePath}.matrix`;
        }
        for (let rowIndex = 0; rowIndex < matrix.length; rowIndex += 1) {
            const row = matrix[rowIndex];
            if (!isFiniteNumberArray(row) || row.length !== 4) {
                return `${framePath}.matrix[${rowIndex}]`;
            }
        }

        if (frame.geometry !== null) {
            const geometryPath = `${framePath}.geometry`;
            const geometry = frame.geometry;
            if (!isRecord(geometry)) {
                return geometryPath;
            }
            if (geometry.facetype !== 'Triangles' && geometry.facetype !== 'Triangle_Strip') {
                return `${geometryPath}.facetype`;
            }

            if (!Array.isArray(geometry.textures)) {
                return `${geometryPath}.textures`;
            }
            for (let textureIndex = 0; textureIndex < geometry.textures.length; textureIndex += 1) {
                const texturePath = `${geometryPath}.textures[${textureIndex}]`;
                const texture = geometry.textures[textureIndex];
                if (!isRecord(texture)) {
                    return texturePath;
                }
                if (!isFiniteNumberArray(texture.color) || texture.color.length !== 4) {
                    return `${texturePath}.color`;
                }
                if (!isFiniteNumberArray(texture.indices)) {
                    return `${texturePath}.indices`;
                }
                if (typeof texture.name !== 'string') {
                    return `${texturePath}.name`;
                }
            }

            if (!Array.isArray(geometry.vertices)) {
                return `${geometryPath}.vertices`;
            }

            if (geometry.skin !== undefined) {
                const skinPath = `${geometryPath}.skin`;
                if (!isRecord(geometry.skin)) {
                    return skinPath;
                }
                if (!isFiniteNumber(geometry.skin.boneCount)) {
                    return `${skinPath}.boneCount`;
                }
                if (
                    !Array.isArray(geometry.skin.boneIndices) ||
                    geometry.skin.boneIndices.length !== geometry.vertices.length
                ) {
                    return `${skinPath}.boneIndices`;
                }
                if (
                    !Array.isArray(geometry.skin.weights) ||
                    geometry.skin.weights.length !== geometry.vertices.length
                ) {
                    return `${skinPath}.weights`;
                }
                if (!Array.isArray(geometry.skin.inverseMatrices)) {
                    return `${skinPath}.inverseMatrices`;
                }
                if (
                    geometry.skin.boneFrameIndices !== undefined &&
                    !isFiniteNumberArray(geometry.skin.boneFrameIndices)
                ) {
                    return `${skinPath}.boneFrameIndices`;
                }
            }
            for (let vertexIndex = 0; vertexIndex < geometry.vertices.length; vertexIndex += 1) {
                const vertexPath = `${geometryPath}.vertices[${vertexIndex}]`;
                const vertex = geometry.vertices[vertexIndex];
                if (!isRecord(vertex)) {
                    return vertexPath;
                }
                if (!isFiniteNumber(vertex.x)) {
                    return `${vertexPath}.x`;
                }
                if (!isFiniteNumber(vertex.y)) {
                    return `${vertexPath}.y`;
                }
                if (!isFiniteNumber(vertex.z)) {
                    return `${vertexPath}.z`;
                }
            }

            if (geometry.texcoords !== undefined) {
                if (!Array.isArray(geometry.texcoords)) {
                    return `${geometryPath}.texcoords`;
                }
                for (
                    let texcoordIndex = 0;
                    texcoordIndex < geometry.texcoords.length;
                    texcoordIndex += 1
                ) {
                    const texcoordPath = `${geometryPath}.texcoords[${texcoordIndex}]`;
                    const texcoord = geometry.texcoords[texcoordIndex];
                    if (!isRecord(texcoord)) {
                        return texcoordPath;
                    }
                    if (!isFiniteNumber(texcoord.uvx)) {
                        return `${texcoordPath}.uvx`;
                    }
                    if (!isFiniteNumber(texcoord.uvy)) {
                        return `${texcoordPath}.uvy`;
                    }
                }
            }
        }

        if (frame.scaleDown !== undefined) {
            const scalePath = `${framePath}.scaleDown`;
            if (!isRecord(frame.scaleDown)) {
                return scalePath;
            }
            if (!isFiniteNumber(frame.scaleDown.x)) {
                return `${scalePath}.x`;
            }
            if (!isFiniteNumber(frame.scaleDown.y)) {
                return `${scalePath}.y`;
            }
            if (!isFiniteNumber(frame.scaleDown.z)) {
                return `${scalePath}.z`;
            }
        }
    }

    return null;
}

export function isModelExport(value: unknown): value is ModelExport {
    return findInvalidModelExportPath(value) === null;
}

function assertModelExport(value: unknown): asserts value is ModelExport {
    const invalidPath = findInvalidModelExportPath(value);
    if (invalidPath !== null) {
        throw new Error(`Invalid model export payload at ${invalidPath}`);
    }
}

export function parseModelExport(value: unknown): ModelExport {
    assertModelExport(value);
    return value;
}
