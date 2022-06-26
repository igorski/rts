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
    <button
        v-t="'repair'"
        type="button"
        class="command-window__actions__button"
        :disabled="!hasDamage"
        @click="repairBuilding()"
    ></button>
    <button
        v-t="'sell'"
        type="button"
        class="command-window__actions__button"
        @click="sellBuilding()"
    ></button>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapState, mapActions } from "pinia";
import { getBuildingMappings } from "@/definitions/actors";
import { useActionStore } from "@/stores/action";
import { useGameStore } from "@/stores/game";
import { usePlayerStore } from "@/stores/player";
import { useSystemStore } from "@/stores/system";

import messages from "./messages.json";

export default defineComponent({
    i18n: { messages },
    computed: {
        ...mapState( useActionStore, [
            "selectedActors",
        ]),
        building() {
            return this.selectedActors[ 0 ];
        },
        hasDamage(): boolean {
            return this.building.energy < this.building.maxEnergy;
        },
    },
    methods: {
        ...mapActions( useActionStore, [
            "setSelection",
        ]),
        ...mapActions( useGameStore, [
            "removeActor",
        ]),
        ...mapActions( usePlayerStore, [
            "awardCredits",
        ]),
        ...mapActions( useSystemStore, [
            "showNotification",
        ]),
        repairBuilding(): void {

        },
        sellBuilding(): void {
            const mapping = getBuildingMappings().find(({ subClass }) => subClass === this.building.subClass );
            this.removeActor( this.building );
            this.setSelection( [] );
            this.awardCredits( mapping.cost );
            this.showNotification( this.$t( "constructionSold" ));
        },
    },
});
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_variables";

.command-window__actions__button {
    cursor: pointer;
    padding: $spacing-small;

    &:hover {
        background-color: rgba(255,255,255,0.5);
        text-indent: $spacing-small;
    }

    &--selected {
        font-weight: bold;
    }
}
</style>
