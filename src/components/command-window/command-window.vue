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
        <h1>{{ selectionName }}</h1>
        <div class="command-window__actions">
            <button
                v-for="(command, index) in commands"
                :key="`command_${index}`"
                type="button"
                class="command-window__actions__button"
                @click="handleCommand( command.action )"
            >{{ command.name }}</button>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapState, mapActions } from "pinia";
import { Unit, AiActions } from "@/definitions/actors";
import type { UnitCommand } from "@/model/actions/unit-actions";
import { handleAI } from "@/model/actions/unit-actions";
import { harvesterCommands } from "@/model/actions/ai/harvester";
import { useActionStore } from "@/stores/action";
import { useGameStore } from "@/stores/game";
import { useSystemStore } from "@/stores/system";

import messages from "./messages.json";

export default defineComponent({
    i18n: { messages },
    computed: {
        ...mapState( useActionStore, [
            "selectedActors",
        ]),
        selectionName(): string {
            if ( this.selectedActors.every(({ subClass }) => subClass === Unit.SCOUT )) {
                return this.$t( "scout" );
            }
            if ( this.selectedActors.every(({ subClass }) => subClass === Unit.HARVESTER )) {
                return this.$t( "harvester" );
            }
            return this.$t( "multipleUnits" );
        },
        commands(): UnitCommand[] {
            let commands: UnitCommand[] = [{ name: "close", action : AiActions.IDLE }];
            if ( this.selectedActors.every(({ subClass }) => subClass === Unit.HARVESTER )) {
                commands = [ ...commands, ...harvesterCommands() ];
            }
            return commands.map(({ name, action }) => ({
                name: this.$t( name ),
                action,
            }));
        },
    },
    methods: {
        ...mapActions( useActionStore, [
            "setSelection",
        ]),
        ...mapActions( useGameStore, [
            "setActorAiAction",
        ]),
        ...mapActions( useSystemStore, [
            "setMessage",
        ]),
        handleCommand( command: AiActions ): void {
            switch ( command ) {
                case AiActions.IDLE:
                    this.setSelection( [] );
                    this.setMessage( undefined );
                    break;
                default:
                    this.selectedActors.forEach( actor => {
                        this.setActorAiAction( actor, command );
                        handleAI( actor );
                    });
                    break;
            }
        },
    },
});
</script>

<style lang="scss" scoped>
@import "@/assets/styles/ui";

.command-window {
    @include commandWindow();
}
</style>
