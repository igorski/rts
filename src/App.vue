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
<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import CommandWindow from "@/components/command-window/command-window.vue";
import ConstructionWindow from "@/components/construction-window/construction-window.vue";
import DialogWindow from "@/components/dialog-window/dialog-window.vue";
import GameCanvas from "@/components/game-canvas/game-canvas.vue";
import HeaderMenu from "@/components/header-menu/header-menu.vue";
import Notifications from "@/components/notifications/notifications.vue";
import WorldMap from "@/components/world-map/world-map.vue";
import { useActionStore } from "@/stores/action";
import { useGameStore } from "@/stores/game";
import { useStorageStore } from "@/stores/storage";
import { useSystemStore } from "@/stores/system";
import { initCache } from "@/renderers/render-cache";
import { renderWorldMap } from "@/renderers/map-renderer";

const storageStore = useStorageStore();

const { hasSavedGame } = storeToRefs( storageStore );
const { dialog } = storeToRefs( useSystemStore() );
const { hasSelection } = storeToRefs( useActionStore() );

const loading = ref( true );

async function onGameLoad(): Promise<void> {
    await initCache();
    renderWorldMap( useGameStore().world );
    loading.value = false;
}

if ( hasSavedGame.value ) {
    storageStore.loadGame().then( onGameLoad );
} else {
    useGameStore().init().then( onGameLoad );
}
</script>

<template>
    <div class="rts">
        <header-menu />
        <div v-if="loading">Loading...</div>
        <template v-else>
            <game-canvas />
            <div class="game-ui">
                <command-window
                    v-if="hasSelection"
                />
                <construction-window />
                <world-map />
            </div>
        </template>
        <notifications />
        <dialog-window
            v-if="dialog"
            :type="dialog.type"
            :title="dialog.title"
            :message="dialog.message"
            :confirm-handler="dialog.confirm"
            :cancel-handler="dialog.cancel"
        />
    </div>
</template>

<style lang="scss">
body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
}
</style>

<style lang="scss" scoped>
.rts {
    font-weight: normal;
}

.game-ui {
    position: fixed;
    bottom: 16px;
    left: 16px;
}
</style>
