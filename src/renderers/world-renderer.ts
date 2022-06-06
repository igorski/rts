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
import type { Point, Rectangle } from "@/definitions/math";
import type { TileDef, EnvironmentDef } from "@/definitions/world-tiles";
import { TileTypes, TILE_SIZE } from "@/definitions/world-tiles";
import { coordinateToIndex } from "@/utils/terrain-util";
import CACHE from "./render-cache";

const { TILES } = CACHE;

// 2D coordinates mapped to isometric projection

const TILE_WIDTH_HALF  = TILE_SIZE / 2;
const TILE_HEIGHT_HALF = TILE_SIZE / 2;

const X_DISPLACEMENT_HOR = 1 * TILE_SIZE / 2;
const X_DISPLACEMENT_VER = 0.5 * TILE_SIZE / 2;
const Y_DISPLACEMENT_HOR = -1 * TILE_SIZE / 2;
const Y_DISPLACEMENT_VER = 0.5 * TILE_SIZE / 2;

export default class WorldRenderer extends sprite {
    private pos: Point = { x: 0, y: 0};
    private terrain: TileDef[] = [];
    private viewportX: number = 0;
    private viewportY: number = 0;
    private hoverPoint: Point = { x: Infinity, y: Infinity };

    // visible map indices
    private viewport: Rectangle = { left: 0, top: 0, right: 0, bottom: 0 };
    private worldDef: EnvironmentDef | undefined;

    setWorld( world: EnvironmentDef ): void {
        this.terrain = world.terrain;

        //const { x, y } = world;
        const x = 0; const y = 0;

        const maxX = Math.min( world.width,  x + Math.ceil( this.canvas.getWidth() / TILE_SIZE ));
        const maxY = Math.min( world.height, y + Math.ceil( this.canvas.getHeight() / TILE_SIZE ));

        this.viewport.left   = x;
        this.viewport.top    = y;
        this.viewport.right  = maxX;
        this.viewport.bottom = maxY;

        // only used for coordinate lookup
        this.worldDef = { width: world.width } as EnvironmentDef;

        console.warn(this.viewport,world);
    }

    handleInteraction( x: number, y: number, event: Event ): boolean {
        this.pos.x = x;
        this.pos.y = y;

        // convert screen coordinates to
/*
        // Basic isometric map to screen is:

        Given screen pixel coordinates 64,96, we expect to project back to tile (2,1)


        map.x = (screen.x / TILE_WIDTH_HALF + screen.y / TILE_HEIGHT_HALF) /2;
        map.x = (64 / 64 + 96 / 32) /2;
        map.x = (1 + 3) /2;
        map.x = 2;

        map.y = (screen.y / TILE_HEIGHT_HALF -(screen.x / TILE_WIDTH_HALF)) /2;
        map.y = (96 / 32 - (64 / 64)) /2;
        map.y = (3 - 1) /2;
        map.y = 1;
*/

        x -= ( this.viewportX - TILE_SIZE );
        y -= ( this.viewportY - TILE_SIZE );

        this.hoverPoint.x = Math.floor(( x / TILE_WIDTH_HALF + y / TILE_HEIGHT_HALF ) / 2 );
        this.hoverPoint.y = Math.floor(( y / TILE_HEIGHT_HALF - ( x / TILE_WIDTH_HALF )) / 2 );

        return true;
    }

    draw( ctx: CanvasRenderingContext2D ) {
        ctx.beginPath();
        const MARGIN = 5;
        // TODO : cache
        this.viewportX = this.canvas.getWidth() / 2;
        this.viewportY = this.canvas.getHeight() / 2;

        for ( let tx = this.viewport.left; tx < this.viewport.right; ++tx ) {
            for ( let ty = this.viewport.top; ty < this.viewport.bottom; ++ty ) {
                const { x, y, height, type } = this.terrain[ coordinateToIndex( tx, ty, this.worldDef as EnvironmentDef ) ];
                let spriteX = 0;
                switch ( type ) {
                    default:
                        break;
                    case TileTypes.SAND:
                        spriteX = 256;
                        break;
                    case TileTypes.WATER:
                        spriteX = 384;
                        break;
                    case TileTypes.GROUND:
                        spriteX = 128;
                        break;
                }
                const hover = this.hoverPoint.x === x && this.hoverPoint.y === y;
                ctx.globalAlpha = hover ? 0.5 : 1;

                ctx.drawImage(
                    TILES,
                    spriteX, 0,
                    128, 127,
                    ( this.viewportX + horPosition( x, y )) - TILE_WIDTH_HALF,
                    ( this.viewportY + verPosition( x, y )) - TILE_HEIGHT_HALF,
                    TILE_SIZE,
                    TILE_SIZE
                );

                // DEBUG purposes: top-down view as rectangles
                // ctx.fillStyle = "magenta";
                // const MARGIN = 5;
                // ctx.fillRect( x * TILE_SIZE + x * MARGIN, y * TILE_SIZE + y * MARGIN, TILE_SIZE, TILE_SIZE );
            }
        }
    }
};

/* internal methods */

const horPosition = ( x: number, y: number ): number => ( x * X_DISPLACEMENT_HOR + y * Y_DISPLACEMENT_HOR );
const verPosition = ( x: number, y: number ): number => ( x * X_DISPLACEMENT_VER + y * Y_DISPLACEMENT_VER );
