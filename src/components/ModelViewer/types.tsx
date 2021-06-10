
export interface Vector3D {
    x: number;
    y: number;
    z: number;
}

export interface TextureData {
    name: string;
    url: string;
}

export interface ModelData {
    type: string;
    name: string;
    obj: Object;
    textures: TextureData[];
    position?: Vector3D;
    rotation?: Vector3D;
    color?: {
        primary: number;
        secondary: number;
    };
    modifications?: number[];
    extra?: any;
}

export interface ModelListData {
    id: number;
    name: string;
}

export class SceneSettings {
    type: string = "object";
}
