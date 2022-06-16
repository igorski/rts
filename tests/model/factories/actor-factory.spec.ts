import { describe, it, expect } from "vitest";
import { ActorType, Building } from "@/definitions/actors";
import ActorFactory from "@/model/factories/actor-factory";

describe( "Actor factory", () => {
    it( "should create an Actor from the given arguments", () => {
        const actor = ActorFactory.create({
            type: ActorType.BUILDING,
            subClass: Building.TURRET,
            x: 100, y: 120,
            width: 5, height: 4,
            maxEnergy: 10, energy: 5,
            attack: 2, defense: 4
        });
        expect( actor.type ).toEqual( ActorType.BUILDING );
        expect( actor.subClass ).toEqual( Building.TURRET );
        expect( actor.x ).toEqual( 100 );
        expect( actor.y ).toEqual( 120 );
        expect( actor.width ).toEqual( 5 );
        expect( actor.height ).toEqual( 4 );
        expect( actor.maxEnergy ).toEqual( 10 );
        expect( actor.energy ).toEqual( 5 );
        expect( actor.attack ).toEqual( 2 );
        expect( actor.defense ).toEqual( 4 );
    });

    it( "should be able to serialize and deserialize an Actor instance", () => {
        const actor = ActorFactory.create({
            type: ActorType.BUILDING,
            subClass: Building.REFINERY,
            x: 50, y: 60,
            width: 3, height: 2,
            maxEnergy: 5, energy: 2,
            attack: 1, defense: 2
        });
        const serialized = ActorFactory.serialize( actor );
        expect( ActorFactory.deserialize( serialized )).toEqual( actor );
    });
});
