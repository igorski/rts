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
import type { Store } from "pinia";
import type { UnitMapping } from "@/definitions/actors";
import { ActorType, Unit, Building, Owner, AiActions, getUnitMappings } from "@/definitions/actors";
import type { Point } from "@/definitions/math";
import { TileTypes } from "@/definitions/world-tiles";
import type { Actor } from "@/model/factories/actor-factory";
import ActorFactory from "@/model/factories/actor-factory";
import type { Effect } from "@/model/factories/effect-factory";
import EffectFactory from "@/model/factories/effect-factory";
import { ACTION_STORE_NAME } from "@/stores/action";
import { useGameStore } from "@/stores/game";
import { usePlayerStore } from "@/stores/player";
import { findPath } from "@/utils/path-finder";
import { findNearestPointOfType, findNearestBuildingOfClass } from "@/utils/terrain-util";

const HANDLE_AI_ACTION_COMPLETION = "handleAIActionEnd";
const DEFAULT_WALK_SPEED = 800; // ms per single step

/**
 * Whenever a Unit-type Actor is idle, the handleAI()-method is responsible
 * to give it a new task to do.
 */
export const handleAI = ( unit: Actor ): void  => {
    const gameStore = useGameStore();
    let point: Point;
    console.warn("Unit of class " + unit.subClass + " must do something.");
    switch ( unit.subClass as Unit ) {
        default:
            return;
        case Unit.HARVESTER:
            switch ( unit.aiAction ) {
                default:
                    point = findNearestPointOfType( gameStore.world, unit.x, unit.y, TileTypes.GRASS );
                    navigateToPoint( unit, point.x, point.y );
                    console.warn( "navigating to ", point);
                    break;

                case AiActions.GOTO_WAYPOINT:
                    console.warn("waypoint reached");
                    // TODO move to nearestPointOfType again just to have some movement ? :)
                    gameStore.addEffect( EffectFactory.create({
                        store: ACTION_STORE_NAME,
                        start: gameStore.gameTime,
                        duration: 5000, // TODO
                        from: 0,
                        to: 1,
                        action: "setAiActionValue",
                        callback: HANDLE_AI_ACTION_COMPLETION,
                        target: unit.id,
                    }));
                    gameStore.updateTile( Math.round( unit.x ), Math.round( unit.y ), TileTypes.SAND );
                    gameStore.setActorAiAction( unit, AiActions.HARVESTER_HARVEST );
                    break;

                case AiActions.HARVESTER_HARVEST:
                    // find nearest refinery of same owner
                    point = findNearestBuildingOfClass( gameStore.buildings, unit.x, unit.y, Building.REFINERY, unit.owner );
                    const waypoints = navigateToPoint( unit, point.x, point.y, AiActions.HARVESTER_RETURN );
                    console.warn("harvesting complete, go back home", point, "from", unit.x + " x " + unit.y + " with waypoint amount:"+waypoints.length);
                    break;

                case AiActions.HARVESTER_RETURN:
                    console.warn("harvester back! awards moneys and loop!");
                    usePlayerStore().awardCredits( Math.round( 500 * unit.aiValue ));
                    gameStore.setActorAiAction( unit, AiActions.IDLE );
                    handleAI( unit );
                    break;
            }
            break;
    }
};

/**
 * Navigates an actor to given Point by calculating the best available route.
 * Also cances all pending navigations, when existing.
 */
export const navigateToPoint = ( actor: Actor, targetX: number, targetY: number, newAction: AiActions = AiActions.GOTO_WAYPOINT ): Point[] => {
    const gameStore = useGameStore();

    // first cancel existing Actor Effects for the actions we are about to enqueue
    gameStore.removeEffectsByTargetAndAction( actor.id, [ "setActorX", "setActorY" ]);

    const maxTile = TileTypes.ROAD; // TODO determine per actor type

    let startTime = gameStore.gameTime;
    const startX  = Math.round( actor.x );
    const startY  = Math.round( actor.y );

    const waypoints = findPath( gameStore.world, startX, startY, targetX, targetY, maxTile, gameStore.buildings );
    const speed = DEFAULT_WALK_SPEED; // TODO determine per actor type

    // enqueue animated movement for each waypoint as an Effect
    const duration = speed;
    let lastX = startX;
    let lastY = startY;
    let effect: Effect;

    const lastIndex = waypoints.length - 1;
    gameStore.setActorAiAction( actor, newAction );

    waypoints.forEach(({ x, y }, index ) => {
        // on route completion, call the handleAI method to keep actions going
        const callback = index === lastIndex ? HANDLE_AI_ACTION_COMPLETION : undefined;

        // waypoints can move between two axes at a time
        if ( x !== lastX ) {
            effect = EffectFactory.create({
                store: ACTION_STORE_NAME, start: startTime, duration,
                from: lastX, to: x, action: "setActorX", target: actor.id, callback
            });
            gameStore.addEffect( effect );
            lastX = x;
        }
        if ( y !== lastY ) {
            effect = EffectFactory.create({
                store: ACTION_STORE_NAME, start: startTime, duration,
                from: lastY, to: y, action: "setActorY", target: actor.id, callback
            });
            gameStore.addEffect( effect );
            lastY = y;
        }
        if ( effect ) {
            startTime += effect.duration; // add effects scaled duration to next start time
        }
    });
    return waypoints;
};

export const canBuildUnit = ( unit: UnitMapping, buildings: Actor[] ): boolean => {
    switch ( unit.type ) {
        default:
            return false;
        case Unit.SCOUT:
            if ( !buildings.some(({ subClass }) => subClass === Building.BARRACKS )) {
                return false;
            }
            break;
        case Unit.HARVESTER:
            if ( !buildings.some(({ subClass }) => subClass === Building.REFINERY )) {
                return false;
            }
            break;
    }
    return true;
};

/**
 * Returns the unit associated with a building (for instance a
 * refinery comes with a free harvester), can be undefined.
 */
export const unitForBuilding = ( building: Actor ): UnitMapping | undefined => {
    let type: Unit;
    switch ( building.subClass ) {
        default:
            return undefined;
        case Building.REFINERY:
            type = Unit.HARVESTER;
            break;
    }
    return getUnitMappings().find( unit => type === unit.type );
};

/**
 * Creates a Unit Actor associated with a Building Actor
 */
export const buildUnitForBuilding = ( unit: UnitMapping, building: Actor, owner: Owner = Owner.AI ): Actor => {
    const x = building.x + building.width;
    const y = building.y + building.height;

    return ActorFactory.create({
        type: ActorType.UNIT,
        subClass: unit.type as Unit,
        owner,
        x, y,
        width: unit.width,
        height: unit.height
    });
};
