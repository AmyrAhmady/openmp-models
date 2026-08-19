const IFP_HEADER_SIZE = 36;
const IFP_ANIMATION_HEADER_SIZE = 36;
const IFP_OBJECT_HEADER_SIZE = 36;

export interface ParsedAnimation {
    name: string;
    objectCount: number;
    frameDataSize: number;
    tracks: AnimationTrack[];
}

export type AnimationQuaternion = [number, number, number, number];
export type AnimationTranslation = [number, number, number];

export interface AnimationKeyframe {
    time: number;
    rotation: AnimationQuaternion;
    translation?: AnimationTranslation;
}

export interface AnimationTrack {
    name: string;
    type: 3 | 4;
    boneId: number;
    frames: AnimationKeyframe[];
}

export interface ParsedAnimationLibrary {
    name: string;
    animations: ParsedAnimation[];
}

function readFixedString(
    bytes: Uint8Array,
    offset: number,
    length: number,
    trim = true
): string {
    let end = offset;
    const limit = offset + length;

    while (end < limit && bytes[end] !== 0) {
        end += 1;
    }

    let value = '';
    for (let index = offset; index < end; index += 1) {
        value += String.fromCharCode(bytes[index] ?? 0);
    }

    return trim ? value.trim() : value;
}

function ensureRange(offset: number, length: number, total: number): void {
    if (offset < 0 || length < 0 || offset + length > total) {
        throw new Error('The IFP file is truncated or malformed.');
    }
}

export function parseIfp(buffer: ArrayBuffer): ParsedAnimationLibrary {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);

    ensureRange(0, IFP_HEADER_SIZE, bytes.length);

    if (readFixedString(bytes, 0, 4) !== 'ANP3') {
        throw new Error('Unsupported IFP format. Expected an ANP3 library.');
    }

    const animationCount = view.getInt32(32, true);
    if (animationCount < 0) {
        throw new Error('The IFP file contains an invalid animation count.');
    }

    const animations: ParsedAnimation[] = [];
    let offset = IFP_HEADER_SIZE;

    for (let animationIndex = 0; animationIndex < animationCount; animationIndex += 1) {
        ensureRange(offset, IFP_ANIMATION_HEADER_SIZE, bytes.length);

        const name = readFixedString(bytes, offset, 24);
        const objectCount = view.getInt32(offset + 24, true);
        const frameDataSize = view.getInt32(offset + 28, true);

        if (objectCount < 0 || frameDataSize < 0) {
            throw new Error('The IFP file contains invalid animation metadata.');
        }

        const objectHeadersSize = objectCount * IFP_OBJECT_HEADER_SIZE;
        const nextOffset = offset + IFP_ANIMATION_HEADER_SIZE + objectHeadersSize + frameDataSize;
        ensureRange(
            offset,
            IFP_ANIMATION_HEADER_SIZE + objectHeadersSize + frameDataSize,
            bytes.length
        );

        const tracks: AnimationTrack[] = [];
        let frameOffset = offset + IFP_ANIMATION_HEADER_SIZE;
        let parsedFrameDataSize = 0;

        for (let objectIndex = 0; objectIndex < objectCount; objectIndex += 1) {
            ensureRange(frameOffset, IFP_OBJECT_HEADER_SIZE, bytes.length);

            const objectName = readFixedString(bytes, frameOffset, 24, false);
            const type = view.getInt32(frameOffset + 24, true);
            const frameCount = view.getInt32(frameOffset + 28, true);
            const boneId = view.getInt32(frameOffset + 32, true);
            const frameSize = type === 4 ? 16 : type === 3 ? 10 : 0;

            if ((type !== 3 && type !== 4) || frameCount < 0) {
                throw new Error('The IFP file contains an unsupported animation track.');
            }

            frameOffset += IFP_OBJECT_HEADER_SIZE;
            ensureRange(frameOffset, frameCount * frameSize, bytes.length);

            const frames: AnimationKeyframe[] = [];
            for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
                const rotation: AnimationQuaternion = [
                    view.getInt16(frameOffset, true) / 4096,
                    view.getInt16(frameOffset + 2, true) / 4096,
                    view.getInt16(frameOffset + 4, true) / 4096,
                    view.getInt16(frameOffset + 6, true) / 4096,
                ];
                const time = view.getInt16(frameOffset + 8, true) / 60;

                if (type === 4) {
                    frames.push({
                        rotation,
                        time,
                        translation: [
                            view.getInt16(frameOffset + 10, true) / 1024,
                            view.getInt16(frameOffset + 12, true) / 1024,
                            view.getInt16(frameOffset + 14, true) / 1024,
                        ],
                    });
                } else {
                    frames.push({ rotation, time });
                }

                frameOffset += frameSize;
            }

            parsedFrameDataSize += frameCount * frameSize;
            tracks.push({ boneId, frames, name: objectName, type });
        }

        if (parsedFrameDataSize !== frameDataSize || frameOffset !== nextOffset) {
            throw new Error('The IFP animation frame data is malformed.');
        }

        animations.push({ name, objectCount, frameDataSize, tracks });
        offset = nextOffset;
    }

    return {
        name: readFixedString(bytes, 8, 24),
        animations,
    };
}
