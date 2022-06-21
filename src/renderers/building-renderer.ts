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
import type { Actor } from "@/definitions/actors;"
import type { Rectangle } from "@/definitions/math";
import { TILE_SIZE, TILE_WIDTH_HALF, horPosition, verPosition } from "@/definitions/world-tiles";
import CACHE from "./render-cache";

const { TILES } = CACHE.sprites;

export const renderBuilding = ( ctx: CanvasRenderingContext2D, halfWidth: number, viewport: Rectangle, building: Actor ): void =>
{
    const { left, top }  = viewport;
    const { completion } = building;

    // tile height is animated duration building phase

    const TILE_HEIGHT       = TILE_SIZE * completion;
    const TILE_HEIGHT_HALF  = TILE_HEIGHT * 0.5;
    const SIZE_MINUS_HEIGHT = TILE_SIZE - TILE_HEIGHT;

    for ( let x = building.x, xl = x + building.width; x < xl; ++x ) {
        for ( let y = building.y, yl = y + building.height; y < yl; ++y ) {
            const destX = ( halfWidth + ( horPosition( x - 1, y - 1 ) - TILE_WIDTH_HALF )) - left;
            const destY = ( TILE_HEIGHT_HALF + ( verPosition( x - 1, y - 1) - TILE_HEIGHT_HALF )) - top;
            // TODO get building height
            for ( let h = 0; h < 2; ++h ) {
                ctx.drawImage(
                    TILES, 384, 0, TILE_SIZE, TILE_SIZE,
                    destX, ( destY - ( h * TILE_HEIGHT_HALF )) + SIZE_MINUS_HEIGHT,
                    TILE_SIZE, TILE_HEIGHT
                );
            }
        }
    }
};
