import type { ModelGeometry } from 'src/domain/modelAssets';

export interface GeometryGroup {
    start: number;
    count: number;
    materialIndex: number;
}

export interface IndexedGeometryData {
    positions: number[];
    uvs: number[];
    indices: number[];
    groups: GeometryGroup[];
    skinIndices: number[];
    skinWeights: number[];
}

function getIndexedVertex(
    geometry: ModelGeometry,
    vertexIndex: number | undefined,
    positions: number[],
    uvs: number[],
    skinIndices: number[],
    skinWeights: number[],
    vertexMap: Map<string, number>
): number | null {
    if (vertexIndex === undefined) {
        return null;
    }

    const vertex = geometry.vertices[vertexIndex];
    if (!vertex) {
        return null;
    }

    const texcoord = geometry.texcoords?.[vertexIndex];
    const uvx = texcoord?.uvx ?? 0;
    const uvy = texcoord ? 1 - (texcoord.uvy - 1) : 0;
    const key = `${vertexIndex}:${uvx}:${uvy}`;
    let indexedVertex = vertexMap.get(key);

    if (indexedVertex === undefined) {
        indexedVertex = positions.length / 3;
        vertexMap.set(key, indexedVertex);
        positions.push(vertex.x, vertex.y, vertex.z);
        uvs.push(uvx, uvy);
        const skin = geometry.skin;
        const indices = skin?.boneIndices[vertexIndex] ?? [0, 0, 0, 0];
        const weights = skin?.weights[vertexIndex] ?? [0, 0, 0, 0];
        skinIndices.push(...indices);
        skinWeights.push(...weights);
    }

    return indexedVertex;
}

function appendIndexedFace(
    geometry: ModelGeometry,
    firstVertexIndex: number | undefined,
    secondVertexIndex: number | undefined,
    thirdVertexIndex: number | undefined,
    positions: number[],
    uvs: number[],
    skinIndices: number[],
    skinWeights: number[],
    indices: number[],
    vertexMap: Map<string, number>
): void {
    const firstVertex = getIndexedVertex(geometry, firstVertexIndex, positions, uvs, skinIndices, skinWeights, vertexMap);
    const secondVertex = getIndexedVertex(geometry, secondVertexIndex, positions, uvs, skinIndices, skinWeights, vertexMap);
    const thirdVertex = getIndexedVertex(geometry, thirdVertexIndex, positions, uvs, skinIndices, skinWeights, vertexMap);
    if (firstVertex !== null && secondVertex !== null && thirdVertex !== null) {
        indices.push(firstVertex, secondVertex, thirdVertex);
    }
}

export function buildIndexedGeometry(geometry: ModelGeometry): IndexedGeometryData {
    const positions: number[] = [];
    const uvs: number[] = [];
    const skinIndices: number[] = [];
    const skinWeights: number[] = [];
    const indices: number[] = [];
    const groups: GeometryGroup[] = [];
    const vertexMap = new Map<string, number>();

    geometry.textures.forEach((texture, materialIndex) => {
        const groupStart = indices.length;

        if (geometry.facetype === 'Triangles') {
            for (let index = 0; index + 2 < texture.indices.length; index += 3) {
                appendIndexedFace(
                    geometry,
                    texture.indices[index],
                    texture.indices[index + 1],
                    texture.indices[index + 2],
                    positions,
                    uvs,
                    skinIndices,
                    skinWeights,
                    indices,
                    vertexMap
                );
            }
        } else {
            for (let index = 0; index + 2 < texture.indices.length; index += 1) {
                const secondVertexIndex =
                    index % 2 ? texture.indices[index + 2] : texture.indices[index + 1];
                const thirdVertexIndex =
                    index % 2 ? texture.indices[index + 1] : texture.indices[index + 2];
                appendIndexedFace(
                    geometry,
                    texture.indices[index],
                    secondVertexIndex,
                    thirdVertexIndex,
                    positions,
                    uvs,
                    skinIndices,
                    skinWeights,
                    indices,
                    vertexMap
                );
            }
        }

        const count = indices.length - groupStart;
        if (count > 0) {
            groups.push({ start: groupStart, count, materialIndex });
        }
    });

    return { positions, uvs, indices, groups, skinIndices, skinWeights };
}
