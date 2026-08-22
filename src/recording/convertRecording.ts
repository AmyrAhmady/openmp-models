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

    const mp4Commands = [
        [
            '-i',
            inputName,
            '-vf',
            'scale=trunc(iw/2)*2:trunc(ih/2)*2',
            '-c:v',
            'libx264',
            '-profile:v',
            'main',
            '-pix_fmt',
            'yuv420p',
            '-movflags',
            'faststart',
            outputName,
        ],
    ];
    const commands =
        format === 'mp4'
            ? mp4Commands
            : [
                  [
                      '-i',
                      inputName,
                      '-vf',
                      'fps=15,scale=iw:-2:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=sierra2_4a',
                      '-loop',
                      '0',
                      outputName,
                  ],
              ];

    let exitCode = 1;
    try {
        for (const command of commands) {
            await Promise.allSettled([encoder.deleteFile(outputName)]);
            exitCode = await encoder.exec(command);
            if (exitCode === 0) {
                break;
            }
        }

        if (exitCode !== 0) {
            throw new Error(`FFmpeg could not create the ${format.toUpperCase()} file.`);
        }

        const output = await encoder.readFile(outputName);
        if (typeof output === 'string' || output.byteLength === 0) {
            throw new Error(`FFmpeg returned an empty ${format.toUpperCase()} file.`);
        }

        const outputBuffer = new ArrayBuffer(output.byteLength);
        new Uint8Array(outputBuffer).set(output);

        return new Blob([outputBuffer], {
            type: format === 'mp4' ? 'video/mp4' : 'image/gif',
        });
    } finally {
        await Promise.allSettled([encoder.deleteFile(inputName), encoder.deleteFile(outputName)]);
    }
}
