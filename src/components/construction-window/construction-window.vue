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
        <div class="base-control__actions">
            <button
                v-t="'buildings'"
                type="button"
                class="base-control__actions__button"
                :class="{ 'base-control__actions__button--active': mode === 0 }"
                @click="mode = 0"
            ></button>
            <button
                v-t="'units'"
                type="button"
                class="base-control__actions__button"
                :class="{ 'base-control__actions__button--active': mode === 1 }"
                @click="mode = 1"
            ></button>
        </div>
        <div class="base-control__items">
            <building-construction-window
                v-if="mode === 0"
                v-model="selectedBuilding"
            />
            <unit-construction-window
                v-if="mode === 1"
                v-model="selectedUnit"
            />
        </div>
        <div class="base-control__actions">
            <button
                v-t="'buy'"
                type="button"
                class="base-control__actions__button"
                :disabled="!canBuy"
                @click="buyItem()"
            ></button>
            <button
                v-t="'sell'"
                type="button"
                class="base-control__actions__button"
                :disabled="!canSell"
                @click="sellItem()"
            ></button>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapState, mapActions } from "pinia";
import { ActorType, Unit, Building, Owner } from "@/definitions/actors";
import { type Point } from "@/definitions/math";
import { canBuildUnit, buildUnitForBuilding } from "@/model/actions/unit-actions";
import ActorFactory from "@/model/factories/actor-factory";
import EffectFactory from "@/model/factories/effect-factory";
import { ACTION_STORE_NAME, useActionStore } from "@/stores/action";
import { useGameStore } from "@/stores/game";
import { usePlayerStore } from "@/stores/player";
import { useSystemStore } from "@/stores/system";
import BuildingConstructionWindow from "./components/building-construction-window.vue";
import UnitConstructionWindow from "./components/unit-construction-window.vue";

import messages from "./messages.json";

export default defineComponent({
    i18n: { messages },
    components: {
        BuildingConstructionWindow,
        UnitConstructionWindow,
    },
    data: () => ({
        selectedBuilding: undefined,
        selectedUnit: undefined,
        mode: 0,
    }),
    computed: {
        ...mapState( useActionStore, [
            "placement",
        ]),
        ...mapState( usePlayerStore, [
            "credits",
        ]),
        ...mapState( useGameStore, [
            "buildings",
            "gameTime",
        ]),
        canBuy(): boolean {
            let cost = Infinity;
            switch ( this.mode ) {
                default:
                    break;
                case 0:
                    if ( !this.selectedBuilding ) {
                        return false;
                    }
                    cost = this.selectedBuilding.cost;
                    break;
                case 1:
                    if ( !this.selectedUnit || !canBuildUnit( this.selectedUnit, this.buildings )) {
                        return false;
                    }
                    cost = this.selectedUnit.cost;
                    break;
            }
            return cost <= this.credits;

        },
        canSell(): boolean {
            if ( this.mode === 0 && this.selectedBuilding ) {
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
            const buildingActor = ActorFactory.create({
                type: ActorType.BUILDING,
                subClass: this.selectedBuilding.type,
                owner: Owner.PLAYER,
                x: position.x, y: position.y,
                width: this.selectedBuilding.width, height: this.selectedBuilding.height
            });
            this.addActor( buildingActor );
            // TODO: size of building determines duration
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
        buyItem(): void {
            if ( this.mode === 0 ) {
                this.placeBuilding( this.selectedBuilding );
            } else if ( this.mode === 1 ) {
                this.deductCredits( this.selectedUnit.cost );
                const building = this.buildings.find(({ subClass }) => subClass === Building.REFINERY );
                this.addActor( buildUnitForBuilding( this.selectedUnit.type, building, Owner.PLAYER ));
            }
        },
        sellItem(): void {

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

    &__items {
        overflow-x: hidden;
        overflow-y: auto;
        max-height: 200px;
    }

    &__actions {
        display: flex;
        justify-content: space-between;

        &__button {
            flex: 1;
            border: none;

            &--active {
                background-color: yellow;
            }
        }
    }
}
</style>
