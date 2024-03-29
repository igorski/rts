/**
* The MIT License (MIT)
*
* Igor Zinken 2019-2022 - https://www.igorski.nl
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
    <div class="notifications">
        <div
            v-for="( notification, index ) in queue"
            :key="`notification_${index}`"
            class="notification-window"
            :class="{ active: notification.visible, destroyed: notification.destroyed }"
            @click="closeNotification( notification )"
        >
            <p>{{ notification.message }}</p>
        </div>
    </div>
</template>

<script lang="ts">
import { mapState, mapActions } from "pinia";
import { useSystemStore } from "@/stores/system";

type NotificationVO = {
    message: string;
    visible: boolean;
    destroyed: boolean;
};

export default {
    data: () => ({
        queue: []
    }),
    computed: {
        ...mapState( useSystemStore, [
            "notifications",
        ]),
    },
    watch: {
        notifications: {
            immediate: true,
            deep: true,
            handler( value: string[] ): void {
                if ( !value.length ) {
                    return;
                }
                value.forEach( notification => {
                    // create internal Value Object for the message
                    const notificationVO: NotificationVO = {
                        message: notification, visible: true, destroyed: false
                    };
                    // auto close after a short delay
                    const delay = 4000 + ( this.queue.filter(({ visible }) => visible ).length * 2000 );
                    window.setTimeout( this.closeNotification.bind( this, notificationVO ), delay );

                    this.queue.push( notificationVO );
                });
                this.clearNotifications();
            }
        }
    },
    methods: {
        ...mapActions( useSystemStore, [
            "clearNotifications",
        ]),
        closeNotification( notificationVO: NotificationVO ): void {
            if ( !notificationVO.visible ) {
                return;
            }
            // trigger 1 sec close animation (see CSS)
            notificationVO.visible = false;
            window.setTimeout( this.removeNotification.bind( this, notificationVO ), 1000 );
        },
        removeNotification( notificationVO: NotificationVO ): void {
            notificationVO.destroyed = true;
            // only clear queue once all notifications have been destroyed
            // (v-for does not guarantee order so clearing when there are multiple notifications
            // causes weird jumps in remaining notification windows)
            if ( !this.queue.find( notificationVO => !notificationVO.destroyed )) {
                this.queue = [];
            }
        }
    }
};
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_variables";
@import "@/assets/styles/_mixins";

.notifications {
    position: fixed;
    z-index: 1000;
    top: 45px;
    right: 0;
    width: 33%;
    max-width: 300px;

    .notification-window {
        @include boxSize();
        display: block;
        position: relative;
        padding: $spacing-small $spacing-large;
        margin-bottom: $spacing-small;
        right: -500px;
        background-color: #393b40;
        border: 3px solid #28292d;
        color: #FFF;
        transition: 1.0s ease-in-out;
        cursor: pointer;
        box-shadow: 0 0 0 rgba(0,255,255,0);

        &.destroyed {
            display: none;
        }

        &.active {
            right: $spacing-medium;
            box-shadow: 0 0 $spacing-small rgba(0,255,255,.35);
        }

        h3 {
            color: $color-1;
            margin: 0;
        }

        p {
            margin: $spacing-xsmall 0;
        }
    }

    @include mobile() {
        width: 100%;
        max-width: 100%;
        left: 0;
        right: auto;

        .notification-window {
            width: 100%;
            left: 0;
            right: auto;
            top: -500px;
            padding: $spacing-medium;
            margin: 0;

            &.active {
                top: 0;
            }
        }
    }
}

@media screen and ( min-width: $app-width ) {
    .notification-window {
        border-radius: $spacing-small;
    }
}
</style>
