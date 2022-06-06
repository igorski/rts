import { Map } from "rot-js";

import { TileTypes, type EnvironmentDef } from "@/definitions/world-tiles";
//import { reserveObject, checkIfFree } from "@/utils/map-util";
import { findPath } from "@/utils/path-finder";
import {
    growTerrain, getSurroundingIndices, getSurroundingTiles,
    getRectangleForIndices, coordinateToIndex, indexToCoordinate
} from "@/utils/terrain-util";
import { random, randomInRangeInt } from "@/utils/random-util";

const DEBUG = process.env.NODE_ENV === "development";

const MAX_WALKABLE_TILE = TileTypes.SAND;

const WorldFactory =
{
    /**
     * Creates a new, empty World
     */
    create(): EnvironmentDef {
        const size  = 8;
        const world: EnvironmentDef = {
            x: size / 2,
            y: size / 2,
            width: size,
            height: size,
            terrain: [],
        };
        return world;
    },

    /**
     * Populates given World with terrain and environment variables
     * calculated for given hash
     */
    populate( world: EnvironmentDef ): EnvironmentDef {
        let size = 175; // amount of horizontal and vertical tiles in the world

        world.width  = size;
        world.height = size;

        const centerX = Math.round( world.width  / 2 );
        const centerY = Math.round( world.height / 2 );

        // generate the terrain

        generateTerrain( world );

        // center player within world

        world.x = centerX;
        world.y = centerY;

        return world;
    },

    /**
     * disassemble the world into a serialized JSON structure
     */
    disassemble( world: EnvironmentDef ): object {
        const out = {};

        // TODO

        return out;
    },

    /**
     * assemble a serialized JSON Object
     * back into world structure
     */
    assemble( data: object ): EnvironmentDef {
        const world: EnvironmentDef = WorldFactory.create();

        // TODO

        return world;
    }
};
export default WorldFactory;

/* internal methods */

/**
 * generate the terrain for the given world
 * blatantly stolen from code by Igor Kogan (okay, he kindly donated it)
 */
function generateTerrain( world: EnvironmentDef ) {
    const MAP_WIDTH = world.width, MAP_HEIGHT = world.height;

    // first create the GROUND

    world.terrain = new Array( MAP_WIDTH * MAP_HEIGHT );
    for ( let i = 0, x = 0, y = 0; y < MAP_HEIGHT; x = ( ++x === MAP_WIDTH ? ( x % MAP_WIDTH + ( ++y & 0 )) : x ), ++i ) {
        world.terrain[ i ] = { x, y, type: TileTypes.SAND, height: 1 };
    }

    //digRoads( MAP_WIDTH, MAP_HEIGHT );

    let x, y, i, index;

    function genSeed( type: TileTypes, size: number ) {
        const WS = Math.ceil( MAP_WIDTH * MAP_HEIGHT / 1000 );
        for ( i = 0; i < WS; i++ ) {
            x = Math.floor( random() * MAP_WIDTH );
            y = Math.floor( random() * MAP_HEIGHT );
            index = coordinateToIndex( x, y, world );
            world.terrain[ index ] = { x, y, type, height: 1 };
        }
        for ( i = 0; i < size; i++ ) {
            growTerrain( world.terrain, MAP_WIDTH, MAP_HEIGHT, type );
        }
    }

    genSeed( TileTypes.WATER,    10 ); // plant water seeds (lake)
    genSeed( TileTypes.GRASS,    6 );  // plant grass seeds (park)
    genSeed( TileTypes.MOUNTAIN, 3 );  // plant rock seeds (mountain)

    // sandify (creates "beaches" around water)

    const beachSize = randomInRangeInt( 5, 10 );

    for ( x = 0, y = 0; y < MAP_HEIGHT; x = ( ++x === MAP_WIDTH ? ( x % MAP_WIDTH + ( ++y & 0 )) : x )) {
        const index = coordinateToIndex( x, y, world );
        if ( world.terrain[ index ].type === TileTypes.GROUND ) {
            const around = getSurroundingIndices( x, y, MAP_WIDTH, MAP_HEIGHT, true, beachSize );
            for ( i = 0; i < around.length; i++ ) {
                if ( world.terrain[ around[ i ]].type === TileTypes.WATER && random() > .7 ) {
                    world.terrain[ index ].type = TileTypes.SAND;
                    break;
                }
            }
        }
    }

    // plant some trees in the parks

    const TS = Math.ceil( MAP_WIDTH * MAP_HEIGHT * 0.1 );

    for ( i = 0; i < TS; i++ ) {
        x     = Math.floor( random() * MAP_WIDTH );
        y     = Math.floor( random() * MAP_HEIGHT );
        index = coordinateToIndex( x, y, world );

        if ( world.terrain[ index ].type === TileTypes.GRASS ) {
            world.terrain[ index ].type = TileTypes.TREE;
        }
    }

    // now clean up possible weirdness

    for ( x = 0, y = 0; y < MAP_HEIGHT; x = ( ++x === MAP_WIDTH ? ( x % MAP_WIDTH + ( ++y & 0 )) : x )) {
        if ( x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1 ) {
            continue; // ignore tiles at world edges
        }
        const tileIndex = coordinateToIndex( x, y, world );
        const tile = world.terrain[ tileIndex ];
        const surroundingTiles = getSurroundingTiles( x, y, world );
        // get rid of tiles that are surrounded by completely different tiles
        if ( !Object.values( surroundingTiles ).includes( tile )) {
            if ( tile.type === TileTypes.GRASS ) {
                // if the tile was grass, just plant a tree, it probably looks cute!
                world.terrain[ tileIndex ].type = TileTypes.TREE;
            } else {
                world.terrain[ tileIndex ].type = surroundingTiles.left;
            }
        }
    }
}

/**
 * Generate roads
 */
function digRoads( worldWidth: number, worldHeight: number ) {
    const minRoadWidth  = Math.min( Math.round( random() ) + 2, worldWidth );
    const minRoadHeight = Math.min( Math.round( random() ) + 2, worldHeight );
    let maxRoadWidth    = Math.min( Math.round( random() ) + 2, worldWidth  );
    let maxRoadHeight   = Math.min( Math.round( random() ) + 2, worldHeight );

    // make sure the maximum dimensions exceed the minimum dimensions !

    maxRoadWidth  = Math.max( minRoadWidth,  maxRoadWidth );
    maxRoadHeight = Math.max( minRoadHeight, maxRoadHeight );

    const digger = new Map.Digger( worldWidth, worldHeight, {
        roomWidth      : [ minRoadWidth,  maxRoadWidth  ], /* room minimum and maximum width */
        roomHeight     : [ minRoadHeight, maxRoadHeight ], /* room minimum and maximum height */
        corridorLength : [ 5, 20 ], /* corridor minimum and maximum length */
        dugPercentage  : 0.2, /* we stop after this percentage of floor area has been dug out */
        timeLimit      : 1000 /* we stop after this much time has passed (msec) */
    });
    const map: Array<TileTypes>[] = [];

    // init output terrain map

    for ( let x = 0; x < worldWidth; ++x ) {
        map[ x ] = new Array( worldHeight ).fill( TileTypes.NOTHING );
    }

    // create map
    digger.create(( x, y, tile ) => {
        switch( tile ) {
            case 1:
                break;
            case 0:
                map[ x + 1 ][ y + 1 ] = TileTypes.ROAD;
                break;
        }
    });
    const xl = map.length;
    const yl = map[ 0 ].length;

    // convert two dimensional array to one dimensional terrain map

    const terrain = [];

    for ( let x = 0; x < xl; ++x ) {
        for ( let y = 0; y < yl; ++y ) {
            terrain[ y * xl + x ] = { x, y, height: 1, type: map[ x ][ y ] };
        }
    }
    return terrain;
}
