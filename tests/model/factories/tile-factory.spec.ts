import { describe, it, expect } from "vitest";
import { TileTypes } from "@/definitions/world-tiles";
import TileFactory from "@/model/factories/tile-factory";

describe( "Tile factory", () => {
    it( "should create a TileDef from the given arguments", () => {
        const tile = TileFactory.create( 10, 20, TileTypes.GRASS, 5 );

        expect( tile.x ).toEqual( 10 );
        expect( tile.y ).toEqual( 20 );
        expect( tile.type ).toEqual( TileTypes.GRASS );
        expect( tile.height ).toEqual( 5 );
    });

    it( "should be able to serialize and deserialize a Tile instance", () => {
        const tile = TileFactory.create( 10, 20, TileTypes.GRASS, 5 );
        const serialized = TileFactory.serialize( tile );
        expect( TileFactory.deserialize( serialized )).toEqual( tile );
    });
});
