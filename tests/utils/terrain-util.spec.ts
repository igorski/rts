import { describe, it, expect, vi } from "vitest";
import { ActorType, Building, Owner } from "@/definitions/actors";
import ActorFactory from "@/model/factories/actor-factory";
import { findNearestBuildingOfClass } from "@/utils/terrain-util";

describe( "Terrain utilities", () => {
    it( "should be able to find the nearest position near a Building-type Actor of a specific class", () => {
        const sourceX = 50;
        const sourceY = 50;

        const buildingClass = Building.REFINERY;
        const owner = Owner.PLAYER;

        const buildings = [
            // list of matching buildings at different distances
            ActorFactory.create({ x: 20, y: 20, height: 2, owner, type: ActorType.BUILDING, subClass: Building.REFINERY }),
            ActorFactory.create({ x: 55, y: 55, height: 2, owner, type: ActorType.BUILDING, subClass: Building.REFINERY }),
            ActorFactory.create({ x: 90, y: 99, height: 2, owner, type: ActorType.BUILDING, subClass: Building.REFINERY }),
            // similar buildings but of other class or ownership
            ActorFactory.create({ x: 20, y: 20, height: 2, owner, type: ActorType.BUILDING, subClass: Building.BARRACKS }),
            ActorFactory.create({ x: 40, y: 40, height: 2, owner: Owner.AI, type: ActorType.BUILDING, subClass: Building.REFINERY })
        ];

        const expectedMatch = buildings[ 1 ];
        expect( findNearestBuildingOfClass(
            buildings, sourceX, sourceY, Building.REFINERY, Owner.PLAYER
        )).toEqual({
            x: expectedMatch.x,
            y: expectedMatch.y + expectedMatch.height
        });
    });
});
