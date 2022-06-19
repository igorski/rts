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
    <div class="base-control">
        <div class="base-control__buildings">
            <div
                v-for="(building, index) in buildings"
                :key="`building_${index}`"
                :class="{ 'base-control__buildings__entry--selected': selectedBuilding === building }"
                class="base-control__buildings__entry"
                @click="selectedBuilding = building"
            >
                {{ building.name }} {{ building.cost }}
            </div>
        </div>
        <div class="base-control__actions">
            <button
                v-t="'buy'"
                type="button"
                class="base-control__actions__button"
                :disabled="!selectedBuilding || selectedBuilding.cost > credits"
                @click="buyBuilding()"
            ></button>
            <button
                v-t="'sell'"
                type="button"
                class="base-control__actions__button"
                :disabled="!canSell"
                @click="sellBuilding()"
            ></button>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapState, mapActions } from "pinia";
import { ActorType, getBuildingMappings } from "@/definitions/actors";
import { type Point } from "@/definitions/math";
import ActorFactory from "@/model/factories/actor-factory";
import { useActionStore } from "@/stores/action";
import { useGameStore } from "@/stores/game";
import { usePlayerStore } from "@/stores/player";

import messages from "./messages.json";

export default defineComponent({
    i18n: { messages },
    data: () => ({
        buildings: getBuildingMappings(),
        selectedBuilding: undefined,
    }),
    computed: {
        ...mapState( useActionStore, [
            "placement",
        ]),
        ...mapState( usePlayerStore, [
            "credits",
        ]),
        canSell(): boolean {
            if ( this.selectedBuilding ) {
                // TODO : check if player owns buildings of this type
            }
            return false;
        }
    },
    watch: {
        placement( position: Point | undefined ): void {
            if ( position === undefined || this.selectedBuilding === undefined ) {
                return;
            }
            this.deductCredits( this.selectedBuilding.cost );
            this.addActor( ActorFactory.create({
                type: ActorType.BUILDING, subClass: this.selectedBuilding.type,
                x: position.x, y: position.y,
                width: this.selectedBuilding.width, height: this.selectedBuilding.height
            }));
            this.placeBuilding( undefined );
        },
    },
    methods: {
        ...mapActions( useActionStore, [
            "placeBuilding",
        ]),
        ...mapActions( useGameStore, [
            "addActor",
        ]),
        ...mapActions( usePlayerStore, [
            "deductCredits",
        ]),
        buyBuilding(): void {
            this.placeBuilding( this.selectedBuilding );
        },
        sellBuilding(): void {

        },
    },
});
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_variables";

.base-control {
    position: relative;
    border: 2px solid #000;
    border-radius: 7px;
    overflow: hidden;
    margin-bottom: $spacing-medium;

    &__buildings {
        overflow-x: hidden;
        overflow-y: auto;
        max-height: 200px;

        &__entry {
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
    }

    &__actions {
        display: flex;
        justify-content: space-between;

        &__button {
            flex: 1;
        }
    }
}
</style>
