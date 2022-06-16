import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Store } from "pinia";
import { setActivePinia, createPinia } from "pinia";
import { usePlayerStore } from "@/stores/player";

describe( "Player Pinia store", () => {
    beforeEach(() => {
        setActivePinia( createPinia());
    });

    describe( "actions", () => {
        it( "should be able to award credits to the players balance", () => {
            const store = usePlayerStore();
            store.credits = 100;

            expect( store.awardCredits( 300 )).toEqual( 400 );
            expect( store.credits ).toEqual( 400 );
        });

        it( "should be able to deduct credits from the players balance", () => {
            const store = usePlayerStore();
            store.credits = 400;

            expect( store.deductCredits( 300 )).toEqual( 100 );
            expect( store.credits ).toEqual( 100 );
        });
    });

});
