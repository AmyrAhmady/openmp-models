import { NextApiRequest, NextApiResponse } from "next";

import Objects from "../../resources/objects";
import Skins from "../../resources/skins";
import Vehicles from "../../resources/vehicles";

interface Object {
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

interface Vehicle {
    id: number;
    name: string;
    cat: string;
    mods: string;
    model: string;
};

interface Skin {
    id: number;
    name: string;
    model: string;
    location: string;
    gender: string;
};

export default (req: NextApiRequest, res: NextApiResponse) => {

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");

    if (req.query.type) {
        const type = (req.query.type as string).toLowerCase();
        switch (type) {
            case "object": {
                res.end(JSON.stringify({ list: Objects }));
                break;
            }
            case "vehicle": {
                res.end(JSON.stringify({ list: Vehicles }));
                break;
            }
            case "skin": {
                res.end(JSON.stringify({ list: Skins }));
                break;
            }
            default:
                res.end(JSON.stringify({ list: [] }));
                break;
        }
    }
};
