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
import {
    TileTypes, TILE_SIZE, TILE_WIDTH_HALF, TILE_HEIGHT_HALF,
    horPosition, verPosition, amountOfTilesInWidth, amountOfTilesInHeight
} from "@/definitions/world-tiles";
import { coordinateToIndex } from "@/utils/terrain-util";
import CACHE from "./render-cache";

const { TILES } = CACHE.sprites;
const renderedMap = CACHE.map.isometric;

export default class WorldRenderer extends sprite {
    private world: EnvironmentDef;
    private terrain: TileDef[] = [];
    private mapCenterX: number = 0;
    private mapCenterY: number = 0;
    private hoverPoint: Point = { x: Infinity, y: Infinity };
    private horizontalTileAmount: number = 0;
    private verticalTileAmount: number = 0;

    // visible map area
    private viewport: Rectangle = { left: 0, top: 0, width: 0, height: 0 };

    setWorld( world: EnvironmentDef ): void {
        this.world   = world;
        this.terrain = world.terrain;
    }

    setTileDimensions( width: number, height: number ): void {
        this.horizontalTileAmount = amountOfTilesInWidth( width )
        this.verticalTileAmount   = amountOfTilesInHeight( height );

        console.warn(
            "tile amount hor and ver:"+this.horizontalTileAmount + " " + this.verticalTileAmount,
            " world pos " + this.world.x + " x " + this.world.y,
            " coord for world pos would be " + horPosition( this.world.x, this.world.y ) + " x " + verPosition( this.world.x, this.world.y)
        );

        // ensure the hit area matches the bounding box, make up for canvas scale factor
        const { x, y } = this.canvas._scale;

        this.setWidth( width * x );
        this.setHeight( height * y );
    }

    handleInteraction( x: number, y: number, event: Event ): boolean {
        // convert screen coordinates (relative to isometric space) to 2D map coordinates

        this.hoverPoint.x = Math.floor(( x / TILE_WIDTH_HALF + y / TILE_HEIGHT_HALF ) / 2 );
        this.hoverPoint.y = Math.floor(( y / TILE_HEIGHT_HALF - ( x / TILE_WIDTH_HALF )) / 2 );

        if ( process.env.NODE_ENV !== "production" ) {
            if ( event.type === "mousedown" ) {
                const PointToCoord = ( x: number, y: number ): Point => {
                    const tileHeight = TILE_SIZE;
                    // int x = mX - camera.x;
                    // int y = mY - camera.y;
                    return {
                        x: Math.round((y + x / 2) / tileHeight ),
                        y: Math.round((y - x / 2) / tileHeight )
                    };
                };
                console.log("mouse clicked on tile " + JSON.stringify(PointToCoord( x, y )));

                const tiles = [];
                for ( let tx = this.viewport.left; tx < this.viewport.right; ++tx ) {
                    for ( let ty = this.viewport.top; ty < this.viewport.bottom; ++ty ) {
                        tiles.push( this.terrain[ coordinateToIndex( tx, ty, this.world as EnvironmentDef ) ]);
                    }
                }
                console.log( "tiles in screen:" + JSON.stringify( tiles ));
            }
        }
        return true;
    }

    draw( ctx: CanvasRenderingContext2D ): void {
        ctx.beginPath();

        // TODO : cache
        this.mapCenterX = this.canvas.getWidth() / 2;
        this.mapCenterY = this.canvas.getHeight() / 2;

        // TODO : player position from cache ?
        const x = this.world.x;
        const y = this.world.y;

        this.viewport.left   = Math.round((( renderedMap.width / 2 ) + horPosition( x, y )) - this.canvas.getWidth() / 2 );
        this.viewport.top    = Math.round( verPosition( x, y ) - this.canvas.getHeight() / 2 );
        this.viewport.width  = this.canvas.getWidth();
        this.viewport.height = this.canvas.getHeight();

        ctx.drawImage(
            renderedMap,
            this.viewport.left, this.viewport.top,
            this.viewport.width, this.viewport.height,
            0, 0,
            this.viewport.width, this.viewport.height,
        );

        if ( true )return

        // TODO : can we roll this into a single loop ?

        for ( let tx = this.viewport.left; tx < this.viewport.right; ++tx ) {
           for ( let ty = this.viewport.top; ty < this.viewport.bottom; ++ty ) {
                const { x, y, height, type } = this.world.terrain[ coordinateToIndex( tx, ty, this.world ) ];
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
                    case TileTypes.MOUNTAIN:
                        spriteX = 128;
                        break;
                }
                const hover = this.hoverPoint.x === x && this.hoverPoint.y === y;
                ctx.globalCompositeOperation = hover ? "destination-our" : "source-over";

                ctx.save();
                ctx.translate( this.mapCenterX, this.mapCenterY );

                for ( let i = 0; i < height; ++i ) {
                    ctx.drawImage(
                        TILES,
                        spriteX,
                        i === 0 ? 0 : TILE_SIZE,
                        TILE_SIZE,
                        TILE_SIZE,
                        horPosition( x, y ) - TILE_WIDTH_HALF,
                        ( verPosition( x, y ) - TILE_HEIGHT_HALF ) - ( i * TILE_HEIGHT_HALF ),
                        TILE_SIZE,
                        TILE_SIZE
                    );
                }
                ctx.restore();
            }
        }
    }
};
