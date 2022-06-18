import type { Point, Rectangle } from "@/definitions/math";
import { TileTypes, type BaseDef, type EnvironmentDef } from "@/definitions/world-tiles";
import { coordinateToIndex, distance } from "@/utils/terrain-util";
import ExecuteWithRetry from "@/utils/execute-with-retry";

/**
 * Reserves space for a given object at the given coordinate
 *
 * if the requested coordinate isn't free/available, this method
 * will search for the next free position as close as possible to
 * the the requested coordinate
 *
 * @param {BaseDef} object to place
 * @param {Object} environment the environment the object should fit in
 * @param {Array<BaseDef>=} others Array of Objects that should be checked against
 * @param {Array<Number>=} optTileWhitelist optional list of tiles the group can be placed on
 * @return {Point|null} coordinates at which Object has been reserved
 */
export function reserveObject( object: BaseDef, environment: EnvironmentDef, others: BaseDef[] = [], optTileWhitelist?: TileTypes[] ): Point | null {
    let compare = [ ...others ];
    // assemble the list of Objects we shouldn't collide with
    compare = [ /*...environment.shops, ...environment.buildings, ...environment.items,*/ ...compare ];
    const unwalkableTile = TileTypes.MOUNTAIN;

    let { left, top } = object;

    const success = ExecuteWithRetry(() => {
        if ( checkIfFree({ ...object, left, top }, environment, compare, true, optTileWhitelist )) {

            // bit of a cheat... add a wall around the object entrance (which is always at the
            // horizontal middle of the vertical bottom) so the player can't enter/walk outside of the entrace

            const halfWidth = Math.round( object.width / 2 );
            for ( let xd = left - ( halfWidth - 1 ); xd < left + halfWidth; ++xd ) {
                for ( let yd = top - ( object.height - 1 ); yd <= top; ++yd ) {
                    if ( xd === left && yd === top ) {
                        continue;
                    }
                    environment.terrain[ coordinateToIndex( xd, yd, environment )].type = unwalkableTile;
                }
            }
            return true;
        }

        // which direction we'll try next

        const goLeft = left > environment.width / 2;
        const goUp   = top > environment.height / 2;

        if ( goLeft ) {
            --left;
        } else {
            ++left;
        }
        if ( goUp ) {
            --top;
        } else {
            ++top;
        }

        // keep within environment bounds though

        left = Math.max( 0, Math.min( left, environment.width ));
        top  = Math.max( 0, Math.min( top,  environment.height ));
    });
    if ( success ) {
        return { x: left, y: top };
    }
    return null; // didn't find a spot... :(
}

/**
 * check whether there is nothing occupying the given
 * bounding box in the environment
 *
 * @param {Object} area rectangle to verify if is free
 * @param {Object} environment
 * @param {Array<Object>} objects
 * @param {boolean=} assertTiles default to true, ensures the tiles at the coordinate ara available
 * @param {Array<Number>=} optTileWhitelist optional list of tiles the group can be placed on
 * @return {boolean} whether the position is free
 */
export function checkIfFree( area: Rectangle, environment: EnvironmentDef, objects: BaseDef[], assertTiles = true, optTileWhitelist?: TileTypes[] ): boolean {
    const { width, height } = area;

    // check if the underlying tile types around the object coordinate are valid for placement
    if ( assertTiles ) {
        const envList = [ TileTypes.GROUND, TileTypes.SAND ];
        const whitelist = Array.isArray( optTileWhitelist ) ? optTileWhitelist : envList;
        // ensure we have this amount of tiles around the object entrance (ensures we can walk there)
        const PADDING = 2;
        // uncomment width and height in below loop conditions if the ENTIRE object surface
        // needs to be on top of the whitelisted tiles
        for ( let x = Math.max( 0, area.left - PADDING ), xt = Math.min( environment.width, area.left + /*width +*/ PADDING ); x < xt; ++x ) {
            for ( let y = Math.max( 0, area.top - PADDING ), yt = Math.min( environment.height, area.top + /*height +*/ PADDING ); y < yt; ++y ) {
                const tile = environment.terrain[ coordinateToIndex( x, y, environment )];
                if ( !whitelist.includes( tile.type )) {
                    return false;
                }
            }
        }
    }

    // check if there is no other Object registered at this position
    const { left, top } = area;
    const radius = Math.max( width, height ) / 2;
    for ( let i = 0, l = objects.length; i < l; ++i ) {
        const compare = objects[ i ];
        const compareRadius = Math.max( compare.width, compare.height );
        const dist = distance( left, top, compare.left, compare.top );

        if ( dist < radius + compareRadius ) {
            return false;
        }
    }
    return true;
}
