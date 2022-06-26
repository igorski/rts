import type { BuildingMapping } from "@/definitions/actors";
import { ActorType, Unit, Building } from "@/definitions/actors";
import ActorFactory from "@/model/factories/actor-factory";
import type { Actor } from "@/model/factories/actor-factory";

export const randomBuildingMapping = (): BuildingMapping => ({
    subClass: Building.REFINERY,
    cost: 500,
    name: "RandomRefinery",
    width: 3,
    height: 2,
    z: 3,
    constructable: true,
});

export const randomUnit = (): Actor => {
    return ActorFactory.create({ type: ActorType.UNIT, subClass: Unit.HARVESTER });
};

export const randomBuilding = (): Actor => {
    return ActorFactory.create({ type: ActorType.BUILDING, subClass: Building.REFINERY });
};
