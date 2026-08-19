import type {
    MatrixRow,
    ModelExport,
    ModelFaceType,
    ModelGeometry,
    ModelMatrix,
    ModelTexture,
    ModelVertex,
} from './modelAssets';

const CHUNK_STRUCT = 0x1;
const CHUNK_STRING = 0x2;
const CHUNK_EXTENSION = 0x3;
const CHUNK_FRAMELIST = 0xe;
const CHUNK_GEOMETRY = 0xf;
const CHUNK_CLUMP = 0x10;
const CHUNK_ATOMIC = 0x14;
const CHUNK_GEOMETRYLIST = 0x1a;
const CHUNK_SKIN = 0x116;
const CHUNK_HANIM = 0x11e;
const CHUNK_BINMESH = 0x50e;
const CHUNK_FRAME = 0x253f2fe;

const FLAGS_TRISTRIP = 0x1;
const FLAGS_TEXTURED = 0x4;
const FLAGS_PRELIT = 0x8;
const FLAGS_NORMALS = 0x10;
const FLAGS_TEXTURED2 = 0x80;

interface Chunk {
    type: number;
    length: number;
    version: number;
    payload: number;
    end: number;
}

interface DffFrame {
    name: string;
    parent: number;
    matrix: ModelMatrix;
    hAnimBoneId: number | null;
    hAnimBoneIds: number[];
    hAnimBoneNumbers: number[];
}

interface DffMaterial {
    color: [number, number, number, number];
    name: string;
}

interface DffSplit {
    materialIndex: number;
    indices: number[];
}

interface DffGeometry {
    flags: number;
    vertexCount: number;
    vertices: ModelVertex[];
    texcoords: { uvx: number; uvy: number }[];
    materials: DffMaterial[];
    faceType: ModelFaceType;
    splits: DffSplit[];
    skin: ModelGeometry['skin'];
}

interface NativeAttribute {
    attribute: number;
    dataType: number;
    normalized: number;
    count: number;
    stride: number;
    offset: number;
}

interface DffAtomic {
    frameIndex: number;
    geometryIndex: number;
}

class DffReader {
    readonly view: DataView;
    readonly bytes: Uint8Array;
    offset = 0;

    constructor(buffer: ArrayBuffer) {
        this.view = new DataView(buffer);
        this.bytes = new Uint8Array(buffer);
    }

    ensure(size: number): void {
        if (size < 0 || this.offset + size > this.view.byteLength) {
            throw new Error('Unexpected end of DFF data');
        }
    }

    uint8(): number {
        this.ensure(1);
        const value = this.view.getUint8(this.offset);
        this.offset += 1;
        return value;
    }

    int32(): number {
        this.ensure(4);
        const value = this.view.getInt32(this.offset, true);
        this.offset += 4;
        return value;
    }

    uint16(): number {
        this.ensure(2);
        const value = this.view.getUint16(this.offset, true);
        this.offset += 2;
        return value;
    }

    uint32(): number {
        this.ensure(4);
        const value = this.view.getUint32(this.offset, true);
        this.offset += 4;
        return value;
    }

    float32(): number {
        this.ensure(4);
        const value = this.view.getFloat32(this.offset, true);
        this.offset += 4;
        return value;
    }

    skip(size: number): void {
        this.ensure(size);
        this.offset += size;
    }

    string(size: number): string {
        this.ensure(size);
        let end = 0;
        while (end < size && this.bytes[this.offset + end] !== 0) {
            end += 1;
        }
        const value = new TextDecoder().decode(this.bytes.subarray(this.offset, this.offset + end));
        this.offset += size;
        return value;
    }

    chunk(): Chunk {
        const type = this.uint32();
        const length = this.uint32();
        const version = this.uint32();
        const payload = this.offset;
        const end = payload + length;
        if (end > this.view.byteLength) {
            throw new Error(`Invalid DFF chunk 0x${type.toString(16)}`);
        }
        return { type, length, version, payload, end };
    }

    finishChunk(chunk: Chunk): void {
        this.offset = chunk.end;
    }
}

function readMatrix(reader: DffReader): ModelMatrix {
    const rotation = Array.from({ length: 9 }, () => reader.float32());
    const position = Array.from({ length: 3 }, () => reader.float32());
    const row0: MatrixRow = [rotation[0] ?? 1, rotation[3] ?? 0, rotation[6] ?? 0, position[0] ?? 0];
    const row1: MatrixRow = [rotation[1] ?? 0, rotation[4] ?? 1, rotation[7] ?? 0, position[1] ?? 0];
    const row2: MatrixRow = [rotation[2] ?? 0, rotation[5] ?? 0, rotation[8] ?? 1, position[2] ?? 0];
    return [row0, row1, row2, [0, 0, 0, 1]];
}

function readFrameExtension(reader: DffReader, frame: DffFrame, end: number): void {
    while (reader.offset < end) {
        const chunk = reader.chunk();
        if (chunk.type === CHUNK_FRAME) {
            frame.name = reader.string(chunk.length);
        } else if (chunk.type === CHUNK_HANIM && chunk.length >= 12) {
            reader.skip(4);
            frame.hAnimBoneId = reader.int32();
            const boneCount = reader.uint32();
            if (boneCount !== 0) {
                reader.skip(8);
            }
            for (let bone = 0; bone < boneCount && reader.offset + 12 <= chunk.end; bone += 1) {
                frame.hAnimBoneIds.push(reader.int32());
                frame.hAnimBoneNumbers.push(reader.uint32());
                reader.skip(4);
            }
        }
        reader.finishChunk(chunk);
    }
}

function readFrameList(reader: DffReader): DffFrame[] {
    const list = reader.chunk();
    if (list.type !== CHUNK_FRAMELIST) {
        throw new Error('DFF is missing its frame list');
    }

    const structure = reader.chunk();
    if (structure.type !== CHUNK_STRUCT) {
        throw new Error('DFF frame list is missing its structure');
    }
    const count = reader.uint32();
    const frames: DffFrame[] = [];
    for (let index = 0; index < count; index += 1) {
        const matrix = readMatrix(reader);
        const parent = reader.int32();
        reader.skip(4);
        frames.push({
            name: '',
            parent,
            matrix,
            hAnimBoneId: null,
            hAnimBoneIds: [],
            hAnimBoneNumbers: [],
        });
    }
    reader.finishChunk(structure);

    for (const frame of frames) {
        const extension = reader.chunk();
        if (extension.type !== CHUNK_EXTENSION) {
            throw new Error('DFF frame is missing its extension');
        }
        readFrameExtension(reader, frame, extension.end);
        reader.finishChunk(extension);
    }
    reader.finishChunk(list);
    return frames;
}

function readTextureName(reader: DffReader): string {
    const texture = reader.chunk();
    if (texture.type !== 0x6) {
        throw new Error(`DFF material is missing its texture (chunk 0x${texture.type.toString(16)} at ${texture.payload})`);
    }
    const structure = reader.chunk();
    reader.skip(structure.end - reader.offset);
    reader.finishChunk(structure);
    const nameChunk = reader.chunk();
    const name = nameChunk.type === CHUNK_STRING ? reader.string(nameChunk.length) : '';
    reader.finishChunk(nameChunk);
    const maskChunk = reader.chunk();
    reader.finishChunk(maskChunk);
    const extension = reader.chunk();
    reader.finishChunk(extension);
    reader.finishChunk(texture);
    return name;
}

function readMaterial(reader: DffReader): DffMaterial {
    const material = reader.chunk();
    if (material.type !== 0x7) {
        throw new Error('DFF geometry is missing a material');
    }
    const structure = reader.chunk();
    if (structure.type !== CHUNK_STRUCT) {
        throw new Error('DFF material is missing its structure');
    }
    reader.skip(4);
    const color: [number, number, number, number] = [
        reader.uint8(),
        reader.uint8(),
        reader.uint8(),
        reader.uint8(),
    ];
    reader.skip(4);
    const hasTexture = reader.int32() !== 0;
    reader.skip(12);
    reader.finishChunk(structure);
    const name = hasTexture ? readTextureName(reader) : '';
    const extension = reader.chunk();
    reader.finishChunk(extension);
    reader.finishChunk(material);
    return { color, name };
}

function readGeometryMaterials(reader: DffReader): DffMaterial[] {
    const materialList = reader.chunk();
    if (materialList.type !== 0x8) {
        throw new Error('DFF geometry is missing its material list');
    }
    const structure = reader.chunk();
    const count = reader.uint32();
    reader.skip(count * 4);
    reader.finishChunk(structure);
    const materials: DffMaterial[] = [];
    for (let index = 0; index < count; index += 1) {
        materials.push(readMaterial(reader));
    }
    reader.finishChunk(materialList);
    return materials;
}

function readBinMesh(reader: DffReader, chunk: Chunk, native: boolean): DffSplit[] {
    const faceType = reader.uint32();
    const splitCount = reader.uint32();
    reader.skip(4);
    const splits: DffSplit[] = [];
    const hasIndices = chunk.length > 12 + splitCount * 8;
    for (let splitIndex = 0; splitIndex < splitCount; splitIndex += 1) {
        const count = reader.uint32();
        const materialIndex = reader.uint32();
        const indices: number[] = [];
        if (hasIndices) {
            for (let index = 0; index < count; index += 1) {
                indices.push(native ? reader.uint16() : reader.uint32());
            }
        }
        splits.push({ materialIndex, indices });
    }
    if (faceType !== 0 && faceType !== 1) {
        throw new Error('Unsupported DFF bin mesh face type');
    }
    return splits;
}

function readSkinMatrix(reader: DffReader): number[] {
    const matrix = Array.from({ length: 16 }, () => reader.float32());

    // RenderWare stores padding values in the fourth slot of each basis row.
    // They are not part of the affine matrix and can contain marker bytes.
    matrix[3] = 0;
    matrix[7] = 0;
    matrix[11] = 0;
    matrix[15] = 1;

    return matrix;
}

function readSkin(reader: DffReader, chunk: Chunk, vertexCount: number): ModelGeometry['skin'] {
    if (chunk.length >= 4 && reader.view.getUint32(reader.offset, true) === CHUNK_STRUCT) {
        const structure = reader.chunk();
        const platform = reader.uint32();
        if (platform !== 2 && platform !== 4) {
            reader.finishChunk(structure);
            return undefined;
        }
            const boneCount = reader.uint8();
            const specialIndexCount = reader.uint8();
            reader.skip(2);
            reader.skip(specialIndexCount);
        const inverseMatrices: number[][] = [];
        for (let bone = 0; bone < boneCount; bone += 1) {
            inverseMatrices.push(readSkinMatrix(reader));
        }
        reader.finishChunk(structure);
        return {
            boneCount,
            boneIndices: Array.from({ length: vertexCount }, () => [0, 0, 0, 0]),
            inverseMatrices,
            weights: Array.from({ length: vertexCount }, () => [0, 0, 0, 0]),
        } as ModelGeometry['skin'];
    }

    const boneCount = reader.uint8();
    const specialIndexCount = reader.uint8();
    reader.skip(2);
    reader.skip(specialIndexCount);
    const boneIndices: [number, number, number, number][] = [];
    for (let vertex = 0; vertex < vertexCount; vertex += 1) {
        const packed = reader.uint32();
        const indices = [packed & 0xff, (packed >>> 8) & 0xff, (packed >>> 16) & 0xff, packed >>> 24];
        boneIndices.push(indices as [number, number, number, number]);
    }
    const weights: [number, number, number, number][] = Array.from({ length: vertexCount }, () => [
        reader.float32(),
        reader.float32(),
        reader.float32(),
        reader.float32(),
    ] as [number, number, number, number]);
    const inverseMatrices: number[][] = [];
    for (let bone = 0; bone < boneCount; bone += 1) {
        inverseMatrices.push(readSkinMatrix(reader));
    }
    if (specialIndexCount !== 0 && reader.offset + 12 <= chunk.end) {
        reader.skip(12);
    }
    return { boneCount, boneIndices, weights, inverseMatrices };
}

function readNativeValue(
    view: DataView,
    offset: number,
    dataType: number,
    normalized: number
): number {
    let value: number;
    switch (dataType) {
        case 0:
            value = view.getFloat32(offset, true);
            break;
        case 1:
            value = view.getInt8(offset);
            break;
        case 2:
            value = view.getUint8(offset);
            break;
        case 3:
            value = view.getInt16(offset, true);
            break;
        case 4:
            value = view.getUint16(offset, true);
            break;
        default:
            throw new Error(`Unsupported OpenGL native DFF attribute type ${dataType}`);
    }
    if (!normalized) {
        return value;
    }
    if (dataType === 1) {
        return value / 128;
    }
    if (dataType === 2) {
        return value / 255;
    }
    if (dataType === 3) {
        return value / 32768;
    }
    if (dataType === 4) {
        return value / 65536;
    }
    return value;
}

function readNativeOglData(reader: DffReader, chunk: Chunk, geometry: DffGeometry): void {
    const attributeCount = reader.uint32();
    const attributes: NativeAttribute[] = [];
    for (let index = 0; index < attributeCount; index += 1) {
        attributes.push({
            attribute: reader.uint32(),
            dataType: reader.uint32(),
            normalized: reader.uint32(),
            count: reader.uint32(),
            stride: reader.uint32(),
            offset: reader.uint32(),
        });
    }
    const dataStart = reader.offset;
    const readAttribute = (attribute: NativeAttribute, vertex: number): number[] => {
        const values: number[] = [];
        const bytesPerValue = attribute.dataType === 0 ? 4 : attribute.dataType < 3 ? 1 : 2;
        const start = dataStart + attribute.offset + vertex * attribute.stride;
        for (let component = 0; component < attribute.count; component += 1) {
            values.push(
                readNativeValue(
                    reader.view,
                    start + component * bytesPerValue,
                    attribute.dataType,
                    attribute.normalized
                )
            );
        }
        return values;
    };

    for (const attribute of attributes) {
        if (attribute.attribute === 0) {
            geometry.vertices = Array.from({ length: geometry.vertexCount }, (_, vertex) => {
                const values = readAttribute(attribute, vertex);
                return { x: values[0] ?? 0, y: values[1] ?? 0, z: values[2] ?? 0 };
            });
        } else if (attribute.attribute === 1) {
            geometry.texcoords = Array.from({ length: geometry.vertexCount }, (_, vertex) => {
                const values = readAttribute(attribute, vertex);
                return { uvx: (values[0] ?? 0) / 512, uvy: (values[1] ?? 0) / 512 };
            });
        } else if (attribute.attribute === 4 || attribute.attribute === 5) {
            geometry.skin ??= {
                boneCount: 0,
                boneIndices: Array.from({ length: geometry.vertexCount }, () => [0, 0, 0, 0]),
                inverseMatrices: [],
                weights: Array.from({ length: geometry.vertexCount }, () => [0, 0, 0, 0]),
            };
            for (let vertex = 0; vertex < geometry.vertexCount; vertex += 1) {
                const values = readAttribute(attribute, vertex);
                if (attribute.attribute === 4) {
                    geometry.skin.weights[vertex] = [
                        values[0] ?? 0,
                        values[1] ?? 0,
                        values[2] ?? 0,
                        values[3] ?? 0,
                    ];
                } else {
                    geometry.skin.boneIndices[vertex] = [
                        values[0] ?? 0,
                        values[1] ?? 0,
                        values[2] ?? 0,
                        values[3] ?? 0,
                    ];
                }
            }
        }
    }
    if (reader.offset < chunk.end) {
        reader.offset = chunk.end;
    }
}

function readGeometry(reader: DffReader): DffGeometry {
    const geometryChunk = reader.chunk();
    if (geometryChunk.type !== CHUNK_GEOMETRY) {
        throw new Error('DFF geometry list contains an invalid geometry');
    }
    const structure = reader.chunk();
    const flags = reader.uint16();
    let numUvs = reader.uint8();
    const native = reader.uint8() !== 0;
    const triangleCount = reader.uint32();
    const vertexCount = reader.uint32();
    reader.skip(4);
    if (flags & FLAGS_TEXTURED) {
        numUvs = 1;
    }
    if (structure.version < 0x34000) {
        reader.skip(12);
    }
    let texcoords: { uvx: number; uvy: number }[] = [];
    if (!native) {
        if (flags & FLAGS_PRELIT) {
            reader.skip(vertexCount * 4);
        }
        if (flags & FLAGS_TEXTURED) {
            texcoords = Array.from({ length: vertexCount }, () => ({ uvx: reader.float32(), uvy: reader.float32() }));
        }
        if (flags & FLAGS_TEXTURED2) {
            const firstLayer = flags & FLAGS_TEXTURED ? 1 : 0;
            for (let layer = 0; layer < numUvs; layer += 1) {
                if (layer === firstLayer) {
                    texcoords = Array.from({ length: vertexCount }, () => ({ uvx: reader.float32(), uvy: reader.float32() }));
                } else {
                    reader.skip(vertexCount * 8);
                }
            }
        }
        reader.skip(triangleCount * 8);
    }
    reader.skip(16);
    reader.skip(4);
    reader.skip(4);
    const vertices = native
        ? []
        : Array.from({ length: vertexCount }, () => ({ x: reader.float32(), y: reader.float32(), z: reader.float32() }));
    if (!native && flags & FLAGS_NORMALS) {
        reader.skip(vertexCount * 12);
    }
    reader.finishChunk(structure);
    const materials = readGeometryMaterials(reader);
    const extension = reader.chunk();
    const parsedGeometry: DffGeometry = {
        flags,
        vertexCount,
        vertices,
        texcoords,
        materials,
        faceType: flags & FLAGS_TRISTRIP ? 'Triangle_Strip' : 'Triangles',
        splits: [],
        skin: undefined,
    };
    while (reader.offset < extension.end) {
        const chunk = reader.chunk();
        if (chunk.type === CHUNK_BINMESH) {
            parsedGeometry.splits.push(...readBinMesh(reader, chunk, native));
        } else if (chunk.type === 0x510 && native) {
            readNativeOglData(reader, chunk, parsedGeometry);
        } else if (chunk.type === CHUNK_SKIN && !native) {
            parsedGeometry.skin = readSkin(reader, chunk, vertexCount);
        } else if (chunk.type === CHUNK_SKIN && native) {
            parsedGeometry.skin = readSkin(reader, chunk, vertexCount);
        }
        reader.finishChunk(chunk);
    }
    reader.finishChunk(extension);
    reader.finishChunk(geometryChunk);
    return parsedGeometry;
}

function toModelGeometry(geometry: DffGeometry): ModelGeometry {
    const textures: ModelTexture[] = geometry.splits.map((split) => {
        const material = geometry.materials[split.materialIndex];
        return {
            color: material?.color ?? [255, 255, 255, 255],
            indices: split.indices,
            name: material?.name ?? '',
        };
    });
    return {
        facetype: geometry.faceType,
        texcoords: geometry.texcoords,
        textures,
        vertices: geometry.vertices,
        ...(geometry.skin ? { skin: geometry.skin } : {}),
    };
}

export function parseDff(buffer: ArrayBuffer): ModelExport {
    const reader = new DffReader(buffer);
    const clump = reader.chunk();
    if (clump.type !== CHUNK_CLUMP) {
        throw new Error('DFF does not contain a clump');
    }
    const clumpStructure = reader.chunk();
    if (clumpStructure.type !== CHUNK_STRUCT) {
        throw new Error('DFF clump is missing its structure');
    }
    const atomicCount = reader.uint32();
    if (clumpStructure.length >= 12) {
        reader.skip(8);
    }
    reader.finishChunk(clumpStructure);
    const frames = readFrameList(reader);
    const geometryList = reader.chunk();
    if (geometryList.type !== CHUNK_GEOMETRYLIST) {
        throw new Error('DFF is missing its geometry list');
    }
    const geometryStructure = reader.chunk();
    const geometryCount = reader.uint32();
    reader.finishChunk(geometryStructure);
    const geometries: DffGeometry[] = [];
    for (let index = 0; index < geometryCount; index += 1) {
        geometries.push(readGeometry(reader));
    }
    reader.finishChunk(geometryList);
    const atomics: DffAtomic[] = [];
    for (let index = 0; index < atomicCount; index += 1) {
        const atomic = reader.chunk();
        if (atomic.type !== CHUNK_ATOMIC) {
            throw new Error('DFF clump contains an invalid atomic');
        }
        const structure = reader.chunk();
        atomics.push({ frameIndex: reader.int32(), geometryIndex: reader.int32() });
        reader.finishChunk(structure);
        reader.finishChunk(atomic);
    }

    const geometryByFrame = new Map<number, DffGeometry>();
    atomics.forEach((atomic) => {
        const geometry = geometries[atomic.geometryIndex];
        if (geometry) {
            geometryByFrame.set(atomic.frameIndex, geometry);
        }
    });
    const boneFrameById = new Map<number, number>();
    frames.forEach((frame, frameIndex) => {
        if (frame.hAnimBoneId !== null) {
            boneFrameById.set(frame.hAnimBoneId, frameIndex);
        }
    });
    const boneIdByNumber = new Map<number, number>();
    frames.forEach((frame) => {
        frame.hAnimBoneNumbers.forEach((boneNumber, index) => {
            const boneId = frame.hAnimBoneIds[index];
            if (boneId !== undefined) {
                boneIdByNumber.set(boneNumber, boneId);
            }
        });
    });

    return frames
        .map((frame, frameIndex) => {
            if (frame.name.toLowerCase().includes('_vlo')) {
                return null;
            }
            const sourceGeometry = geometryByFrame.get(frameIndex);
            const geometry = sourceGeometry ? toModelGeometry(sourceGeometry) : null;
            if (geometry?.skin) {
                geometry.skin.boneFrameIndices = Array.from(
                    { length: geometry.skin.boneCount },
                    (_, boneIndex) =>
                        boneFrameById.get(boneIdByNumber.get(boneIndex) ?? boneIndex) ?? -1
                );
            }
            return {
                damaged: frame.name.toLowerCase().includes('_dam'),
                frame: frameIndex,
                geometry,
                matrix: frame.matrix,
                name: frame.name,
                parent: frame.parent,
            };
        })
        .filter((frame): frame is NonNullable<typeof frame> => frame !== null);
}
