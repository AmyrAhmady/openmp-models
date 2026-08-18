const IFP_HEADER_SIZE = 36;
const IFP_ANIMATION_HEADER_SIZE = 36;
const IFP_OBJECT_HEADER_SIZE = 36;

export interface ParsedAnimation {
    name: string;
    objectCount: number;
    frameDataSize: number;
}

export interface ParsedAnimationLibrary {
    name: string;
    animations: ParsedAnimation[];
}

function readFixedString(bytes: Uint8Array, offset: number, length: number): string {
    let end = offset;
    const limit = offset + length;

    while (end < limit && bytes[end] !== 0) {
        end += 1;
    }

    let value = '';
    for (let index = offset; index < end; index += 1) {
        value += String.fromCharCode(bytes[index] ?? 0);
    }

    return value.trim();
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

        animations.push({ name, objectCount, frameDataSize });
        offset = nextOffset;
    }

    return {
        name: readFixedString(bytes, 8, 24),
        animations,
    };
}
