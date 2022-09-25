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
import { ActorType } from "@/definitions/actors";
import type { Point, Rectangle, Box, Size } from "@/definitions/math";
import { fastRound } from "@/definitions/math";
import type { TileDef, EnvironmentDef } from "@/definitions/world-tiles";
import {
    TileTypes, TILE_SIZE, TILE_WIDTH_HALF, TILE_HEIGHT_HALF, horPosition, verPosition
} from "@/definitions/world-tiles";
import { sortByDepth } from "@/utils/render-util";
import { coordinateToIndex } from "@/utils/terrain-util";
import DirectionBox from "@/model/math/direction-box";
import CACHE, { PRECACHE_ISOMETRIC_MAP } from "./render-cache";
import { renderBuilding } from "./building-renderer";
import { getMapSize, renderTileIsometric } from "./map-renderer";
import { renderUnit } from "./unit-renderer";

const { CURSORS, TILES } = CACHE.sprites;
const renderedMap = CACHE.map.isometric;
const sortedActors: Actor[] = [];
const pointCache: Point[] = [];
let halfMap: number = 0;

const POINTER_HIT_AREA = 50;
const DEBUG = process.env.NODE_ENV !== "production";

export enum CanvasActions {
    ACTOR_SELECT,
    AREA_CLICK,
    CAMERA_PAN,
    OBJECT_PLACE,
};

export default class GameRenderer extends sprite {
    // @ts-expect-error no initializer
    private world: EnvironmentDef;
    private actors: Actor[] = [];
    private terrain: TileDef[] = [];
    private mapCenterX: number = 0;
    private mapCenterY: number = 0;
    private pointerPos: Point = { x: Infinity, y: Infinity };
    private edges: Box = { left: 0, right: 0, top: 0, bottom: 0 };
    private visible: Box = { left: 0, right: 0, top: 0, bottom: 0 };
    private pointerActions: DirectionBox = new DirectionBox();
    private horizontalTileAmount: number = 0;
    private verticalTileAmount: number = 0;
    private actualTileHeight: number = TILE_SIZE;
    private scale: number = 1;
    private interactionCallback: Function;
    private placeMode: Size | undefined;
    private visibleActors: Actor[] = [];
    private lastX: number = 0;
    private lastY: number = 0;
    private lastActorAmount: number = 0;

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

    setWorldSize( width: number, height: number, horizontalTileAmount: number, verticalTileAmount: number ): void {
        this.horizontalTileAmount = horizontalTileAmount;
        this.verticalTileAmount   = verticalTileAmount;

        if ( DEBUG ) {
            console.info(
                `tile amount hor and ver: ${this.horizontalTileAmount}x${this.verticalTileAmount} ` +
                `world pos: ${this.world.x}x${this.world.y} ` +
                `coord for world pos would be: ${horPosition( this.world.x, this.world.y )}x${verPosition( this.world.x, this.world.y )}`
            );
        }

        // ensure the hit area matches the bounding box, make up for canvas scale factor
        const { x, y } = this.canvas._scale;

        this.setWidth( width * x );
        this.setHeight( height * y );

        halfMap = getMapSize( this.world ).width / 2;

        // invalidates viewport cache (see update())
        this.lastX = 0;
        this.lastY = 0;

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

    setPlaceMode( width: number, height: number ): void {
        this.placeMode = { width, height };
    }

    unsetPlaceMode(): void {
        this.placeMode = undefined;
    }

    /* zCanvas overrides */

    handleInteraction( x: number, y: number, event: Event ): boolean {
        const absoluteX = ( x + this.viewport.left );
        const absoluteY = ( y + this.viewport.top ) - TILE_HEIGHT_HALF / 2;

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
                // mouse coordinates relative to absolute map position in isometric view
                this.pointerPos = this.absoluteToTile( absoluteX, absoluteY );
                break;

            case "mousedown":
            case "touchdown":

                // debug info, what is the range of visible tiles we can see ?
                if ( DEBUG ) {
                    console.info(
                        `top left: ${JSON.stringify( this.absoluteToTile( this.viewport.left, this.viewport.top ))} ` +
                        `bottom right: ${JSON.stringify( this.absoluteToTile(
                            this.viewport.left + this.viewport.width, this.viewport.top + this.viewport.height
                        ))}`,
                    );
                    console.info( `mouse coordinate ${absoluteX}x${absoluteY}, corresponds to tile ${JSON.stringify( this.pointerPos )} of type ${this.world.terrain.find( tile => tile.x === this.pointerPos.x && tile.y === this.pointerPos.y )?.type}`);
                }

                if ( this.placeMode !== undefined ) {
                    if ( !this.canPlace() ) {
                        return;
                    }
                    return this.interactionCallback({ type: CanvasActions.OBJECT_PLACE, data: this.pointerPos });
                }

                const actor = this.visibleActors.find(({ x, y, z, width, height }) => {
                    let left = fastRound( x );
                    let right = left + width;
                    let top = fastRound( y );
                    let bottom = top + height;
                    // TODO : take building z into account
                    return ( this.pointerPos.x >= left && this.pointerPos.x <= right &&
                             this.pointerPos.y >= top  && this.pointerPos.y <= bottom );
                });
                if ( actor ) {
                    this.interactionCallback({ type: CanvasActions.ACTOR_SELECT, data: actor });
                } else {
                    this.interactionCallback({ type: CanvasActions.AREA_CLICK, data: this.pointerPos });
                }
                break;
        }
        return true;
    }

    update(): void {
        const action: CameraActions = this.pointerActions.toCameraAction();

        if ( action !== CameraActions.IDLE ) {
            this.interactionCallback({ type: CanvasActions.CAMERA_PAN, data: action });
        }

        // keep the viewport in sync with camera movements

        const { x, y } = this.world;
        let panned = false;

        if ( this.lastX !== x || this.lastY !== y ) {
            this.lastX = x;
            this.lastY = y;

            this.viewport.left = fastRound((( halfMap ) + horPosition( x, y )) - this.mapCenterX );
            this.viewport.top  = fastRound( verPosition( x, y ) - this.mapCenterY );

            panned = true;
        }

        // calculate the visible actor list on updated viewport or actor amount
        // TODO: can we also take into account the Actors that can move ?

        if ( panned || this.lastActorAmount !== this.actors.length ) {
            this.lastActorAmount = this.actors.length;
            /**
             * TODO within visible area calculations ? (happens in draw() anyways...)
             * but need to solve issue with movable actors first. perhaps split in buildings and units.
             */
             //this.visibleActors.length = 0;
             this.visibleActors = this.actors;

             // cache the visible area

             const tl = this.absoluteToTile( this.viewport.left, this.viewport.top, false );
             const br = this.absoluteToTile(
                 this.viewport.left + this.viewport.width, this.viewport.top + this.viewport.height, false
             );
             const HALF_TILE_AMOUNT_IN_WIDTH  = this.horizontalTileAmount / 2;
             const HALF_TILE_AMOUNT_IN_HEIGHT = this.verticalTileAmount / 2;

             this.visible.left   = /*tl.x;*/ Math.max( 0, fastRound( tl.x - HALF_TILE_AMOUNT_IN_WIDTH ));
             this.visible.top    = Math.max( 0, fastRound( tl.y - this.verticalTileAmount ));
             this.visible.right  = Math.min( this.world.width - 1, fastRound( this.visible.left + this.horizontalTileAmount + HALF_TILE_AMOUNT_IN_WIDTH ));
             this.visible.bottom = Math.min( this.world.height - 1, fastRound( tl.y + this.verticalTileAmount + HALF_TILE_AMOUNT_IN_HEIGHT ));

             if ( DEBUG ) {
                 console.info('vp:'+JSON.stringify(this.viewport)+',tl:'+JSON.stringify(tl)+',visibles:'+JSON.stringify(this.visible),this.horizontalTileAmount,this.verticalTileAmount, this.world.width + ' x ' + this.world.height);
            }
        }
    }

    draw( ctx: CanvasRenderingContext2D ): void {

        // 1. render background tiles

        if ( PRECACHE_ISOMETRIC_MAP ) {
            // 1.1 render from cache
            ctx.drawImage(
                renderedMap,
                this.viewport.left, this.viewport.top,
                this.viewport.width, this.viewport.height,
                0, 0,
                this.viewport.width, this.viewport.height,
            );

        } else {
            // 1.2 live render
            const viewport = {
                ...this.viewport,
                left: this.viewport.left - ( this.viewport.width / 2 ),
            //    top: this.viewport.top - ( this.viewport.height / 2 ),
            };

            // columns
            for ( let tx = this.visible.left; tx < this.visible.right; ++tx ) {
                // rows
                for ( let ty = this.visible.top; ty < this.visible.bottom; ++ty ) {
                    renderTileIsometric( this.world, this.world.terrain[ coordinateToIndex( tx, ty, this.world ) ], ctx, viewport );
                }
            }
        }

        // 2. draw cursor position

        if ( this.placeMode !== undefined ) {
            // 2.1 placemode is active, show placeable building outline
            const { width, height } = this.placeMode;
            const canPlace = this.canPlace();
            for ( let x = 0; x < width; ++x ) {
                for ( let y = 0; y < height; ++y ) {
                    const point = this.tileToLocal( this.pointerPos.x + x, this.pointerPos.y + y );
                    ctx.drawImage(
                        CURSORS,
                        canPlace ? 0 : 128, 0,
                        128, 128,
                        point.x, point.y,
                        128, 128
                    );
                }
            }
        } else if ( this.pointerPos.x !== Infinity ) {
            // 2.2 show regular pointer cursor
            const point = this.tileToLocal( this.pointerPos.x, this.pointerPos.y );
            ctx.drawImage(
                CURSORS,
                0, 0, 128, 128,
                point.x, point.y,
                128, 128
            );
        }

        // 3. draw Actors, back to front

        sortedActors.length = 0;
        pointCache.length = 0;

        const { width, height } = this.viewport;

        for ( const actor: Actor of this.visibleActors ) {
            // TODO cache these points for immobile actors
            const point = this.tileToLocal( actor.x, actor.y );
            if ( point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height ) {
                sortedActors.push( actor );
                pointCache[ actor.id ] = point;
            }
        }
        sortByDepth( sortedActors );

        for ( const actor: Actor of sortedActors ) {
            if ( actor.type === ActorType.UNIT ) {
                const point = pointCache[ actor.id ];
                renderUnit( ctx, point, actor );
            } else if ( actor.type === ActorType.BUILDING ) {
                renderBuilding( ctx, halfMap, this.viewport, actor );
            }
        }
    }

    /* internal methods */

    /**
     * Retrieves a tile from an absolute, isometric render coordinate
     */
    private absoluteToTile( x: number, y: number, limitRange: boolean = true ): Point {
        const out = { x: 0, y: 0 };//Infinity, y: Infinity };
        const { width, height } = this.world;

        // 2D coordinate of tile under mouse position
        const tileX = fastRound((( y + x * 0.5 ) / this.actualTileHeight ) - ( width  * 0.5 ));
        const tileY = fastRound((( y - x * 0.5 ) / this.actualTileHeight ) + ( height * 0.5 ));

        if ( limitRange && ( tileX < 0 || tileX > width || tileY < 0 || tileY > height )) {
            return out; // tile is outside of world bounds
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
            x: halfMap + ( horPosition( x, y ) - TILE_WIDTH_HALF ) - this.viewport.left,
            y: ( TILE_HEIGHT_HALF + ( verPosition( x, y ) - TILE_HEIGHT_HALF ) - this.viewport.top )
        };
    }

    /**
     * Asserts whether we can place the currently placeable
     * Object at the current hover coordinates
     */
    private canPlace(): boolean {
        for ( let x = this.pointerPos.x, xl = x + this.placeMode.width; x < xl; ++x ) {
            for ( let y = this.pointerPos.y, yl = y + this.placeMode.height; y < yl; ++y ) {
                if ( this.world.terrain[ coordinateToIndex( x, y, this.world )].type !== TileTypes.ROCK ||
                    this.visibleActors.find( actor => actor.x === x && actor.y === y )) {
                    return false;
                }
            }
        }
        return true;
    }
};
