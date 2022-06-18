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
import { CameraActions } from "@/definitions/camera-actions";
import type { Actor } from "@/definitions/actors";
import type { Point, Rectangle, Box } from "@/definitions/math";
import type { TileDef, EnvironmentDef } from "@/definitions/world-tiles";
import {
    TileTypes, TILE_SIZE, TILE_WIDTH_HALF, TILE_HEIGHT_HALF,
    horPosition, verPosition, amountOfTilesInWidth, amountOfTilesInHeight
} from "@/definitions/world-tiles";
import { coordinateToIndex } from "@/utils/terrain-util";
import DirectionBox from "@/model/math/direction-box";
import CACHE from "./render-cache";

const { CURSORS, TILES } = CACHE.sprites;
const renderedMap = CACHE.map.isometric;

const POINTER_HIT_AREA = 50;

export default class GameRenderer extends sprite {
    // @ts-expect-error no initializer
    private world: EnvironmentDef;
    private actors: Actor[] = [];
    private terrain: TileDef[] = [];
    private mapCenterX: number = 0;
    private mapCenterY: number = 0;
    private hoverTile: Point = { x: Infinity, y: Infinity };
    private edges: Box = { left: 0, right: 0, top: 0, bottom: 0 };
    private pointerActions: DirectionBox = new DirectionBox();
    private horizontalTileAmount: number = 0;
    private verticalTileAmount: number = 0;
    private actualTileHeight: number = TILE_SIZE;
    private scale: number = 1;
    private interactionCallback: Function;

    // visible map area
    private viewport: Rectangle = { left: 0, top: 0, width: 0, height: 0 };

    constructor( interactionCallback: Function ) {
        super();
        this.interactionCallback = interactionCallback;
    }

    setWorld( world: EnvironmentDef, actors: Actor[] ): void {
        this.world   = world;
        this.terrain = world.terrain;
        this.actors  = actors;
    }

    setWorldSize( width: number, height: number ): void {
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

        this.viewport.width  = this.canvas.getWidth();
        this.viewport.height = this.canvas.getHeight();
        this.mapCenterX      = this.viewport.width  / 2;
        this.mapCenterY      = this.viewport.height / 2;

        this.actualTileHeight = this.viewport.height / this.verticalTileAmount;
        this.scale = this.actualTileHeight / TILE_SIZE;

        this.edges = {
            left: POINTER_HIT_AREA,
            right: this.viewport.width - POINTER_HIT_AREA,
            top: POINTER_HIT_AREA,
            bottom: this.viewport.height - POINTER_HIT_AREA
        };
    }

    handleInteraction( x: number, y: number, event: Event ): boolean {
        switch ( event.type ) {
            default:
                break;

            case "mousemove":
                if ( x <= this.edges.left ) {
                    this.pointerActions.setHorizontal( true );
                } else if ( x >= this.edges.right ) {
                    this.pointerActions.setHorizontal( false );
                } else {
                    this.pointerActions.resetHorizontal();
                }

                if ( y <= this.edges.top ) {
                    this.pointerActions.setVertical( true );
                } else if ( y >= this.edges.bottom ) {
                    this.pointerActions.setVertical( false );
                } else {
                    this.pointerActions.resetVertical();
                }
                break;

            case "mousedown":
            case "touchdown":
                // mouse coordinates relative to absolute map position in isometric view
                const absoluteX = ( x + this.viewport.left );
                const absoluteY = ( y + this.viewport.top ) - TILE_HEIGHT_HALF / 2;

                this.hoverTile = this.absoluteToTile( absoluteX, absoluteY );

                const actor = this.actors.find(({ x, y }) => x === this.hoverTile.x && y === this.hoverTile.y );
                if ( actor ) {
                    this.interactionCallback({ type: "actor", data: actor });
                } else {
                    this.interactionCallback({ type: "click", data: this.hoverTile });
                }
                // debug info, what is the range of visible tiles we can see ?
                console.log(
                    "top left:"+ JSON.stringify( this.absoluteToTile( this.viewport.left, this.viewport.top )),
                    "bottom right:"+ JSON.stringify( this.absoluteToTile(
                        this.viewport.left + this.viewport.width, this.viewport.top + this.viewport.height
                    )),
                );
                console.log("mouse coord at " + absoluteX + " x " + absoluteY + ", clicked on tile " + JSON.stringify( this.hoverTile ) + " of type " + this.world.terrain.find( tile => tile.x === this.hoverTile.x && tile.y === this.hoverTile.y )?.type );
                break;
        }
        return true;
    }

    update(): void {
        const action: CameraActions = this.pointerActions.toCameraAction();

        if ( action !== CameraActions.IDLE ) {
            this.interactionCallback({ type: "pan", data: action });
        }
    }

    draw( ctx: CanvasRenderingContext2D ): void {
        const x = this.world.x;
        const y = this.world.y;

        // TODO: calculate this on camera pan action update
       this.viewport.left = Math.round((( renderedMap.width / 2 ) + horPosition( x, y )) - this.mapCenterX );
       this.viewport.top  = Math.round( verPosition( x, y ) - this.mapCenterY );

        ctx.drawImage(
            renderedMap,
            this.viewport.left, this.viewport.top,
            this.viewport.width, this.viewport.height,
            0, 0,
            this.viewport.width, this.viewport.height,
        );

        // TODO check if in valid range (not Infinity)

        if ( this.hoverTile.x !== Infinity ) {
            const point = this.tileToLocal( this.hoverTile.x, this.hoverTile.y );
            ctx.drawImage(
                CURSORS,
                0, 0, 128, 128,
                point.x, point.y,
                128, 128
            );
        }

        for ( const actor: Actor of this.actors ) {
            // TODO cache these points for immobile actors
            const point = this.tileToLocal( actor.x, actor.y );
            if ( point.x >= 0 && point.x <= this.viewport.width && point.y >= 0 && point.y <= this.viewport.height ) {
                ctx.fillStyle = "yellow";
                const w = 64;
                // TODO: use zCanvas draw-safe method
                ctx.fillRect( point.x + w / 2, point.y - w / 2, w, w );
            }
        }

        if ( true )return

        // TODO we need to know what the visible range of tiles is
        // TODO : can we roll this into a single loop ?

        for ( let tx = this.viewport.left; tx < this.viewport.left + this.viewport.width; ++tx ) {
           for ( let ty = this.viewport.top; ty < this.viewport.top + this.viewport.height; ++ty ) {
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
                const hover = this.hoverTile.x === x && this.hoverTile.y === y;
                ctx.globalCompositeOperation = hover ? "destination-out" : "source-over";

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

    /* internal methods */

    /**
     * Retrieves a tile from an absolute, isometric render coordinate
     */
    private absoluteToTile( x: number, y: number ): Point {
        const out = { x: Infinity, y: Infinity };

        // 2D coordinate of tile under mouse position
        const tileX = Math.round((( y + x * 0.5 ) / this.actualTileHeight ) - ( this.world.width * 0.5 ));
        const tileY = Math.round((( y - x * 0.5 ) / this.actualTileHeight ) + ( this.world.height * 0.5 ));

        if ( tileX < 0 || tileX > this.world.width || tileY < 0 || tileY > this.world.height ) {
            return out; // tile is out of world bounds
        }
        out.x = tileX;
        out.y = tileY;

        return out;
    }

    /**
     * Converts a 2D world coordinate to a local on-screen isometric viewport coordinate
     */
    private tileToLocal( x: number, y: number ): Point {
        return {
            x: renderedMap.width * 0.5 + ( horPosition( x, y ) - TILE_WIDTH_HALF ) - this.viewport.left,
            y: ( TILE_HEIGHT_HALF + ( verPosition( x, y ) - TILE_HEIGHT_HALF ) - this.viewport.top )// - ( i * TILE_HEIGHT_HALF ))
        };
    }
};
