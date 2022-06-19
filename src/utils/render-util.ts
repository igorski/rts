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
import type { Actor } from "@/model/factories/actor-factory";

const { ceil } = Math;

export const sortByDepth = ( actors: Actor[] ): void => {
    return actors.sort(( actor1: Actor, actor2: Actor ): number => {
        const actor2right = ceil( actor2.x + ( actor2.width - 1 ));
        if ( ceil( actor1.x ) <= ceil( actor2.x ) && !( ceil( actor1.x ) >= actor2right )) {
            return ceil( actor1.y ) <= ceil( actor2.y ) ? -1 : 1;
        }
        if ( ceil( actor1.x ) <= actor2right && ceil( actor1.y ) < ceil( actor2.y )) {
            return -1;
        }
        return 0;
    });
};
