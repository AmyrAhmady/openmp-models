export type FrameRequest = (callback: () => void) => number;
export type FrameCancel = (frameId: number) => void;

export interface RenderSchedulerOptions {
    requestFrame?: FrameRequest;
    cancelFrame?: FrameCancel;
    isHidden?: () => boolean;
    spinning?: boolean;
}

export type RenderFrame = (spinning: boolean) => void;

export default class RenderScheduler {
    private readonly requestFrame: FrameRequest;
    private readonly cancelFrame: FrameCancel;
    private readonly isHidden: () => boolean;
    private readonly onFrame: RenderFrame;
    private frameId: number | null = null;
    private spinning: boolean;
    private disposed = false;

    constructor(onFrame: RenderFrame, options: RenderSchedulerOptions = {}) {
        this.onFrame = onFrame;
        this.requestFrame = options.requestFrame ?? ((callback) => requestAnimationFrame(callback));
        this.cancelFrame = options.cancelFrame ?? ((frameId) => cancelAnimationFrame(frameId));
        this.isHidden = options.isHidden ?? (() => document.hidden);
        this.spinning = options.spinning ?? false;
    }

    setSpinning(spinning: boolean, requestFrame = true): void {
        this.spinning = spinning;
        this.cancel();
        if (requestFrame) {
            this.request();
        }
    }

    request(): void {
        if (this.disposed || this.frameId !== null || this.isHidden()) {
            return;
        }

        this.frameId = this.requestFrame(this.handleFrame);
    }

    cancel(): void {
        if (this.frameId === null) {
            return;
        }

        this.cancelFrame(this.frameId);
        this.frameId = null;
    }

    dispose(): void {
        this.disposed = true;
        this.cancel();
    }

    private handleFrame = (): void => {
        this.frameId = null;
        if (this.disposed || this.isHidden()) {
            return;
        }

        this.onFrame(this.spinning);
        if (this.spinning) {
            this.request();
        }
    };
}
