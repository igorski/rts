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
        v-for="( unit, index ) in units"
        :key="`unit${index}`"
        :class="{ 'base-control__items__entry--selected': selectedUnit === unit }"
        class="base-control__items__entry"
        @click="selectedUnit = unit"
    >
        {{ unit.name }} {{ unit.cost }}
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapState, mapActions } from "pinia";
import { Building, Owner getUnitMappings } from "@/definitions/actors";
import type { UnitMapping } from "@/definitions/actors";
import { canBuildUnit, buildUnitForBuilding } from "@/model/actions/unit-actions";
import { useGameStore } from "@/stores/game";
import { usePlayerStore } from "@/stores/player";

export default defineComponent({
    props: {
        modelValue: {
            type: Object,
            default: undefined,
        },
    },
    data: () => ({
        units: getUnitMappings(),
        selectedUnit: undefined,
    }),
    computed: {
        ...mapState( useGameStore, [
            "buildings",
        ]),
    },
    methods: {
        ...mapActions( useGameStore, [
            "addActor",
        ]),
        ...mapActions( usePlayerStore, [
            "deductCredits",
        ]),
        buildItem(): void {
            this.deductCredits( this.selectedUnit.cost );
            const building = this.buildings.find(({ subClass }) => subClass === Building.REFINERY );
            this.addActor( buildUnitForBuilding( this.selectedUnit.type, building, Owner.PLAYER ));
        },
    },
})
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_variables";

.base-control__items__entry {
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
