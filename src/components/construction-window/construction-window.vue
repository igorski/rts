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
    <div class="command-window">
        <h3>{{ $t( "building.constructionYard" )}}</h3>
        <div class="command-window__actions">
            <button
                v-t="'buildings'"
                type="button"
                class="command-window__actions__button"
                :class="{ 'command-window__actions__button--active': mode === 0 }"
                @click="mode = 0"
            ></button>
            <button
                v-t="'maintenance'"
                type="button"
                class="command-window__actions__button"
                :class="{ 'command-window__actions__button--active': mode === 1 }"
                @click="mode = 1"
            ></button>
        </div>
        <div class="command-window__items">
            <building-construction
                v-if="mode === 0"
            />
            <building-maintenance
                v-if="mode === 1"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BuildingConstruction from "./building-construction/building-construction.vue";
import BuildingMaintenance from "./building-maintenance/building-maintenance.vue";

import messages from "./messages.json";

export default defineComponent({
    i18n: { messages },
    components: {
        BuildingConstruction,
        BuildingMaintenance,
    },
    data: () => ({
        mode: 0,
    }),
});
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_variables";
@import "@/assets/styles/ui";

.command-window {
    @include commandWindow();
}
</style>
