import type { Point } from "@/definitions/math";
import type { EnvironmentDef, TileTypes } from "@/definitions/world-tiles";
import type { Actor } from "@/model/factories/actor-factory";

const { abs, max, pow, sqrt } = Math;

/**
 * Calculate the path to take between given start and target coordinates.
 * The path is an array of coordinates to walk.
 *
 * @param {Object} world the environment to walk in
 * @param {number} startX the start x coordinate
 * @param {number} startY the start y coordinate
 * @param {number} targetX the target x coordinate
 * @param {number} targetY the target y coordinate
 * @param {TileTypes=} maxWalkableTileNum the terrain in an environment is represented
 *                  by integers defining the terrain type. This number defines which
 *                  types of terrain are deemed walkable (e.g. road, grass, mud, etc.)
 * @param {Actor[]=} buildings map of buildings to check against (cannot walk on building, right?)
 * @return {Point[]}
 */
export const findPath = (
    world: EnvironmentDef, startX: number, startY: number, targetX: number, targetY: number,
    maxWalkableTileNum: TileTypes = 0, buildings: Actor[] = []
): Point[] => {
    const pathStart = [ startX,  startY  ];
    const pathEnd   = [ targetX, targetY ];

    // keep track of the world dimensions
    // Note that this A-star implementation expects the world array to be square:
    // it must have equal height and width. If your game world is rectangular,
    // just fill the array with dummy values to pad the empty space.
    const worldWidth  = world.width;
    const worldHeight = world.height;
    const worldSize   = worldWidth * worldHeight;
    const terrain     = world.terrain;

    // define heuristic to use

    /*
    // alternate heuristics, depending on purpose:

    // no diagonals (Manhattan)
    const distanceFunction = ManhattanDistance;
    const findNeighbours   = () => {}; // noop

    // diagonals allowed but no sqeezing through cracks:
    */
    const distanceFunction = DiagonalDistance;
    const findNeighbours = DiagonalNeighbours;
    /*
    // diagonals and squeezing through cracks allowed:
    const distanceFunction = DiagonalDistance;
    const findNeighbours = DiagonalNeighboursFree;

    // euclidean but no squeezing through cracks:
    const distanceFunction = EuclideanDistance;
    const findNeighbours = DiagonalNeighbours;

    // euclidean and squeezing through cracks allowed:
    const distanceFunction = EuclideanDistance;
    const findNeighbours = DiagonalNeighboursFree;
    */

    // Neighbours functions, used by findNeighbours function
    // to locate adjacent available cells that aren't blocked

    // Returns every available North, South, East or West
    // cell that is empty. No diagonals,
    // unless distanceFunction function is not Manhattan
    function Neighbours( x: number, y: number ): Point[] {
        const N      = y - 1,
              S      = y + 1,
              E      = x + 1,
              W      = x - 1,
              myN    = N > -1 && canWalkHere( x, N ),
              myS    = S < worldHeight && canWalkHere( x, S ),
              myE    = E < worldWidth && canWalkHere( E, y ),
              myW    = W > -1 && canWalkHere( W, y ),
              result = [];

        if ( myN ) {
            result.push({ x, y: N });
        }
        if ( myE ) {
            result.push({ x: E, y });
        }
        if ( myS ) {
            result.push({ x, y: S });
        }
        if ( myW ) {
            result.push({ x: W, y });
        }
        findNeighbours( myN, myS, myE, myW, N, S, E, W, result );
        return result;
    }

    // returns every available North East, South East,
    // South West or North West cell - no squeezing through
    // "cracks" between two diagonals
    function DiagonalNeighbours( myN: boolean, myS: boolean, myE: boolean, myW: boolean, N: number, S: number, E: number, W: number, result: Point[] ) {
        if ( myN ) {
            if( myE && canWalkHere( E, N )) {
                result.push({ x: E, y: N });
            }
            if ( myW && canWalkHere( W, N )) {
                result.push({ x: W, y: N });
            }
        }
        if ( myS ) {
            if ( myE && canWalkHere( E, S )) {
                result.push({ x: E, y: S });
            }
            if ( myW && canWalkHere( W, S )) {
                result.push({ x: W, y: S });
            }
        }
    }

    // returns every available North East, South East,
    // South West or North West cell including the times that
    // you would be squeezing through a "crack"
    function DiagonalNeighboursFree( myN: boolean, myS: boolean, myE: boolean, myW: boolean, N: number, S: number, E: number, W: number, result: Point[] ) {
        myN = N > -1;
        myS = S < worldHeight;
        myE = E < worldWidth;
        myW = W > -1;

        if ( myE ) {
            if ( myN && canWalkHere( E, N )) {
                result.push({ x: E, y: N });
            }
            if ( myS && canWalkHere( E, S )) {
                result.push({ x: E, y: S });
            }
        }
        if ( myW ) {
            if ( myN && canWalkHere( W, N )) {
                result.push({ x: W, y: N });
            }
            if ( myS && canWalkHere( W, S )) {
                result.push({ x: W, y: S });
            }
        }
    }

    // returns boolean value (world cell is available and open)
    function canWalkHere( x: number, y: number ): boolean {
        const accessible = x < worldWidth && y < worldHeight && terrain[ y * worldWidth + x ].type <= maxWalkableTileNum;
        if ( !accessible ) {
            return false;
        }
        return !buildings.find( building => {
            if ( x >= building.x && x < building.x + building.width && y >= building.y && y < building.y + building.height ) {
                return true;
            }
            return false;
        });
    }

    // Path function, executes AStar algorithm operations
    function calculatePath(): Point[] {
        // create Nodes from the Start and End x,y coordinates
        const mypathStart = createPathNode( null, { x: pathStart[0], y: pathStart[1] }, worldWidth );
        const mypathEnd   = createPathNode( null, { x: pathEnd[0],   y: pathEnd[1]   }, worldWidth );
        // create an array that will contain all world cells
        let AStar: boolean[] = new Array( worldSize );
        // list of currently open Nodes
        let Open: Path[] = [ mypathStart ];
        // list of closed Nodes
        let Closed: Path[] = [];
        // list of the final output array
        const result: Point[] = [];
        // reference to a Node (that is nearby)
        let myNeighbours;
        // reference to a Node (that we are considering now)
        let myNode;
        // reference to a Node (that starts a path in question)
        let myPath;
        // temp integer variables used in the calculations
        let length, max, min, i, j;
        // iterate through the open list until none are left
        while ( length = Open.length ) {
            max = worldSize;
            min = -1;
            for ( i = 0; i < length; i++ ) {
                if ( Open[ i ].f < max ) {
                    max = Open[ i ].f;
                    min = i;
                }
            }
            // grab the next node and remove it from Open array
            myNode = Open.splice( min, 1 )[ 0 ];
            // is it the destination node?
            if ( myNode.value === mypathEnd.value ) {
                myPath = Closed[ Closed.push( myNode ) - 1 ];
                do {
                    result.push({ x: myPath.x, y: myPath.y });
                }
                while ( myPath = myPath.Parent );
                // clear the working arrays
                AStar = Closed = Open = [];
                // we want to return start to finish
                result.reverse();
            }
            else // not the destination
            {
                // find which nearby nodes are walkable
                myNeighbours = Neighbours( myNode.x, myNode.y );
                // test each one that hasn't been tried already
                for ( i = 0, j = myNeighbours.length; i < j; i++ ) {
                    myPath = createPathNode( myNode, myNeighbours[ i ], worldWidth );
                    if ( !AStar[ myPath.value ]) {
                        // estimated cost of this particular route so far
                        myPath.g = myNode.g + distanceFunction( myNeighbours[ i ], myNode );
                        // estimated cost of entire guessed route to the destination
                        myPath.f = myPath.g + distanceFunction( myNeighbours[ i ], mypathEnd );
                        // remember this new path for testing above
                        Open.push( myPath );
                        // mark this node in the world graph as visited
                        AStar[ myPath.value ] = true;
                    }
                }
                // remember this route as having no more untested options
                Closed.push( myNode );
            }
        } // keep iterating until the Open list is empty
        return result;
    }
    // actually calculate the a-star path!
    // this returns an array of coordinates
    // that is empty if no path is possible
    return calculatePath();
};

/* internal methods */

interface Path {
    Parent: Path | null,
    value: number,
    x: number,
    y: number,
    f: number,
    g: number
};

// Node function, returns a new object with Node properties
// Used in the calculatePath function to store route costs, etc.
const createPathNode = ( Parent: Path | null, { x, y }: Point, worldWidth: number ): Path => ({
    // pointer to another Node object
    Parent,
    // array index of this Node in the world linear array
    value: x + ( y * worldWidth ),
    // the location coordinates of this Node
    x,
    y,
    // the heuristic estimated cost
    // of an entire path using this node
    f: 0,
    // the distanceFunction cost to get
    // from the starting point to this node
    g: 0
});

// distanceFunction functions
// these return how far away a point is to another

function ManhattanDistance( point: Point, target: Point ): number {
    // linear movement - no diagonals - just cardinal directions (NSEW)
    return abs( point.x - target.x ) + abs( point.y - target.y );
}

function DiagonalDistance( point: Point, target: Point ): number {
    // diagonal movement - assumes diag dist is 1, same as cardinals
    return max( abs( point.x - target.x ), abs( point.y - target.y ));
}

function EuclideanDistance( point:Point, target: Point ): number {
    // diagonals are considered a little farther than cardinal directions
    // diagonal movement using Euclide (AC = sqrt(AB^2 + BC^2))
    // where AB = x2 - x1 and BC = y2 - y1 and AC will be [x3, y3]
    return sqrt( pow( point.x - target.x, 2 ) + pow( point.y - target.y, 2 ));
}
