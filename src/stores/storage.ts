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
// @ts-expect-error unknown type
import storage from "store/dist/store.modern";
import GameFactory from "@/model/factories/game-factory";
import { useGameStore } from "./game";
import { usePlayerStore } from "./player";

export const STORAGE_STORE_NAME = "storage";
const STORAGE_KEY = "rtsGame";

type StorageState = {

};

type StorageGetters = {
    hasSavedGame: () => boolean,
};

type StorageActions = {
    loadGame: () => Promise<boolean>,
    saveGame: () => Promise<void>,
    resetGame: () => void,
};

export const useStorageStore = defineStore<string, StorageState, StorageGetters, StorageActions>( STORAGE_STORE_NAME, {
    state: (): StorageState => ({

    }),
    getters: {
        hasSavedGame: (): boolean => !!storage.get( STORAGE_KEY ),
    },
    actions: {
        async loadGame(): Promise<boolean> {
            return new Promise( resolve => {
                const data = storage.get( STORAGE_KEY );
                try {
                    const game = GameFactory.deserialize( data );

                    const gameStore = useGameStore();
                    gameStore.setGame( game! );
                    gameStore.setLastRender( window.performance.now() );

                    const playerStore = usePlayerStore();
                    playerStore.setPlayer( game!.player );
                } catch {
                    // likely corrupted or really outdated format
                    this.resetGame();
                    resolve( false );
                }
                resolve( true );
            });
        },
        async saveGame(): Promise<void> {
            const gameStore = useGameStore();
            const playerStore = usePlayerStore();

            const data = GameFactory.serialize({
                created: gameStore.created,
                world: gameStore.world,
                player: playerStore.player,
                effects: gameStore.effects
            });
            storage.set( STORAGE_KEY, data );

            return Promise.resolve();
        },
        resetGame(): void {
            storage.remove( STORAGE_KEY );
        },
    }
});
