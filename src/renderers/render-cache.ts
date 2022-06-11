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
import { loader } from "zcanvas";

const ASSET_FOLDER: string = "./assets/sprites/";
const ASSETS = {
    TILES: "tiles.png"
};

type Cache = {
    sprites: {
        [key: string]: HTMLImageElement;
    },
    map: {
        flat: HTMLCanvasElement;
        isometric: HTMLCanvasElement;
    }
};

const CACHE: Cache = {
    sprites: {
        TILES: new Image()
    },
    map: {
        flat: document.createElement( "canvas" ),
        isometric: document.createElement( "canvas" )
    }
};
export default CACHE;

export const initCache = (): Promise<void> => {
    return new Promise( async ( resolve, reject ) => {
        const entries = Object.entries( ASSETS );
        for ( let i = 0; i < entries.length; ++i ) {
            const [ key, path ] = entries[ i ];
            try {
                await loader.loadImage( `${ASSET_FOLDER}${path}`, CACHE.sprites[ key ]);
            } catch ( e ) {
                reject( e );
            }
        }
        resolve();
    });
}
