import { describe, it, expect } from "vitest";
import type { EnvironmentDef } from "@/definitions/world-tiles";
import WorldFactory from "@/model/factories/world-factory";

describe( "World factory", () => {
    it( "should be able to serialize and deserialize an EnvironmentDef instance", () => {
        const world = WorldFactory.create();
        WorldFactory.populate( world );
        const serialized = WorldFactory.serialize( world );
        expect( WorldFactory.deserialize( serialized )).toEqual( world );
    });
});
