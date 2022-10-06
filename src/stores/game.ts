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
import { ActorType, Building } from "@/definitions/actors";
import type { AiActions } from "@/definitions/actors";
import type { EnvironmentDef } from "@/definitions/world-tiles";
import type { TileTypes } from "@/definitions/world-tiles";
import { updateEffect } from "@/model/actions/effect-actions";
import { handleAI } from "@/model/actions/unit-actions";
import type { Actor } from "@/model/factories/actor-factory";
import type { Effect } from "@/model/factories/effect-factory";
import GameFactory, { type Game } from "@/model/factories/game-factory";
import { renderWorldMap } from "@/renderers/environment-renderer";
import { coordinateToIndex } from "@/utils/terrain-util";

export const GAME_STORE_NAME = "game";

export enum GameStates {
    IDLE,
    ACTIVE,
    GAME_OVER
};

type GameState = {
    world: EnvironmentDef;
    created: number,
    gameState: GameStates;
    lastRender: number;
    gameTime: number;
    actors: Actor[];
    effects: Effect[];
};

type GameGetters = {
    gameActors: ( state: GameState ) => Actor[],
    buildings: ( state: GameState ) => Actor[],
    canBuild: ( state: GameState ) => boolean,
};

type GameActions = {
    init(): Promise<void>;
    setGame( game: Game ): void;
    setGameState( value: GameStates ): void;
    setGameTime( valueInMs: number ): void;
    advanceGameTime( valueInMs: number ): void;
    setLastRender( timestamp: number ): void;
    addActor( actor: Actor ): void;
    removeActor( actor: Actor ): void;
    setActorAiAction( actor: Actor, action: AiActions ): void;
    addEffect( effect: Effect ): void;
    removeEffect( effect: Effect ): void;
    removeEffectsByAction( actions?: string[] | string ): void;
    removeEffectsByCallback( callbacks?: string[] | string ): void;
    removeEffectsByTarget( target: any ): void;
    removeEffectsByTargetAndAction( target: any, actions?: string[] | string ): void;
    update( timestamp: number ): void;
    updateTile( x: number, y: number, newType: TileTypes ): void;
};

export const useGameStore = defineStore<string, GameState, GameGetters, GameActions>( GAME_STORE_NAME, {
    state: (): GameState => ({
        world : {} as EnvironmentDef,
        created: 0,
        gameState : GameStates.ACTIVE,
        lastRender : 0,
        gameTime : 0,
        actors: [],
        effects : [],
    }),
    getters: {
        gameActors: ( state: GameState ): Actor[] => state.actors,
        buildings: ( state: GameState ): Actor[] => state.actors.filter(({ type }) => type === ActorType.BUILDING ),
        canBuild: ( state: GameState ): boolean => !!state.actors.find(({ subClass }) => subClass === Building.CONSTRUCTION_YARD ),
    },
    actions: {
        init(): Promise<void> {
            // TODO load saved game, when existing

            this.setGame( GameFactory.create() );

            return Promise.resolve();
        },
        setGame( game: Game ): void {
            this.world    = game.world;
            this.gameTime = game.gameTime;
            this.created  = game.created;
            this.actors   = game.actors;
            this.effects  = game.effects;
        },
        setGameState( value: GameStates ): void {
            this.gameState = value;
        },
        setGameTime( valueInMs: number ): void {
            this.gameTime = valueInMs;
        },
        advanceGameTime( valueInMs: number ): void {
            this.gameTime += valueInMs;
        },
        setLastRender( timestamp: number ): void {
            this.lastRender = timestamp;
        },
        addActor( actor: Actor ): void {
            this.actors.push( actor );
            if ( actor.type === ActorType.UNIT ) {
                handleAI( actor );
            }
        },
        removeActor( actor: Actor ): void {
            this.actors.splice( this.actors.indexOf( actor ), 1 );
        },
        setActorAiAction( actor: Actor, action: AiActions ): void {
            actor.aiAction = action;
        },
        addEffect( effect: Effect ): void {
            if ( !this.effects.includes( effect )) {
                this.effects.push( effect );
            }
        },
        removeEffect( effect: Effect ): void {
            const idx = this.effects.indexOf( effect );
            if ( idx >= 0 ) this.effects.splice( idx, 1 );
        },
        removeEffectsByAction( actions: string[] | string = [] ): void {
            this.effects = this.effects.filter(({ action }) => !actions.includes( action as string ));
        },
        removeEffectsByCallback( callbacks: string[] | string = [] ): void {
            this.effects = this.effects.filter(({ callback }) => !callbacks.includes( callback as string ));
        },
        removeEffectsByTarget( target: any ): void {
            this.effects = this.effects.filter( effect => effect.target !== target );
        },
        removeEffectsByTargetAndAction( target: any, actions: string[] | string = [] ): void {
            this.effects = this.effects.filter( effect => {
                return effect.target !== target || !actions.includes( effect.action as string );
            });
        },
        update( timestamp: number ): void {
            if ( this.gameState !== GameStates.ACTIVE ) {
                return;
            }
            if ( timestamp === 0 ) {
                timestamp = performance.now(); // zCanvas initial render default
            }
            // advance game time (values are in milliseconds relative to the game's time scale)
            const delta = timestamp - this.lastRender;
            this.advanceGameTime( delta );

            // perform clock related actions
            const gameTimestamp = this.gameTime;

            // update the effects
            this.effects.forEach( effect => {
                if ( updateEffect( effect, gameTimestamp )) {
                    this.removeEffect( effect );
                }
            });
            // update last render timestamp
            this.setLastRender( timestamp );
        },
        updateTile( x: number, y: number, newType: TileTypes ): void {
            const index = coordinateToIndex( x, y, this.world );
            const tile = this.world.terrain[ index ];
            if ( tile ) {
                tile.type = newType;
                // TODO: can we optimize this to render only at the tile pos ?
                renderWorldMap( this.world, this.gameActors );
            } else {
                console.warn( `could not find tile at ${x}x${y} ???` );
            }
        },
    }
});
