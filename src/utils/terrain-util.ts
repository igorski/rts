import type { Point, Box } from "@/definitions/math";
import { TileTypes, type EnvironmentDef, type TileDef } from "@/definitions/world-tiles";
import TileFactory from "@/model/factories/tile-factory";
import { findPath } from "@/utils/path-finder";
import { random, randomInRangeInt } from "@/utils/random-util";

/**
 * grow the amount of terrain of given type on the given map
 * blatantly stolen from code by Igor Kogan
 */
export const growTerrain = ( world: EnvironmentDef, type: TileTypes, chanceThreshold: number = 0.7 ) => {
    const { terrain, width, height } = world;

    for ( let x = 0, y = 0; y < height; x = ( ++x === width ? ( x % width + ( ++y & 0 ) ) : x )) {
        const index = coordinateToIndex( x, y, world );
        if ( terrain[ index ].type === type ) {
            const pi = getSurroundingIndices( x, y, width, height, random() > 0.7, 3 );
            for ( let i = 0; i < pi.length; i++ ) {
                if ( random() > chanceThreshold ) {
                    const idx = pi[ i ];
                    const coord = indexToCoordinate( idx, world );
                    terrain[ idx ] = TileFactory.create( coord.x, coord.y, type, 1 );
                }
            }
        }
    }
};

/**
 * collect surrounding indices for a given coordinate
 * (blatantly stolen from code by Igor Kogan)
 */
export const getSurroundingIndices = ( x: number, y: number, mapWidth: number, mapHeight: number, inclDiagonals: boolean, size: number = 1 ): number[] => {
    const possibleIndices = [];
    let tx, ty, nx, ny;

    for ( tx = 0, ty = 0; ty < size; tx = ( ++tx === size ? ( tx % size + ( ++ty & 0 ) ) : tx )) {
        nx = x + tx - 1;
        ny = y + ty - 1;

        if ( nx >= 0 && ny >= 0 && nx < mapWidth && ny < mapHeight ) {
            if ( inclDiagonals ||
               (( nx == x && ny != y ) || ( ny == y && nx != x )) ) {
                possibleIndices.push( ny * mapWidth + nx );
            }
        }
    }
    return possibleIndices;
};

/**
 * Gets the bounding box coordinates described by a list of indices
 */
export const getBoxForIndices = ( indices: number[], environment: EnvironmentDef ): Box => {
    let left   = Infinity;
    let right  = -Infinity;
    let top    = Infinity;
    let bottom = -Infinity;

    indices.forEach( index => {
        const { x, y } = indexToCoordinate( index, environment );
        left   = Math.min( left, x );
        right  = Math.max( right, x );
        top    = Math.min( top, y );
        bottom = Math.max( bottom, y );
    });
    return { left, right, top, bottom };
};

/**
 * returns the first available position in the terrain
 * where the underlying tile is of given tileType and is free
 */
export const positionAtFirstFreeTileType = ( terrain: TileDef[], tileType: TileTypes ): number => {
    for ( let i = 0; i < terrain.length; ++i ) {
        if ( terrain[ i ].type === tileType ) {
            return i;
        }
    }
    throw new Error( `could not find terrain of type "${tileType}"` );
};

/**
 * returns the first available position in the terrain
 * where the underlying tile is of given tileType and is free
 */
export const positionAtLastFreeTileType = ( terrain: TileDef[], tileType: TileTypes ): number => {
    let i = terrain.length;
    while ( i-- ) {
        if ( terrain[ i ].type === tileType ) {
            return i;
        }
    }
    throw new Error( `could not find terrain of type "${tileType}"` );
};

/**
 * returns a random position in the terrain
 * where the underlying tile is of given tileType and is free
 */
export const positionAtRandomFreeTileType = ( terrain: TileDef[], tileType: TileTypes ): number => {
    let i = 0;
    const success = () => {
        i = Math.round( random() * terrain.length );
        while ( i-- ) {
            if ( terrain[ i ].type === tileType ) {
                return true;
            }
        }
        return false;
    };
    if ( success() ) {
        return i;
    }
    throw new Error( `could not find terrain of type "${tileType}"` );
};

/**
 * Retrieves all eight tiles surrounding the given coordinate
 * TODO: there is no bounds checking here, so coordinate must not be at world edge
 */
export const getSurroundingTiles = ( x: number, y: number, environment: EnvironmentDef ): SurroundingTiles => {
    const { terrain } = environment;
    const out = getSurroundingIndicesForPoint( x, y, environment );
    return Object.entries( out ).reduce(( acc: SurroundingTiles, [ key, value ]) => {
        return {
            ...acc,
            [ key ]: terrain[ value ].type,
        };
    }, {});
};

/**
 * Asserts whether the tiles surrounding given coordinate for given environment
 * are all of the given tileType
 */
export const assertSurroundingTilesOfTypeAroundPoint = ( x: number, y: number, environment: EnvironmentDef, tileType: TileTypes ): boolean => {
    const { terrain } = environment;
    const surrounding = Object.values( getSurroundingIndicesForPoint( x, y, environment ));
    return !surrounding.some( tile => terrain[ tile ].type !== tileType );
};

type SurroundingTiles = {
    [key: string]: TileTypes;
};

interface SurroundingIndices {
    above: number,
    aboveLeft: number,
    aboveRight: number,
    left: number,
    right: number,
    below: number,
    belowLeft: number,
    belowRight: number
};

/**
 * Retrieves indices of all eight points surrounding the given coordinate
 * TODO: there is no bounds checking here, so coordinate must not be at world edge
 */
export const getSurroundingIndicesForPoint = ( x: number, y: number, environment: EnvironmentDef ): SurroundingIndices => ({
    above      : coordinateToIndex( x, y - 1, environment ),
    aboveLeft  : coordinateToIndex( x - 1, y - 1, environment ),
    aboveRight : coordinateToIndex( x + 1, y - 1, environment ),
    left       : coordinateToIndex( x - 1, y, environment ),
    right      : coordinateToIndex( x + 1, y, environment ),
    below      : coordinateToIndex( x, y + 1, environment ),
    belowLeft  : coordinateToIndex( x - 1, y + 1, environment ),
    belowRight : coordinateToIndex( x + 1, y + 1, environment )
});

export const getFirstFreeTileOfTypeAroundPoint = ( x: number, y: number, environment: EnvironmentDef, tileType: TileTypes ) => {
    const { terrain } = environment;
    const surroundingTiles = Object.values( getSurroundingIndicesForPoint( x, y, environment )) as number[];
    for ( let i = 0; i < surroundingTiles.length; ++i ) {
        const index = surroundingTiles[ i ];
        if ( terrain[ index ].type === tileType ) {
            return indexToCoordinate( index, environment );
        }
    }
    return null;
};

export const getRandomFreeTilePosition = ( environment: EnvironmentDef, tileType: TileTypes = TileTypes.GROUND ): Point | null => {
    try {
        const index = positionAtRandomFreeTileType( environment.terrain, tileType );
        return indexToCoordinate( index, environment );
    } catch {
        return null;
    }
};

/**
 * Translates an x/y coordinate to the corresponding index in an environments terrain list
 */
export const coordinateToIndex = ( x: number, y: number, { width }: EnvironmentDef ): number => x + ( width * y );

/**
 * Translates an index from an environments terrain list to
 * the corresponding x/y coordinate
 */
export const indexToCoordinate = ( index: number, { width, height }: EnvironmentDef ): Point => ({
    x: index % width,
    y: Math.round( index / width )
});

/**
 * Calculate the distance between the two provided points
 */
export const distance = ( x1: number, y1: number, x2: number, y2: number ): number => Math.sqrt( Math.pow(( x1 - x2 ), 2) + Math.pow(( y1 - y2 ), 2 ));

/**
 * Request to position an object within given minDistance from given coordinate (within a
 * circular radius). This position is subsequently tested to verify whether a valid path can be
 * traversed from the start to calculated target coordinates. This keeps retrying until a navigateable
 * path is found, otherwise null is returned.
 */
export const positionInReachableDistanceFromPoint = ( env: EnvironmentDef, startX: number, startY: number, minDistance: number, maxWalkableTile: TileTypes ): Point | null => {
    const width = minDistance;
    const height = minDistance;
    const halfWidth = Math.round( width  / 2 );
    const degToRad = Math.PI / 180;
    let incrementRadians = (( 360 / 8 /* points around player center */ ) * degToRad );
    let distance = minDistance;
    let radians  = degToRad + ( incrementRadians * randomInRangeInt( 0, 5 ));

    let tries = 64;  // fail-safe, let's not recursive forever
    while ( tries-- ) {
        const circleRadius = Math.round( distance );

        const targetX = Math.round( startX + Math.sin( radians ) * circleRadius );
        const targetY = Math.round( startY + Math.cos( radians ) * circleRadius );

        if (( targetX < 0 || targetX > env.width ) || ( targetY < 0 || targetY > env.height )) {
            // out of bounds, shrink circle again
            radians   = degToRad;
            distance  = minDistance;
            // TODO: starting from center, should this be an argument ?
            startX = env.width / 2;
            startY = env.height / 2;
        } else if ( checkIfCanReach( env, startX, startY, targetX, targetY, maxWalkableTile )) {
            return { x: targetX, y: targetY };
        }
        radians  += incrementRadians;
        distance *= 1.2;
    }
    return null;
}

 /**
  * Verify whether given coordinates can be connected via a path of waypoints
  */
export const checkIfCanReach = ( env: EnvironmentDef, startX: number, startY: number, targetX: number, targetY: number, maxWalkableTile: TileTypes ): boolean => findPath( env, startX, startY, targetX, targetY, maxWalkableTile )?.length > 0;
