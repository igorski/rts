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
    <header
        class="header"
        :class="{ 'header--expanded': menuOpened }"
    >
        <div class="header__top">
            <nav class="menu">
                <div class="menu__toggle"
                     @click="toggleMenu()"
                 >
                    <span>&#9776;</span>
                </div>
                <ul class="menu__items">
                    <li>
                        <button
                            v-t="'file'"
                            type="button"
                            class="submenu__toggle" title="file"
                        ></button>
                        <ul class="menu__items__sub">
                            <li>
                                <button
                                    v-t="'saveGame'"
                                    type="button"
                                    :disabled="!hasActiveGame || isGameOver"
                                    title="Save game"
                                    @click="handleSave()"
                                ></button>
                            </li>
                            <li>
                                <button
                                    v-t="'resetGame'"
                                    type="button"
                                    title="Reset game"
                                    :disabled="!hasActiveGame"
                                    @click="handleReset()"
                                ></button>
                            </li>
                        </ul>
                    </li>
                </ul>
            </nav>
            <div class="credits">
                {{ credits }} <span v-t="'credits'"></span>
            </div>
        </div>
        <div class="header__bottom">{{ statusMessage }}</div>
    </header>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapState, mapActions } from "pinia";
import { GameStates, useGameStore } from "@/stores/game";
import { usePlayerStore } from "@/stores/player";
import { useStorageStore } from "@/stores/storage";
import { useSystemStore } from "@/stores/system";

import messages from "./messages.json";

export default defineComponent ({
    i18n: { messages },
    data: () => ({
        menuOpened: false,
    }),
    computed: {
        ...mapState( useGameStore, [
            "created",
            "world",
            "gameState",
        ]),
        ...mapState( usePlayerStore, [
            "credits",
        ]),
        ...mapState( useSystemStore, [
            "statusMessage",
        ]),
        hasActiveGame(): boolean {
            return this.created > 0 && !this.isGameOver; // e.g. creating new character/restart
        },
        isGameOver(): boolean {
            return this.gameState === GameStates.GAME_OVER;
        },
    },
    methods: {
        ...mapActions( useSystemStore, [
            "openDialog",
            "showError",
            "showNotification",
        ]),
        ...mapActions( useStorageStore, [
            "saveGame",
            "resetGame",
        ]),
        toggleMenu(): void {
            this.menuOpened = !this.menuOpened;
            // prevent scrolling main body when scrolling menu list (are we expecting scrollable body?)
            //document.body.style.overflow = this.menuOpened ? "hidden" : "auto";
        },
        async handleSave(): Promise<void> {
            try {
                await this.saveGame();
                this.showNotification( this.$t( "saveSuccess" ));
            } catch {
                this.showError( this.$t( "unknownError" ));
            }
        },
        handleReset(): void {
            this.openDialog({
                type: "confirm",
                title: this.$t( "areYouSure" ),
                message: this.$t( "resetExpl" ),
                confirm: () => {
                    this.resetGame();
                }
            });
        },
    }
});
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_variables";
@import "@/assets/styles/_mixins";

.header {
    position: fixed;
    left: 0;
    top: 0;
    z-index: $z-index-header;
    background-color: $color-background;
    width: 100%;
    padding: 0;

    &__top {
        display: flex;
        justify-content: space-around;
        align-items: center;
        width: 100%;
    }

    &__bottom {
        border: 1px solid #000;
        border-radius: 7px;
        height: 40px;
        padding: $spacing-small;
        box-sizing: border-box;
    }

    @include mobile() {
        width: 100%;
        height: $menu-height-mobile;
        background-color: $color-background;

        &--expanded {
            height: 100%;
        }
    }
}

// menu is horizontal bar aligned to the top of the screen on resolutions above mobile width

.menu {
    @include noSelect();
    width: 100%;
    height: $menu-height;
    box-sizing: border-box;

    &__toggle {
        position: absolute;
        display: none;
        top: 0;
        left: 0;
        cursor: pointer;
        width: $menu-toggle-width;
        height: $menu-height;
        background-color: #0e1417;
        color: #FFF;

        span {
            display: block;
            font-size: 150%;
            margin: 12px;
        }
    }

    ul {
        padding: 0;
        box-sizing: border-box;
        list-style-type: none;
    }

    .menu__items {
        width: 100%;
        line-height: $menu-height;
        vertical-align: middle;
        margin: 0 auto;
        display: block;

        &__sub {
            li button {
                display: block;
                margin: $spacing-medium 0;
            }
        }

        @include large() {
            text-align: left;

            &__sub {
                padding-top: $menu-height;
                background-color: transparent;

                li button {
                    background-color: $color-background;
                }
            }
        }
    }

    li {
        display: inline;
        padding: 0;
        margin: 0 $spacing-medium;

        button, a {
            cursor: pointer;
            border: 0;
            background: none;
            font-size: 100%;
            text-decoration: none;
            padding: 0 $spacing-small;

            &:hover {
                color: $color-5;
            }

            &:disabled {
                color: #666;
            }
        }

        /* submenu (collapsed on large screen) */

        @include large() {
            ul {
                background-color: $color-background;
                width: auto;
                display: none;
                position: absolute;
                top: 0;

                li {
                    display: block;
                }
            }
            &:hover ul {
                display: block;
            }
        }
    }

    &--expanded {
        position: absolute;
    }

    @include large() {
        margin: 0 auto;
    }

    // on resolution below the mobile threshold the menu is fullscreen and vertically stacked

    @include mobile() {
        position: fixed;
        overflow: hidden;
        width: 100%;
        height: inherit;
        top: 0;
        left: 0;

        .menu__items {
            margin: $menu-height-mobile auto 0;
            background-color: $color-background;
            height: calc(100% - #{$menu-height-mobile});
            overflow: hidden;
            overflow-y: auto;

            li {
                display: block;
                margin: 0;
                width: 100%;
                line-height: $spacing-xlarge;
                padding: 0 $spacing-medium;
                @include boxSize();
            }
        }

        &__toggle {
            display: block; // only visible in mobile view
            height: $menu-height-mobile;
        }

        .submenu__toggle {
            display: none; // all are expanded in mobile view
        }
    }
}

.credits {
    width: 100px;
    margin-right: $spacing-medium;
}
</style>
