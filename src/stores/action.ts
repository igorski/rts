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
import { defineStore } from "pinia";
import { i18n } from "@/i18n";
import type { BuildingMapping } from "@/definitions/actors";
import { Building, Owner } from "@/definitions/actors";
import type { Point } from "@/definitions/math";
import { TileTypes } from "@/definitions/world-tiles";
import { unitForBuilding, buildUnitForBuilding } from "@/model/actions/unit-actions";
import type { Actor } from "@/model/factories/actor-factory";
import EffectFactory, { type Effect } from "@/model/factories/effect-factory";
import { findPath } from "@/utils/path-finder";
import { useGameStore } from "./game";
import { useSystemStore } from "./system";

export const ACTION_STORE_NAME = "action";

const DEFAULT_WALK_SPEED = 400; // ms per single step

type ActorAction = {
    value: number;
    target: string;
};

type ActionState = {
    selectedActors: Actor[];
    placableBuilding: BuildingMapping | undefined;
    placement: Point | undefined;
};

type ActionGetters = {
    hasSelection: ( state: ActionState ) => boolean;
};

type ActionActions = {
    placeBuilding( building: BuildingMapping ): void;
    completePlacement( position: Point ): void;
    updateBuildingStep( action: ActorAction ): void;
    setSelection( actors: Actor[] ): void;
    assignTarget( targetX: number, targetY: number ): void;
    setActorX( action: ActorAction ): void;
    setActorY( action: ActorAction ): void;
};

let actor: Actor;

export const useActionStore = defineStore<string, ActionState, ActionGetters, ActionActions>( ACTION_STORE_NAME, {
    state: (): ActionState => ({
        selectedActors: [],
        placableBuilding: undefined,
        placement: undefined,
    }),
    getters: {
        hasSelection: ( state: ActionState ) => state.selectedActors.length > 0,
    },
    actions: {
        placeBuilding( building: BuildingMapping ): void {
            this.placableBuilding = building;
        },
        completePlacement( position: Point ): void {
            this.placement = position;
        },
        updateBuildingStep( action: ActorAction ): void {
            const compareId = action.target;
            actor = useGameStore().actors.find(({ id }) => id === compareId ) as Actor;
            actor.completion = action.value;
            if ( action.value === 1 ) {
                const unit = unitForBuilding( actor );
                if ( unit ) {
                    useGameStore().addActor( buildUnitForBuilding( unit, actor, Owner.PLAYER ));
                }
                useSystemStore().showNotification( i18n.t( "constructionComplete" ) );
            }
        },
        setSelection( actors: Actor[] ): void {
            this.selectedActors = actors;
        },
        assignTarget( targetX: number, targetY: number ): void {
            const gameStore = useGameStore();

            targetX = Math.round( targetX );
            targetY = Math.round( targetY );

            this.selectedActors.forEach(( actor: Actor ) => {
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

                waypoints.forEach(({ x, y }, index ) => {
                    // waypoints can move between two axes at a time
                    if ( x !== lastX ) {
                        effect = EffectFactory.create({
                            store: ACTION_STORE_NAME, start: startTime, duration,
                            from: lastX, to: x, action: "setActorX", target: actor.id
                        });
                        gameStore.addEffect( effect );
                        lastX = x;
                    }
                    if ( y !== lastY ) {
                        effect = EffectFactory.create({
                            store: ACTION_STORE_NAME, start: startTime, duration,
                            from: lastY, to: y, action: "setActorY", target: actor.id
                        });
                        gameStore.addEffect( effect );
                        lastY = y;
                    }
                    if ( effect ) {
                        startTime += effect.duration; // add effects scaled duration to next start time
                    }
                });
            });
        },
        setActorX( action: ActorAction ): void {
            const compareId = action.target;
            actor = useGameStore().actors.find(({ id }) => id === compareId ) as Actor;
            if ( actor ) {
                actor.x = action.value;
            }
        },
        setActorY( action: ActorAction ): void {
            const compareId = action.target;
            actor = useGameStore().actors.find(({ id }) => id === compareId ) as Actor;
            if ( actor ) {
                actor.y = action.value;
            }
        },
    }
});
