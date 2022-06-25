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
import { Building, AiActions } from "@/definitions/actors";
import type { Point } from "@/definitions/math";
import { TileTypes } from "@/definitions/world-tiles";
import type { Actor } from "@/model/factories/actor-factory";
import EffectFactory from "@/model/factories/effect-factory";
import { HANDLE_AI_ACTION_COMPLETION, handleAI, navigateToPoint } from "@/model/actions/unit-actions";
import { ACTION_STORE_NAME } from "@/stores/action";
import { useGameStore } from "@/stores/game";
import { usePlayerStore } from "@/stores/player";
import { findNearestPointOfType, findNearestBuildingOfClass, coordinateToIndex } from "@/utils/terrain-util";

const DEBUG = process.env.NODE_ENV !== "production";

// the amount of progress each individual harvesting step can reach
const FILL_RATE = 0.25;

export const handleHarvesterAI = ( unit: Actor ): void => {
    const gameStore = useGameStore();
    let point: Point;

    const curPos: Point = { x: Math.round( unit.x ), y: Math.round( unit.y ) };

    switch ( unit.aiAction ) {
        default:
            point = findNearestPointOfType( gameStore.world, curPos.x, curPos.y, TileTypes.GRASS );
            navigateToPoint( unit, point.x, point.y );
            break;

        case AiActions.GOTO_WAYPOINT:
            if ( DEBUG ) {
                console.warn( `Unit ${unit.id} reached waypoint.` );
            }
            // if current position is not a harvestable area, reset action (harvester will navigate again)
            if ( gameStore.world.terrain[ coordinateToIndex( curPos.x, curPos.y, gameStore.world )].type !== TileTypes.GRASS ) {
                return resetAction( unit );
            }
            gameStore.addEffect( EffectFactory.create({
                store: ACTION_STORE_NAME,
                start: gameStore.gameTime,
                duration: 5000, // TODO
                from: unit.aiValue,
                to: unit.aiValue + FILL_RATE,
                action: "setAiActionValue",
                callback: HANDLE_AI_ACTION_COMPLETION,
                target: unit.id,
            }));
            gameStore.setActorAiAction( unit, AiActions.HARVESTER_HARVEST );
            break;

        case AiActions.HARVESTER_HARVEST:
            // current tile is now depleted of "harvestable goodness"
            gameStore.updateTile( curPos.x, curPos.y, TileTypes.SAND );
            // check filled status of harvester, when full return to base, if not find next area
            const curFillValue = unit.aiValue;
            if ( unit.aiValue >= 1 ) {
                // find nearest refinery of units owner
                point = findNearestBuildingOfClass( gameStore.buildings, curPos.x, curPos.y, Building.REFINERY, unit.owner );
                navigateToPoint( unit, point.x, point.y, AiActions.HARVESTER_RETURN );
            } else {
                resetAction( unit );
            }
            break;

        case AiActions.HARVESTER_RETURN:
            usePlayerStore().awardCredits( Math.round( 500 * Math.max( 1, unit.aiValue )));
            gameStore.setActorAiAction( unit, AiActions.IDLE );
            // slight delay after which AI operations will resume from beginning
            gameStore.addEffect( EffectFactory.create({
                store: ACTION_STORE_NAME,
                start: gameStore.gameTime,
                duration: 2500,
                from: 1,
                to: 0,
                action: "setAiActionValue",
                callback: HANDLE_AI_ACTION_COMPLETION,
                target: unit.id,
            }));
            break;
    }
};

/* internal methods */

function resetAction( unit: Actor ): void {
    useGameStore().setActorAiAction( unit, AiActions.IDLE );
    handleAI( unit );
}
