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
import { Map } from "rot-js";

import { TileTypes, type EnvironmentDef } from "@/definitions/world-tiles";
//import { reserveObject, checkIfFree } from "@/utils/map-util";
import { findPath } from "@/utils/path-finder";
import {
    growTerrain, getSurroundingIndices, getSurroundingTiles,
    getBoxForIndices, coordinateToIndex, indexToCoordinate
} from "@/utils/terrain-util";
import { random, randomInRangeInt } from "@/utils/random-util";
import TileFactory from "./tile-factory";
import type { SerializedTile } from "./tile-factory";

const DEBUG = process.env.NODE_ENV === "development";

const MAX_WALKABLE_TILE = TileTypes.SAND;

export type SerializedWorld = {
    x: number,
    y: number,
    w: number,
    h: number,
    t: SerializedTile[]
};

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
        const size = 100; // amount of horizontal and vertical tiles in the world

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
    serialize( world: EnvironmentDef ): SerializedWorld {
        return {
            x: world.x,
            y: world.y,
            w: world.width,
            h: world.height,
            t: world.terrain.map( TileFactory.serialize )
        };
    },

    /**
     * assemble a serialized JSON Object
     * back into world structure
     */
    deserialize( data: SerializedWorld ): EnvironmentDef {
        const world = WorldFactory.create();

        world.x = data.x;
        world.y = data.y;
        world.width = data.w;
        world.height = data.h;
        world.terrain = data.t.map( TileFactory.deserialize );

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
    const { width, height } = world;

    // first create the GROUND

    world.terrain = new Array( width * height );
    for ( let x = 0, y = 0; y < height; x = ( ++x === width ? ( x % width + ( ++y & 0 )) : x )) {
        const index = coordinateToIndex( x, y, world );
        world.terrain[ index ] = TileFactory.create( x, y, TileTypes.SAND, 1 );
    }

    //digRoads( MAP_WIDTH, MAP_HEIGHT );

    let x, y, i, index;

    function genSeed( type: TileTypes, size: number ) {
        const WS = Math.ceil( width * height / 1000 );
        const heightTiles = [ TileTypes.MOUNTAIN, TileTypes.SAND ];
        for ( i = 0; i < WS; i++ ) {
            x = Math.floor( random() * width );
            y = Math.floor( random() * height );
            index = coordinateToIndex( x, y, world );
            const tileHeight = heightTiles.includes( type ) ? randomInRangeInt( 1, 5 ) : 1;
            world.terrain[ index ] = TileFactory.create( x, y, type, tileHeight );
        }
        for ( i = 0; i < size; i++ ) {
            growTerrain( world, type );
        }
    }

    genSeed( TileTypes.WATER,    10 ); // plant water seeds (lake)
    genSeed( TileTypes.GRASS,    6 );  // plant grass seeds (park)
    genSeed( TileTypes.MOUNTAIN, 3 );  // plant rock seeds (mountain)

    // sandify (creates "beaches" around water)

    const beachSize = randomInRangeInt( 5, 10 );

    for ( x = 0, y = 0; y < height; x = ( ++x === width ? ( x % width + ( ++y & 0 )) : x )) {
        const index = coordinateToIndex( x, y, world );
        if ( world.terrain[ index ].type === TileTypes.GROUND ) {
            const around = getSurroundingIndices( x, y, width, height, true, beachSize );
            for ( i = 0; i < around.length; i++ ) {
                if ( world.terrain[ around[ i ]].type === TileTypes.WATER && random() > .7 ) {
                    world.terrain[ index ].type = TileTypes.SAND;
                    break;
                }
            }
        }
    }

    // plant some trees in the parks

    const TS = Math.ceil( width * height * 0.1 );

    for ( i = 0; i < TS; i++ ) {
        x     = Math.floor( random() * width );
        y     = Math.floor( random() * height );
        index = coordinateToIndex( x, y, world );

        if ( world.terrain[ index ].type === TileTypes.GRASS ) {
            world.terrain[ index ].type = TileTypes.TREE;
        }
    }

    // now clean up possible weirdness

    for ( x = 0, y = 0; y < height; x = ( ++x === width ? ( x % width + ( ++y & 0 )) : x )) {
        if ( x === 0 || x === width - 1 || y === 0 || y === height - 1 ) {
            continue; // ignore tiles at world edges
        }
        const tileIndex = coordinateToIndex( x, y, world );
        const tile = world.terrain[ tileIndex ];
        const surroundingTiles = getSurroundingTiles( x, y, world );
        // get rid of individual tiles that are surrounded by completely different tiles
        if ( !Object.values( surroundingTiles ).includes( tile.type )) {
            if ( tile.type === TileTypes.GRASS ) {
                // if the tile was grass, just plant a tree
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
        map[ x ] = new Array( worldHeight ).fill( TileTypes.GROUND );
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
            terrain[
                coordinateToIndex( x, y, { width: worldWidth } as EnvironmentDef )
            ] = TileFactory.create( x, y, map[ x ][ y ], 1 );
        }
    }
    return terrain;
}
