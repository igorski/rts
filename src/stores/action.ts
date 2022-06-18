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
import { TileTypes } from "@/definitions/world-tiles";
import type { Actor } from "@/model/factories/actor-factory";
import EffectFactory, { type Effect } from "@/model/factories/effect-factory";
import { findPath } from "@/utils/path-finder";
import { useGameStore } from "./game";

export const ACTION_STORE_NAME = "action";

const DEFAULT_WALK_SPEED = 400; // ms per single step

type ActorAction = {
    value: number;
    target: { id: string, property: string };
};

type ActionState = {
    selectedActors: Actor[];
};

type ActionGetters = {
    hasSelection: ( state: ActionState ) => boolean;
};

type ActionActions = {
    setSelection( actors: Actor[] ): void;
    assignTarget( targetX: number, targetY: number ): void;
    setActorProperty( action: ActorAction ): void;
};

let actor: Actor;

export const useActionStore = defineStore<string, ActionState, ActionGetters, ActionActions>( ACTION_STORE_NAME, {
    state: (): ActionState => ({
        selectedActors: [],
    }),
    getters: {
        hasSelection: ( state: ActionState ) => state.selectedActors.length > 0,
    },
    actions: {
        setSelection( actors: Actor[] ): void {
            this.selectedActors = actors;
        },
        assignTarget( targetX: number, targetY: number ): void {
            const gameStore = useGameStore();

            targetX = Math.round( targetX );
            targetY = Math.round( targetY );

            this.selectedActors.forEach(( actor: Actor ) => {
                const maxTile = TileTypes.ROAD; // TODO determine per actor type

                let startTime = gameStore.gameTime;
                const startX  = Math.round( actor.x );
                const startY  = Math.round( actor.y );

                const waypoints = findPath( gameStore.world, startX, startY, targetX, targetY, maxTile );
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
                            from: lastX, to: x, action: "setActorProperty", target: { id: actor.id, property: "x" }
                        });
                        gameStore.addEffect( effect );
                        lastX = x;
                    }
                    if ( y !== lastY ) {
                        effect = EffectFactory.create({
                            store: ACTION_STORE_NAME, start: startTime, duration,
                            from: lastY, to: y, action: "setActorProperty", target: { id: actor.id, property: "y" }
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
        setActorProperty( action: ActorAction ): void {
            const compareId = action.target.id;
            actor = useGameStore().actors.find(({ id }) => id === compareId ) as Actor;
            if ( actor ) {
                // @ts-expect-error using string name to access property
                actor[ action.target.property ] = action.value;
            }
        },
    }
});
