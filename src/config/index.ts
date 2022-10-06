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

/**
 * when enabled, this will log messages related to rendering the game world
 */
export const DEBUG_UI = true && process.env.NODE_ENV !== "production";

/**
 * when enabled, this will log messages related to game Actor updates
 */
export const DEBUG_AI = true && process.env.NODE_ENV !== "production";

/**
 * whether to cache the isometric map (e.g. the main game view) in its entierity
 * this uses less CPU when rendering each frame, but comes with the following caveats:
 *
 * 1. consumes more memory
 * 2. limits map size (iOS has a maximum supported image size)
 * 3. needs rerendering of entire map when terrain changes (e.g. harvesting completes)
 *    which is unforgivably heavy when exporting canvas as PNG (as Safari struggles
 *    with rendering HTMLCanvasElement sources using drawImage())
 *
 * basically this is debug only
 */
export const PRECACHE_ISOMETRIC_MAP = false;
