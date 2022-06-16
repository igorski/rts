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
import PlayerFactory, { type Player } from "@/model/factories/player-factory";

export const PLAYER_STORE_NAME = "player";

type PlayerState = {
    name: string;
    credits: number;
};

type PlayerGetters = {
    player: ( state: PlayerState ) => Player;
};

type PlayerActions = {
    setPlayer( player: Player ): void;
    setName( value: string ): void;
    awardCredits( amount: number ): number;
    deductCredits( amount: number ): number;
};

export const usePlayerStore = defineStore<string, PlayerState, PlayerGetters, PlayerActions>( PLAYER_STORE_NAME, {
    state: (): PlayerState => ({
        ...PlayerFactory.create(),
    }),
    getters: {
        player: ( state: PlayerState ): Player => ({
            name: state.name,
            credits: state.credits,
        }),
    },
    actions: {
        setPlayer( player: Player ): void {
            this.name = player.name;
            this.credits = player.credits;
        },
        setName( value: string ): void {
            this.name = value;
        },
        awardCredits( amount: number ): number {
            this.credits += amount;
            return this.credits;
        },
        deductCredits( amount: number ): number {
            this.credits -= amount;
            return this.credits;
        },
    }
});
