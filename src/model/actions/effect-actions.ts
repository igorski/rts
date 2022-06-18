import type { Store } from "pinia";
import type { Effect } from "@/model/factories/effect-factory";
import { ACTION_STORE_NAME, useActionStore } from "@/stores/action";
import { CAMERA_STORE_NAME, useCameraStore } from "@/stores/camera";
import { GAME_STORE_NAME, useGameStore } from "@/stores/game";

let actionStore: Store | undefined;
let cameraStore: Store | undefined;
let gameStore: Store | undefined;
let storeRef: Store | undefined;

/**
 * Invoked by the game loop whenever time passes in the simulation.
 *
 * @param {Effect} effect the Effect to process
 * @param {number} currentTime current game time in milliseconds
 * @return {boolean} whether the Effect has completed its total duration
 */
export const updateEffect = ( effect: Effect, currentTime: number ): boolean => {
    const elapsed = currentTime - effect.start;

    if ( elapsed < 0 ) {
        return false; // Effect is scheduled ahead of start time
    }

    const { store, action, increment, target } = effect;

    // get the store the Effect operates on

    switch ( store ) {
        default:
            throw new Error( `Unknown store "${store}"` );

        case ACTION_STORE_NAME:
            if ( actionStore === undefined ) {
                actionStore = useActionStore();
            }
            storeRef = actionStore;
            break;

        case CAMERA_STORE_NAME:
            if ( cameraStore === undefined ) {
                cameraStore = useCameraStore();
            }
            storeRef = cameraStore;
            break;

        case GAME_STORE_NAME:
            if ( gameStore === undefined ) {
                gameStore = useGameStore();
            }
            storeRef = gameStore;
            break;
    }

    // Effect complete ?

    if ( elapsed >= effect.duration ) {
        if ( typeof action === "string" ) {
            // @ts-expect-error using string name to invoke function
            storeRef![ action ]( target ? { value: effect.to, target } : effect.to );
        }

        if ( typeof effect.callback === "string" ) {
            // @ts-expect-error using string name to invoke function
            storeRef![ effect.callback ]( target );
        }
        return true;
    }

    // Effect still in progress, update current state

    if ( typeof action === "string" ) {
        const value = effect.from + ( increment * elapsed );
        // @ts-expect-error using string name to invoke function
        storeRef![ action ]( target ? { value, target } : value );
    }
    return false;
};
