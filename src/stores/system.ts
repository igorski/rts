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
import { amountOfTilesInWidth, amountOfTilesInHeight } from "@/definitions/world-tiles";

export const SYSTEM_STORE_NAME = "system";

type DialogRequest = {
    type?: string;
    title?: string;
    message?: string;
    confirm?: () => void;
    cancel?: () => void;
};

type SystemState = {
    dialog? : DialogRequest;
    statusMessage?: string;
    notifications: string[];
    screenSize: {
        width: number;
        height: number;
        tilesInWidth: number;
        tilesInHeight: number;
    };
};

type SystemGetters = {

};

type SystemActions = {
    setScreenSize: ( width: number, height: number ) => void;
    openDialog: ( request: DialogRequest ) => void;
    showError: ( message: string ) => void;
    closeDialog: () => void;
    setMessage: ( message: string ) => void;
    clearMessage: () => void;
    showNotification: ( message: string ) => void;
    clearNotifications: () => void;
};

export const useSystemStore = defineStore<string, SystemState, SystemGetters, SystemActions>( SYSTEM_STORE_NAME, {
    state: (): SystemState => ({
        dialog: undefined,
        statusMessage: undefined,
        notifications: [],
        screenSize: {
            width: 0,
            height: 0,
            tilesInWidth: 0,
            tilesInHeight: 0,
        },
    }),
    getters: {

    },
    actions: {
        setScreenSize( width: number, height: number ): void {
            this.screenSize.width = width;
            this.screenSize.height = height;

            const tilesInWidth  = amountOfTilesInWidth( width );
            const tilesInHeight = amountOfTilesInHeight( height );

            // it's hip to be square (force 1 x 1 ratio)
            this.screenSize.tilesInWidth  = Math.min( tilesInWidth, tilesInHeight );
            this.screenSize.tilesInHeight = Math.min( tilesInWidth, tilesInHeight );
        },
        openDialog({ type = "info", title = "", message = "", confirm = undefined, cancel = undefined }: DialogRequest ): void {
            this.dialog = { type, title , message, confirm, cancel };
        },
        showError( message: string ): void {
            this.openDialog({ type: "error", title: "An error has occurred", message });
        },
        closeDialog(): void {
            this.dialog = undefined;
        },
        setMessage( message: string ): void {
            this.statusMessage = message;
        },
        clearMessage(): void {
            this.statusMessage = undefined;
        },
        showNotification( message: string ): void {
            this.notifications.push( message );
        },
        clearNotifications(): void {
            this.notifications.length = 0;
        },
    }
});
