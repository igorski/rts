/**
 * The MIT License (MIT)
 *
 * Igor Zinken 2022 - https://www.igorski.nl
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import type { TileTypes, TileDef } from "@/definitions/world-tiles";

export type SerializedTile = {
    x: number,
    y: number,
    h: number,
    t: TileTypes
};

const TileFactory = {
    create( x: number, y: number, type: TileTypes, height: number = 1 ): TileDef {
        return {
            x, y, height, type
        };
    },

    serialize( tile: TileDef ): SerializedTile {
        return {
            x: tile.x,
            y: tile.y,
            h: tile.height,
            t: tile.type
        };
    },

    deserialize( data: SerializedTile ): TileDef {
        return TileFactory.create( data.x, data.y, data.t, data.h );
    }
};
export default TileFactory;
