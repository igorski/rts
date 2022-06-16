import { describe, it, expect } from "vitest";
import PlayerFactory from "@/model/factories/player-factory";

describe( "Player factory", () => {
    it( "should create a Player from the given arguments", () => {
        const player = PlayerFactory.create( "Bob" );

        expect( player.name ).toEqual( "Bob" );
    });

    it( "should be able to serialize and deserialize a Player instance", () => {
        const player = PlayerFactory.create( "Jane Doe" );
        const serialized = PlayerFactory.serialize( player );
        expect( PlayerFactory.deserialize( serialized )).toEqual( player );
    });
});
