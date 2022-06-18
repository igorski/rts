import { describe, it, expect } from "vitest";
import { ActorType, Unit } from "@/definitions/actors";
import type { EnvironmentDef } from "@/definitions/world-tiles";
import ActorFactory from "@/model/factories/actor-factory";
import EffectFactory from "@/model/factories/effect-factory";
import GameFactory from "@/model/factories/game-factory";
import WorldFactory from "@/model/factories/world-factory";

describe( "Game factory", () => {
    it( "should be able to serialize and deserialize a Game instance", () => {
        const game = GameFactory.create();
        WorldFactory.populate( game.world );

        game.gameTime = 500;
        game.effects = [
            EffectFactory.create({
                store: "storeName",
                action: "update",
                start: 100,
                duration: 1000,
                from: 0,
                to: 1
            })
        ];
        game.actors = [
            ActorFactory.create({ type: ActorType.UNIT, subClass: Unit.SCOUT })
        ];
        const serialized = GameFactory.serialize( game );
        expect( GameFactory.deserialize( serialized )).toEqual( game );
    });
});
