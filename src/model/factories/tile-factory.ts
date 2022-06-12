import type { TileTypes, TileDef } from "@/definitions/world-tiles";

export default {
    create( x: number, y: number, type: TileTypes, height: number = 1 ): TileDef {
        return {
            x, y, height, type
        };
    }
};
