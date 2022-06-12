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
import { CameraActions } from "@/definitions/camera-actions";

export default class HitBox {
    private left: boolean = false;
    private top: boolean = false;
    private right: boolean = false;
    private bottom: boolean = false;

    toCameraAction(): CameraActions
    {
        let action = CameraActions.IDLE;

        if ( this.left ) {
            if ( this.top ) {
                action = CameraActions.PAN_LEFT_AND_UP;
            } else if ( this.bottom ) {
                action = CameraActions.PAN_LEFT_AND_DOWN;
            } else {
                action = CameraActions.PAN_LEFT;
            }
        } else if ( this.right ) {
            if ( this.top ) {
                action = CameraActions.PAN_RIGHT_AND_UP;
            } else if ( this.bottom ) {
                action = CameraActions.PAN_RIGHT_AND_DOWN;
            } else {
                action = CameraActions.PAN_RIGHT;
            }
        }

        if ( action === CameraActions.IDLE ) {
            if ( this.top ) {
                action = CameraActions.PAN_UP;
            } else if ( this.bottom ) {
                action = CameraActions.PAN_DOWN;
            }
        }
        return action;
    }

    setHorizontal( isLeft: boolean ): void
    {
        if ( isLeft ) {
            this.left  = true;
            this.right = false;
        } else {
            this.left  = false;
            this.right = true;
        }
    }

    setVertical( isTop: boolean ):void
    {
        if ( isTop ) {
            this.top    = true;
            this.bottom = false;
        } else {
            this.top    = false;
            this.bottom = true;
        }
    }

    resetHorizontal(): void
    {
        this.left  = false;
        this.right = false;
    }

    resetVertical(): void
    {
        this.top    = false;
        this.bottom = false;
    }

    reset(): void
    {
        this.resetHorizontal();
        this.resetVertical();
    }
};
