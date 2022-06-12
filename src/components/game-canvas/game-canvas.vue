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
<template>
    <div
        ref="canvasContainer"
        class="world-renderer"
    ></div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { canvas } from "zcanvas";
import { mapState, mapActions } from "pinia";
import type { EnvironmentDef, TileDef } from "@/definitions/world-tiles";
import { TILE_SIZE } from "@/definitions/world-tiles";
import { initCache } from "@/renderers/render-cache";
import { renderWorldMap } from "@/renderers/map-renderer";
import GameRenderer from "@/renderers/game-renderer";
import WorldMap from "@/components/world-map/world-map.vue";
import { useGameStore } from "@/stores/game";

const MIN_AMOUNT_OF_TILES = 5; // minimum amount of tiles visible on the dominant axis of the screen
const renderer = new GameRenderer();
let zCanvasInstance: canvas;
let keyHandler: ( e: KeyboardEvent ) => void;
let handlers: { event: string, callback: EventListenerOrEventListenerObject }[] = [];

export default defineComponent({
    components: {
        WorldMap,
    },
    computed: {
        ...mapState( useGameStore, [
            "world",
            "cameraX",
            "cameraY",
        ]),
    },
    async mounted(): Promise<void> {
        /**
         * Construct zCanvas instance to render the game world. The zCanvas
         * also maintains the game loop that will update the world prior to each render cycle.
         */
        zCanvasInstance = new canvas({
            width: window.innerWidth,
            height: window.innerHeight,
            animate: true,
            smoothing: true,
            fps: 60,
            onUpdate: this.updateGame.bind( this ),
            backgroundColor: "#0000FF"
        });

        // render world map
        await initCache();
        renderWorldMap( this.world );

        // attach event handlers
        const resizeEvent = "onorientationchange" in window ? "orientationchange" : "resize";
        handlers.push({ event: resizeEvent, callback: this.handleResize.bind( this ) });
        handlers.forEach(({ event, callback }) => {
            window.addEventListener( event, callback );
        });

        // attach renderers and insert into page
        zCanvasInstance.insertInPage( this.$refs.canvasContainer as HTMLElement );
        zCanvasInstance.addChild( renderer );

        renderer.setWorld( this.world );
        this.handleResize();

        // keyboard control : todo put somewhere else
        keyHandler = this.handleKeyDown.bind( this );
        document.body.addEventListener( "keydown", keyHandler );
    },
    destroyed(): void {
        handlers.forEach(({ event, callback }) => {
            window.removeEventListener( event, callback );
        });
        handlers.length = 0;
        zCanvasInstance.dispose();
        document.body.removeEventListener( "keydown", keyHandler );
    },
    methods: {
        ...mapActions( useGameStore, [
            "setCameraX",
            "setCameraY",
        ]),
        handleResize(): void {
            const { clientWidth, clientHeight } = document.documentElement;
            const tileWidth  = TILE_SIZE;
            const tileHeight = TILE_SIZE;

            let tilesInWidth, tilesInHeight;

            if ( clientWidth > clientHeight ) {
                // landscape (like in the 80's!)
                tilesInHeight = tileHeight * MIN_AMOUNT_OF_TILES;
                tilesInWidth  = Math.round(( clientWidth / clientHeight ) * tilesInHeight );
            } else {
                // portrait (ah, a modern phone...)
                tilesInWidth  = tileWidth * MIN_AMOUNT_OF_TILES;
                tilesInHeight = Math.round(( clientHeight / clientWidth ) * tilesInWidth );
            }
            console.warn(clientWidth,clientHeight,tilesInWidth,tilesInHeight);
            zCanvasInstance.setDimensions( tilesInWidth, tilesInHeight );
            zCanvasInstance.scale( clientWidth / tilesInWidth, clientHeight / tilesInHeight );
            renderer.setTileDimensions( tilesInWidth, tilesInHeight );
        },
        updateGame(): void {

        },
        handleKeyDown( e: KeyboardEvent ): void {
            switch ( e.key ) {
                default:
                    return;
                case "ArrowLeft":
                    this.setCameraX( this.cameraX - 1 );
                    this.setCameraY( this.cameraY + 1 );
                    break;
                case "ArrowRight":
                    this.setCameraX( this.cameraX + 1 );
                    this.setCameraY( this.cameraY - 1 );
                    break;
                case "ArrowUp":
                    this.setCameraY( this.cameraY - 1 );
                    this.setCameraX( this.cameraX - 1 );
                    break;
                case "ArrowDown":
                    this.setCameraY( this.cameraY + 1 );
                    this.setCameraX( this.cameraX + 1 );
                    break;
            }
            e.preventDefault();
        }
    }
});
</script>
