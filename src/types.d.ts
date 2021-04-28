export interface ObjectInfo {
    id: number;
    name: string;
    col: boolean;
    breakable: boolean;
    visibility: string;
    anime: boolean;
    radius: number;
    borderbox: number[];
    txd: string;
};

export interface VehicleInfo {
    id: number;
    name: string;
    cat: string;
    mods: string;
    model: string;
};

export interface SkinInfo {
    id: number;
    name: string;
    model: string;
    location: string;
    gender: string;
};
