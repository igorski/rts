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
import {
    TileTypes, TILE_SIZE, TILE_WIDTH_HALF, TILE_HEIGHT_HALF, horPosition, verPosition
} from "@/definitions/world-tiles";
import { coordinateToIndex } from "@/utils/terrain-util";
import CACHE from "./render-cache";

const { TILES } = CACHE.sprites;

/**
 * Renders given worlds tiled terrain into a pre-rendered HTMLCanvasElement
 */
export const renderWorldMap = ( world: EnvironmentDef ) => {
    const mapWidth  = Math.ceil( world.width * TILE_SIZE );
    const mapHeight = verPosition( world.width, world.height ) + TILE_HEIGHT_HALF;

    const cvs2D: HTMLCanvasElement = CACHE.map.flat;
    const ctx2D: CanvasRenderingContext2D = cvs2D.getContext( "2d" );

    cvs2D.width  = world.width;
    cvs2D.height = world.height;
    ctx2D.clearRect( 0, 0, cvs2D.width, cvs2D.height );

    const cvsIsometric: HTMLCanvasElement = CACHE.map.isometric;
    const ctxIsometric: CanvasRenderingContext2D = cvsIsometric.getContext( "2d" );

    cvsIsometric.width  = mapWidth;
    cvsIsometric.height = mapHeight;
    ctxIsometric.clearRect( 0, 0, cvsIsometric.width, cvsIsometric.height );

    const halfWidth  = Math.ceil( mapWidth / 2 );
    const halfHeight = Math.ceil( mapHeight / 2 );

    for ( let tx = 0; tx < world.width; ++tx ) {
        for ( let ty = 0; ty < world.height; ++ty ) {
            const { x, y, height, type } = world.terrain[ coordinateToIndex( tx, ty, world ) ];
            let spriteX = 0;
            let tileColor = "#009900";
            switch ( type ) {
                default:
                    break;
                case TileTypes.GROUND:
                case TileTypes.SAND:
                    spriteX = 256;
                    tileColor = "yellow";
                    break;
                case TileTypes.WATER:
                    spriteX = 384;
                    tileColor = "#0000FF";
                    break;
                case TileTypes.MOUNTAIN:
                    spriteX = 128;
                    tileColor = "#00FF99";
                    break;
            }

            for ( let i = 0; i < height; ++i ) {
                const destX = halfWidth + ( horPosition( x, y ) - TILE_WIDTH_HALF );
                const destY = TILE_HEIGHT_HALF + (( verPosition( x, y ) - TILE_HEIGHT_HALF ) - ( i * TILE_HEIGHT_HALF ));
                ctxIsometric.drawImage(
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
                // DEBUG
                ctxIsometric.font = "10px Arial";
                ctxIsometric.fillText(`${x}x${y}`, destX + TILE_WIDTH_HALF / 2, destY + TILE_HEIGHT_HALF / 2 );
            }
            ctx2D.fillStyle = tileColor;
            ctx2D.fillRect( x, y, 1, 1 );
        }
    }
}
