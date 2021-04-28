import { NextApiRequest, NextApiResponse } from "next";
import { ObjectInfo, SkinInfo, VehicleInfo } from "src/types";

import Objects from "../../resources/objects";
import Skins from "../../resources/skins";
import Vehicles from "../../resources/vehicles";

const sortedObjectList = [...Objects].sort(function (a, b) {
    var textA = a.name.toUpperCase();
    var textB = b.name.toUpperCase();
    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
});

const sortedSkinList = [...Skins].sort(function (a, b) {
    var textA = a.name.toUpperCase();
    var textB = b.name.toUpperCase();
    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
});

const sortedVehicleList = [...Vehicles].sort(function (a, b) {
    var textA = a.name.toUpperCase();
    var textB = b.name.toUpperCase();
    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
});

export default (req: NextApiRequest, res: NextApiResponse) => {

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");

    let results: ObjectInfo[] | SkinInfo[] | VehicleInfo[] = [];

    if (req.query.type) {
        const type = (req.query.type as string).toLowerCase();
        switch (type) {
            case "object": {
                results = req.query.q
                    ? sortedObjectList.filter((object) =>
                        object.name.toLowerCase().includes((req.query.q as string).toLowerCase())
                    )
                    : [];
                res.end(JSON.stringify({ results }));
                break;
            }
            case "vehicle": {
                console.log("step2", req.query);
                results = req.query.q
                    ? sortedVehicleList.filter((vehicle) =>
                        vehicle.name.toLowerCase().includes((req.query.q as string).toLowerCase())
                    )
                    : [];
                res.end(JSON.stringify({ results }));
                break;
            }
            case "skin": {
                results = req.query.q
                    ? sortedSkinList.filter((skin) =>
                        skin.name.toLowerCase().includes((req.query.q as string).toLowerCase())
                    )
                    : [];
                res.end(JSON.stringify({ results }));
                break;
            }
            default: {
                results = []
                res.end("hello");
                break;
            }
        }
    }
};
