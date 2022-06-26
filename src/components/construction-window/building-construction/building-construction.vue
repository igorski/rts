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
        v-for="( building, index ) in mappedBuildings"
        :key="`building_${index}`"
        :class="{ 'command-window__items__entry--selected': selectedBuilding === building }"
        class="command-window__items__entry"
        @click="selectedBuilding = building"
    >
        {{ building.name }} {{ building.cost }}
    </div>
    <div class="command-window__actions">
        <button
            v-t="'build'"
            type="button"
            class="command-window__actions__button"
            :disabled="!canBuy"
            @click="buildItem()"
        ></button>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapState, mapActions } from "pinia";
import { ActorType, Owner, getBuildingMappings } from "@/definitions/actors";
import type { BuildingMapping } from "@/definitions/actors";
import { type Point } from "@/definitions/math";
import ActorFactory from "@/model/factories/actor-factory";
import EffectFactory from "@/model/factories/effect-factory";
import { ACTION_STORE_NAME, useActionStore } from "@/stores/action";
import { useGameStore } from "@/stores/game";
import { usePlayerStore } from "@/stores/player";
import { useSystemStore } from "@/stores/system";

import messages from "./messages.json";

export default defineComponent({
    i18n: { messages },
    props: {
        modelValue: {
            type: Object,
            default: undefined,
        },
    },
    data: () => ({
        buildings: getBuildingMappings(),
        selectedBuilding: undefined,
    }),
    computed: {
        ...mapState( useActionStore, [
            "placement",
        ]),
        ...mapState( useGameStore, [
            "canBuild",
            "gameTime",
        ]),
        ...mapState( usePlayerStore, [
            "credits",
        ]),
        mappedBuildings() : BuildingMapping[] {
            return this.buildings.filter(({ constructable }) => !!constructable );
        },
        canBuy(): boolean {
            let cost = Infinity;
            if ( !this.canBuild || !this.selectedBuilding ) {
                return false;
            }
            cost = this.selectedBuilding.cost;
            return cost <= this.credits;
        },
    },
    watch: {
        placement( position: Point | undefined ): void {
            if ( position === undefined || this.selectedBuilding === undefined ) {
                return;
            }
            this.deductCredits( this.selectedBuilding.cost );
            const buildingActor = ActorFactory.create({
                type: ActorType.BUILDING,
                subClass: this.selectedBuilding.subClass,
                owner: Owner.PLAYER,
                x: position.x, y: position.y, z: this.selectedBuilding.z,
                width: this.selectedBuilding.width, height: this.selectedBuilding.height
            });
            this.addActor( buildingActor );
            // TODO: size of building determines build duration
            this.addEffect( EffectFactory.create({
                store: ACTION_STORE_NAME, start: this.gameTime, duration: 5000,
                from: 0, to: 1, action: "updateBuildingStep", target: buildingActor.id
            }));
            this.showNotification( this.$t( "building" ));
            this.placeBuilding( undefined );
        },
    },
    methods: {
        ...mapActions( useActionStore, [
            "placeBuilding",
        ]),
        ...mapActions( useGameStore, [
            "addActor",
            "addEffect",
        ]),
        ...mapActions( usePlayerStore, [
            "deductCredits",
        ]),
        ...mapActions( useSystemStore, [
            "showNotification",
        ]),
        buildItem(): void {
            this.placeBuilding( this.selectedBuilding );
        },
    },
})
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_variables";

.command-window__items__entry {
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
