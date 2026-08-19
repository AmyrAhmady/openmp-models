import type { ModelPreviewData } from 'src/domain/modelPreview';
import type { ParsedAnimation } from 'src/animation/ifpParser';

export interface Vector3D {
    x: number;
    y: number;
    z: number;
}

export type ModelData = ModelPreviewData;

export interface SceneController {
    mount(rootElement: HTMLDivElement | null): Promise<void>;
    setModel(models: ModelData[], autoSpin?: boolean): Promise<void>;
    setBackground(color: string): void;
    setAnimation(animation: ParsedAnimation | null): void;
    setSpin(autoSpin: boolean): void;
    setWheelSpin(spinning: boolean): void;
    render(): void;
    dispose(): void;
}
