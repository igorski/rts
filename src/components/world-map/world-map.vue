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
    <div class="world-map">
        <div
            ref="mapContainer"
            class="world-map__container"
        ></div>
        <div class="world-map__camera-position" :style="cameraPosition"></div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapState, mapActions } from "pinia";
import { CVS_2D_MAGNIFIER } from "@/renderers/environment-renderer";
import CACHE from "@/renderers/render-cache";
import { useCameraStore } from "@/stores/camera";

export default defineComponent({
    computed: {
        ...mapState( useCameraStore, [
            "cameraX",
            "cameraY",
        ]),
        cameraPosition() {
            // map getters from Pinia store not recognized as member instances when used in string literal
            const x = this.cameraX as number;
            const y = this.cameraY as number;
            return {
                left: `${x * CVS_2D_MAGNIFIER}px`,
                top : `${y * CVS_2D_MAGNIFIER}px`
            };
        },
    },
    mounted(): void {
        ( this.$refs.mapContainer as HTMLElement ).appendChild( CACHE.map.flat );
    },
});
</script>

<style lang="scss" scoped>
.world-map {
    position: relative;

    &__container {
        border: 2px solid #000;
        border-radius: 7px;
        overflow: hidden;
    }

    &__camera-position {
        position: absolute;
        background-color: red;
        border-color: 1px solid black;
        width: 2px;
        height: 2px;
    }
}
</style>
