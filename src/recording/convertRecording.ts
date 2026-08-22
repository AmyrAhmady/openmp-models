import type { FFmpeg } from '@ffmpeg/ffmpeg';

export type RecordingFormat = 'mp4' | 'gif';

let ffmpeg: FFmpeg | null = null;
let ffmpegLoad: Promise<FFmpeg> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
    if (ffmpeg) {
        return ffmpeg;
    }

    if (!ffmpegLoad) {
        ffmpegLoad = (async () => {
            const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
                import('@ffmpeg/ffmpeg'),
                import('@ffmpeg/util'),
            ]);
            const coreBaseUrl = 'https://unpkg.com/@ffmpeg/core@0.12.9/dist/umd';
            const instance = new FFmpeg();

            await instance.load({
                coreURL: await toBlobURL(`${coreBaseUrl}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${coreBaseUrl}/ffmpeg-core.wasm`, 'application/wasm'),
            });

            ffmpeg = instance;
            return instance;
        })().catch((error: unknown) => {
            ffmpegLoad = null;
            throw error;
        });
    }

    return ffmpegLoad;
}

export async function convertWebmToFormat(webm: Blob, format: RecordingFormat): Promise<Blob> {
    const encoder = await getFFmpeg();
    const inputName = 'recording.webm';
    const outputName = format === 'mp4' ? 'recording.mp4' : 'recording.gif';
    const { fetchFile } = await import('@ffmpeg/util');

    await encoder.writeFile(inputName, await fetchFile(webm));
    await encoder.exec(
        format === 'mp4'
            ? [
                  '-i',
                  inputName,
                  '-c:v',
                  'libx264',
                  '-pix_fmt',
                  'yuv420p',
                  '-movflags',
                  'faststart',
                  outputName,
              ]
            : [
                  '-i',
                  inputName,
                  '-vf',
                  'fps=15,scale=iw:-2:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=sierra2_4a',
                  '-loop',
                  '0',
                  outputName,
              ]
    );

    const output = await encoder.readFile(outputName);
    await Promise.allSettled([encoder.deleteFile(inputName), encoder.deleteFile(outputName)]);

    if (typeof output === 'string') {
        throw new Error(`FFmpeg returned invalid ${format.toUpperCase()} output.`);
    }

    const outputBuffer = new ArrayBuffer(output.byteLength);
    new Uint8Array(outputBuffer).set(output);

    return new Blob([outputBuffer], {
        type: format === 'mp4' ? 'video/mp4' : 'image/gif',
    });
}
