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
import type { EnvironmentDef } from "@/definitions/world-tiles";
import WorldFactory from "@/model/factories/world-factory";

interface STATE {
    world: EnvironmentDef;
}

export const useWorldStore = defineStore<string, STATE>( "world", {
    state: (): STATE => ({
        world : WorldFactory.populate( WorldFactory.create())
    }),
    getters: {
        playerX: number => ( state: STATE ) => state.world.x,
        playerY: number => ( state: STATE ) => state.world.y,
    },
    actions: {
        setPlayerX( value: number ): void {
            this.world.x = Math.max( 0, Math.min( this.world.width, value ));
        },
        setPlayerY( value: number ): void {
            this.world.y = Math.max( 0, Math.min( this.world.height, value ));
        },
    }
});
