import * as THREE from 'three';
import type { ModelExport, ModelMatrix } from 'src/domain/modelAssets';
import Service from './Service';

const skinRestRotation = new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1);

function toModelMatrix(matrix: THREE.Matrix4): ModelMatrix {
    const elements = matrix.elements;
    return [0, 1, 2, 3].map((row) => [
        elements[row],
        elements[4 + row],
        elements[8 + row],
        elements[12 + row],
    ]) as ModelMatrix;
}

export function alignSkinRestPose(modelExport: ModelExport): ModelExport {
    const skin = modelExport.find((frame) => frame.geometry?.skin)?.geometry?.skin;
    const boneFrames = skin?.boneFrameIndices;
    if (!skin || !boneFrames || boneFrames.length !== skin.inverseMatrices.length) {
        return modelExport;
    }

    const indexByFrame = new Map(modelExport.map((frame, index) => [frame.frame, index]));
    const restWorlds = new Map<number, THREE.Matrix4>();
    const restWorld = (index: number): THREE.Matrix4 => {
        const cached = restWorlds.get(index);
        if (cached) {
            return cached;
        }

        const frame = modelExport[index];
        const parent = frame ? indexByFrame.get(frame.parent) : undefined;
        const world =
            !frame || parent === undefined
                ? new THREE.Matrix4()
                : restWorld(parent).clone().multiply(Service.computeMatrix(frame));
        restWorlds.set(index, world);
        return world;
    };

    const inverseBinds = skin.inverseMatrices.map((matrix) =>
        new THREE.Matrix4().fromArray(matrix)
    );
    const poses = inverseBinds.map((inverseBind, bone) =>
        restWorld(boneFrames[bone] ?? -1)
            .clone()
            .multiply(inverseBind)
    );
    const [firstPose] = poses;
    const restMatchesBind = poses.every((pose) =>
        pose.elements.every(
            (element, index) => Math.abs(element - (firstPose?.elements[index] ?? element)) < 1e-3
        )
    );
    if (restMatchesBind) {
        return modelExport;
    }

    const boneByFrame = new Map(boneFrames.map((frameIndex, bone) => [frameIndex, bone]));
    const alignedWorlds = new Map<number, THREE.Matrix4>();
    const alignedWorld = (index: number): THREE.Matrix4 => {
        const cached = alignedWorlds.get(index);
        if (cached) {
            return cached;
        }

        const frame = modelExport[index];
        const parent = frame ? indexByFrame.get(frame.parent) : undefined;
        const bone = boneByFrame.get(index);
        const inverseBind = bone === undefined ? undefined : inverseBinds[bone];
        let world: THREE.Matrix4;
        if (!frame || parent === undefined) {
            world = new THREE.Matrix4();
        } else if (inverseBind) {
            world = skinRestRotation.clone().multiply(inverseBind.clone().invert());
        } else {
            world = alignedWorld(parent).clone().multiply(Service.computeMatrix(frame));
        }
        alignedWorlds.set(index, world);
        return world;
    };

    return modelExport.map((frame, index) => {
        const parent = indexByFrame.get(frame.parent);
        if (parent === undefined || !boneByFrame.has(index)) {
            return frame;
        }

        const local = alignedWorld(parent).clone().invert().multiply(alignedWorld(index));
        return { ...frame, matrix: toModelMatrix(local) };
    });
}
