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
export enum TileTypes {
    GROUND,
    GRASS,
    SAND,
    ROAD,
    WATER,
    MOUNTAIN,
    TREE,
};

export interface EnvironmentDef {
    x: number;
    y: number;
    width: number;
    height: number;
    terrain: TileDef[];
};

export interface TileDef {
    x: number;
    y: number;
    height: number;
    type: TileTypes;
};

export const TILE_SIZE: number = 128;

// 2D coordinates mapped to isometric projection

export const TILE_WIDTH_HALF  = TILE_SIZE / 2;
export const TILE_HEIGHT_HALF = TILE_SIZE / 2;

export const X_DISPLACEMENT_HOR = 1 * TILE_SIZE / 2;
export const X_DISPLACEMENT_VER = 0.5 * TILE_SIZE / 2;
export const Y_DISPLACEMENT_HOR = -1 * TILE_SIZE / 2;
export const Y_DISPLACEMENT_VER = 0.5 * TILE_SIZE / 2;

// convenience methods to convert 2D x, y to isometric space

export const horPosition = ( x: number, y: number ): number => ( x * X_DISPLACEMENT_HOR + y * Y_DISPLACEMENT_HOR );
export const verPosition = ( x: number, y: number ): number => ( x * X_DISPLACEMENT_VER + y * Y_DISPLACEMENT_VER );

export const amountOfTilesInWidth = ( width: number ): number => width  / X_DISPLACEMENT_HOR;
export const amountOfTilesInHeight = ( height: number ): number => height / -Y_DISPLACEMENT_HOR;
