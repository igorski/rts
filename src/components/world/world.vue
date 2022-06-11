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
    <div class="world-ui">
        <div class="world-map">
            <div
                ref="mapContainer"
                class="world-map"
            ></div>
            <div class="player-position" :style="{ left: `${world.x}px`, top: `${world.y}px` }"></div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { canvas } from "zcanvas";
import { mapState, mapActions } from "pinia";
import { useWorldStore } from "../../stores/world";
import type { EnvironmentDef, TileDef } from "@/definitions/world-tiles";
import { TILE_SIZE } from "@/definitions/world-tiles";
import CACHE, { initCache } from "@/renderers/render-cache";
import { renderWorldMap } from "@/renderers/map-renderer";
import WorldRenderer from "@/renderers/world-renderer";

const MIN_AMOUNT_OF_TILES = 5; // minimum amount of tiles visible on the dominant axis of the screen
const renderer = new WorldRenderer();
let zCanvasInstance: canvas;
let handlers: { event: string, callback: EventListenerOrEventListenerObject }[] = [];

export default defineComponent({
    computed: {
        ...mapState( useWorldStore, [
            "world",
            "playerX",
            "playerY",
        ]),
    },
    async mounted(): void {
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
        console.warn( 'Render world' );
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
        this.keyHandler = this.handleKeyDown.bind( this );
        document.body.addEventListener( "keydown", this.keyHandler );

        this.$refs.mapContainer.appendChild( CACHE.map.flat );
    },
    destroyed(): void {
        handlers.forEach(({ event, callback }) => {
            window.removeEventListener( event, callback );
        });
        handlers.length = 0;
        zCanvasInstance.dispose();
        document.body.removeEventListener( "keydown", this.keyHandler );
    },
    methods: {
        ...mapActions( useWorldStore, [
            "setPlayerX",
            "setPlayerY",
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
            // TODO : useWorldStore() should be cached
            switch ( e.key ) {
                default:
                    return;
                case "ArrowLeft":
                    this.setPlayerX( this.playerX( useWorldStore()) - 1 );
                    this.setPlayerY( this.playerY( useWorldStore()) + 1 );
                    break;
                case "ArrowRight":
                    this.setPlayerX( this.playerX( useWorldStore()) + 1 );
                    this.setPlayerY( this.playerY( useWorldStore()) - 1 );
                    break;
                case "ArrowUp":
                    this.setPlayerY( this.playerY( useWorldStore()) - 1 );
                    this.setPlayerX( this.playerX( useWorldStore()) - 1 );
                    break;
                case "ArrowDown":
                    this.setPlayerY( this.playerY( useWorldStore()) + 1 );
                    this.setPlayerX( this.playerX( useWorldStore()) + 1 );
                    break;
            }
            e.preventDefault();
        }
    }
});
</script>

<style scoped>
.world-ui {
    position: fixed;
    bottom: 16px;
    left: 16px;
}

.world-map {
    position: relative;
}

.player-position {
    position: absolute;
    background-color: red;
    width: 1px;
    height: 1px;
}
</style>
