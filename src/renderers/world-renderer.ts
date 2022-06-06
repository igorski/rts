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
import { sprite } from "zcanvas";
import { type TileDef, TileTypes, TILE_SIZE } from "@/definitions/world-tiles";
import CACHE from "./render-cache";

const { TILES } = CACHE;

export default class WorldRenderer extends sprite {
    private pos: { x: number, y: number } = { x: 0, y: 0};
    private terrain: TileDef[] = [];

    setTerrain( terrain: TileDef[] ) {
        this.terrain = terrain;
    }

    handleInteraction( x: number, y: number, event: Event ): boolean {
        this.pos.x = x;
        this.pos.y = y;

        return true;
    }

    draw( ctx: CanvasRenderingContext2D ) {
        ctx.beginPath();
        const MARGIN = 5;
        for ( let i = 0, l = this.terrain.length; i < l; ++i ) {
            const { x, y, height, type } = this.terrain[ i ];
            let spriteX = 0;
            switch ( type ) {
                case TileTypes.WATER:
                    spriteX = 384;
                    break;
                case TileTypes.GROUND:
                    spriteX = 128;
                    break;
            }
            let hover = false;
            if ( this.pos.x > ( x * TILE_SIZE ) && this.pos.x < (( x + 1 ) * TILE_SIZE ) &&
                 this.pos.y > ( y * TILE_SIZE ) && this.pos.y < (( y + 1 ) * TILE_SIZE )) {
                hover = true;
            }
            ctx.globalAlpha = hover ? 0.5 : 1;
            ctx.drawImage(
                TILES,
                spriteX, 0,
                128, 127,
                x * TILE_SIZE + x * MARGIN,
                y * TILE_SIZE + y * MARGIN,
                TILE_SIZE,
                TILE_SIZE
            );
        //    ctx.fillRect( x * TILE_SIZE + x * MARGIN, y * TILE_SIZE + y * MARGIN, TILE_SIZE, TILE_SIZE );
        }
    }
};
