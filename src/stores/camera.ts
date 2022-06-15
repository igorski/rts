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
import { CameraActions } from "@/definitions/camera-actions";
import type { EnvironmentDef } from "@/definitions/world-tiles";
import WorldFactory from "@/model/factories/world-factory";
import { useGameStore } from "./game";

export const CAMERA_STORE_NAME = "camera";

type CameraState = {

}

type CameraGetters = {
    cameraX: () => number;
    cameraY: () => number;
}

type CameraStoreActions = {
    setCameraX: ( value: number ) => void;
    setCameraY: ( value: number ) => void;
    moveCamera: ( direction: CameraActions ) => void;
}

export const useCameraStore = defineStore<string, CameraState, CameraGetters, CameraStoreActions>( CAMERA_STORE_NAME, {
    state: (): CameraState => ({

    }),
    getters: {
        cameraX: (): number => {
            return useGameStore().world.x;
        },
        cameraY: (): number => {
            return useGameStore().world.y;
        }
    },
    actions: {
        setCameraX( value: number ): void {
            const game = useGameStore();
            game.world.x = Math.max( 0, Math.min( game.world.width, value ));
        },
        setCameraY( value: number ): void {
            const game = useGameStore();
            game.world.y = Math.max( 0, Math.min( game.world.height, value ));
        },
        moveCamera( direction: CameraActions, speed: number = 1 ): void {
            switch ( direction ) {
                default:
                    break;
                case CameraActions.PAN_LEFT:
                    this.setCameraX( this.cameraX - speed );
                    this.setCameraY( this.cameraY + speed );
                    break;
                case CameraActions.PAN_RIGHT:
                    this.setCameraX( this.cameraX + speed );
                    this.setCameraY( this.cameraY - speed );
                    break;
                case CameraActions.PAN_UP:
                    this.setCameraY( this.cameraY - speed );
                    this.setCameraX( this.cameraX - speed );
                    break;
                case CameraActions.PAN_DOWN:
                    this.setCameraY( this.cameraY + speed );
                    this.setCameraX( this.cameraX + speed );
                    break;
                case CameraActions.PAN_LEFT_AND_UP:
                    this.setCameraX( this.cameraX - speed );
                    break;
                case CameraActions.PAN_LEFT_AND_DOWN:
                    this.setCameraY( this.cameraY + speed );
                    break;
                case CameraActions.PAN_RIGHT_AND_UP:
                    this.setCameraY( this.cameraY - speed );
                    break;
                case CameraActions.PAN_RIGHT_AND_DOWN:
                    this.setCameraX( this.cameraX + speed );
                    break;
            }
        },
    }
});
