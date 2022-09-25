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
import { zThreader, zThread } from "zthreader";
import { ActorType } from "@/definitions/actors";
import type { Rectangle, Size } from "@/definitions/math";
import type { EnvironmentDef, TileDef } from "@/definitions/world-tiles";
import {
    TileTypes, TILE_SIZE, TILE_WIDTH_HALF, TILE_HEIGHT_HALF, horPosition, verPosition
} from "@/definitions/world-tiles";
import type { Actor } from "@/model/factories/actor-factory";
import { coordinateToIndex } from "@/utils/terrain-util";
import { renderBuilding } from "./building-renderer";
import CACHE, { PRECACHE_ISOMETRIC_MAP } from "./render-cache";

const { TILES } = CACHE.sprites;
const TOP_LEFT: Rectangle = { left: 0, top: 0, width: 0, height: 0 };

const cvsIsometric: HTMLCanvasElement = document.createElement( "canvas" );
const ctxIsometric: CanvasRenderingContext2D = cvsIsometric.getContext( "2d" ) as CanvasRenderingContext2D;

const cvs2D: HTMLCanvasElement = CACHE.map.flat;
const ctx2D: CanvasRenderingContext2D = cvs2D.getContext( "2d" ) as CanvasRenderingContext2D;

export const CVS_2D_MAGNIFIER = 2;
const DEBUG = false;//process.env.NODE_ENV !== "production";

/**
 * Calculate the width and height of given worlds map in pixels
 */
export const getMapSize = ( world: EnvironmentDef ): Size => ({
    width  : Math.ceil( world.width * TILE_SIZE ),
    height : verPosition( world.width, world.height ) + TILE_HEIGHT_HALF
});

/**
 * Renders given worlds tiled terrain into a pre-rendered HTMLCanvasElement
 */
export const renderWorldMap = ( world: EnvironmentDef, actors: Actor[] = [] ): Promise<void> => {

    // use zThreader and zThreads as this can be quite a heavy operation
    // investigate how we can have a canvas and images available in a Worker

    zThreader.init( 0.5, 60 );

    return new Promise( resolve => {
        if ( process.env.NODE_ENV !== "production" && !PRECACHE_ISOMETRIC_MAP ) {
            console.info( "Caching of full size Map disabled." );
        }
        const { width: mapWidth, height: mapHeight } = getMapSize( world );

        cvs2D.width  = world.width  * CVS_2D_MAGNIFIER;
        cvs2D.height = world.height * CVS_2D_MAGNIFIER;
        ctx2D.clearRect( 0, 0, cvs2D.width, cvs2D.height );

        cvsIsometric.width  = mapWidth;
        cvsIsometric.height = mapHeight;
        ctxIsometric.clearRect( 0, 0, cvsIsometric.width, cvsIsometric.height );

        const MAX_ITERATIONS = world.width - 1; // all columns
        let iterations = 0;

        function renderColumn( iteration: number ): void {
            // columns
            for ( let tx = iteration, xx = iteration + 1; tx < xx; ++tx ) {
                // rows
                for ( let ty = 0; ty < world.height; ++ty ) {
                    const tile = world.terrain[ coordinateToIndex( tx, ty, world ) ];
                    renderTileIntoMap( world, tile );
                    if ( PRECACHE_ISOMETRIC_MAP ) {
                        renderTileIsometric( world, tile, ctxIsometric, TOP_LEFT );
                    }
                }
            }
        }

        new zThread(({
            completeFn: () => {

                // render building actors into 2D map

                const viewport = { left: 0, top: 0 } as Rectangle;
                const halfWidth = Math.ceil( mapWidth * 0.5 );

                actors.forEach( actor => {
                    if ( actor.type !== ActorType.BUILDING ) {
                        return;
                    }
                   renderBuilding( ctxIsometric, halfWidth, viewport, actor );

                    ctx2D.fillStyle = "darkgray";
                    for ( let x = actor.x, xl = x + actor.width; x < xl; ++x ) {
                        for ( let y = actor.y, yl = y + actor.height; y < yl; ++y ) {
                           ctx2D.fillRect( x * CVS_2D_MAGNIFIER, y * CVS_2D_MAGNIFIER, CVS_2D_MAGNIFIER, CVS_2D_MAGNIFIER );
                        }
                    }
                });

                // the isometric map will be converted to a PNG image, preferably it would remain
                // HTMLCanvasElement, but Safari has performance issues rendering large HTMLCanvasElements
                // using the .drawImage() API

                if ( PRECACHE_ISOMETRIC_MAP ) {
                    CACHE.map.isometric.width  = mapWidth;
                    CACHE.map.isometric.height = mapHeight;
                    CACHE.map.isometric.src    = cvsIsometric.toDataURL( "image/png" );
                }

                // free memory
                cvsIsometric.width  = 1;
                cvsIsometric.height = 1;

                resolve();
            },
            executionFn: () => {
                // the amount of times we call the "render"-function
                // per iteration of the internal execution method
                const stepsPerIteration = 1;

                for ( let i = 0; i < stepsPerIteration; ++i ) {
                    if ( iterations >= MAX_ITERATIONS ) {
                        return true;
                    } else {
                        // execute operation (and increment iteration)
                        renderColumn( ++iterations );
                    }
                }
                return false;
            }
        })).run(); // start crunching
    });
};

export const renderTileIntoMap = ( world: EnvironmentDef, tile: TileDef ): void => {
    const { x, y, type } = tile;

    // determine tile type

    let tileColor = "#009900";
    switch ( type ) {
        default:
            break;
        case TileTypes.GROUND:
        case TileTypes.SAND:
            tileColor = "yellow";
            break;
        case TileTypes.WATER:
            tileColor = "#0000FF";
            break;
        case TileTypes.ROCK:
            tileColor = "#666";
            break;
        case TileTypes.MOUNTAIN:
            tileColor = "#999900";
            break;
    }

    ctx2D.fillStyle = tileColor;
    ctx2D.fillRect( x * CVS_2D_MAGNIFIER, y * CVS_2D_MAGNIFIER, CVS_2D_MAGNIFIER, CVS_2D_MAGNIFIER );
};

export const renderTileIsometric = ( world: EnvironmentDef, tile: TileDef, ctx: CanvasRenderingContext2D, viewport: Rectangle ): void => {
    const halfWidth = Math.ceil(( world.width * TILE_SIZE ) * 0.5 );
    const { x, y, height, type } = tile;

    // determine tile type

    let spriteX = 0;
    switch ( type ) {
        default:
            break;
        case TileTypes.GROUND:
        case TileTypes.SAND:
            spriteX = 256;
            break;
        case TileTypes.WATER:
            spriteX = 384;
            break;
        case TileTypes.ROCK:
            spriteX = 128;
            break;
        case TileTypes.MOUNTAIN:
            spriteX = 128;
            break;
    }

    const { left, top } = viewport;

    for ( let i = 0; i < height; ++i ) {
        const destX = ( halfWidth + ( horPosition( x, y ) - TILE_WIDTH_HALF )) - left;
        const destY = ( TILE_HEIGHT_HALF + (( verPosition( x, y ) - TILE_HEIGHT_HALF ) - ( i * TILE_HEIGHT_HALF ))) - top;
        ctx.drawImage(
            TILES,
            spriteX,
            i === 0 ? 0 : TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE,
            destX,
            destY,
            TILE_SIZE,
            TILE_SIZE
        );

        // DEBUG - add coordinate text for 2D tile index and absolute pixel offset

        if ( DEBUG ) {
            ctx.font = "10px Arial";
            ctx.fillText(`${x}:${y}`, destX + TILE_WIDTH_HALF / 2, destY + TILE_HEIGHT_HALF / 2 );
            ctx.fillText(`  ${destX}x${destY}`, destX + TILE_WIDTH_HALF / 2, destY + TILE_HEIGHT_HALF / 1.5 );
        }
    }
};
