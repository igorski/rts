import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Store } from "pinia";
import { setActivePinia, createPinia } from "pinia";
import type { Effect } from "@/model/factories/effect-factory";
import EffectFactory from "@/model/factories/effect-factory";
import { GameStates, useGameStore } from "@/stores/game";

/* convenience method to quickly construct an Effect */

type FXProps = {
    action?: string;
    callback?: string;
    target?: string
};

function fx({ action, callback, target }: FXProps ): Effect {
    return EffectFactory.create({ action, callback, target, store: "fooStore", start: 500, duration: 1000, from: 0, to: 1 });
}

describe( "Game Pinia store", () => {
    beforeEach(() => {
        setActivePinia( createPinia());
    });

    describe( "actions", () => {
        it( "should be able to set the game state", () => {
            const store = useGameStore();

            store.gameState = GameStates.IDLE;
            store.setGameState( GameStates.ACTIVE );
            expect( store.gameState ).toEqual( GameStates.ACTIVE );
        });

        it( "should be able to advance the current game time", () => {
            const store = useGameStore();

            const now = Date.now();
            store.gameTime = now;
            const delta = 1000;
            store.advanceGameTime( delta );
            expect( store.gameTime ).toEqual( now + delta );
        });

        it( "should be able to set the current game time", () => {
            const store = useGameStore();

            const now = Date.now();
            store.gameTime = 0;
            store.setGameTime( now );
            expect( store.gameTime ).toEqual( now );
        });

        it( "should be able to set the last game render time", () => {
            const store = useGameStore();

            store.lastRender = 0;
            store.setLastRender( 100 );
            expect( store.lastRender ).toEqual( 100 );
        });

        describe( "when adding time bound effects", () => {
            it( "should be able to add an effect to the game", () => {
                const store = useGameStore();

                store.effects = [ fx({ action: "bar" })];
                store.addEffect( fx({ action: "qux" }));
                expect( store.effects ).toEqual( [ fx({ action: "bar" }), fx({ action: "qux" }) ] );
            });

            it( "should be able to remove an effect from the game", () => {
                const store = useGameStore();

                store.effects = [ fx({ action: "bar" }), fx({ action: "qux" }) ];
                store.removeEffect( store.effects[ 0 ]);
                expect( store.effects ).toEqual([ fx({ action: "qux" }) ]);
            });

            it( "should be able to remove effects of specific mutation types", () => {
                const store = useGameStore();

                store.effects = [
                    fx({ action: "foo" }),
                    fx({ action: "bar" }),
                    fx({ action: "bar" }),
                    fx({ action: "baz" }),
                    fx({ action: "qux" }),
                ];
                store.removeEffectsByAction( [ "bar" ]);
                expect( store.effects ).toEqual([
                    fx({ action: "foo" }),
                    fx({ action: "baz" }),
                    fx({ action: "qux" })
                ]);
                store.removeEffectsByAction( [ "foo", "qux" ]);
                expect( store.effects ).toEqual([ fx({ action: "baz" }) ]);
            });

            it( "should be able to remove effects with specific callback actions", () => {
                const store = useGameStore();

                store.effects = [
                    fx({ callback: "foo" }),
                    fx({ callback: "bar" }),
                    fx({ callback: "bar" }),
                    fx({ callback: "baz" }),
                    fx({ callback: "qux" }),
                ];
                store.removeEffectsByCallback( [ "bar" ]);

                expect( store.effects ).toEqual([
                    fx({ callback: "foo" }),
                    fx({ callback: "baz" }),
                    fx({ callback: "qux" })
                ]);
                store.removeEffectsByCallback( [ "foo", "qux" ]);

                expect( store.effects ).toEqual([ fx({ callback: "baz" }) ]);
            });

            it( "should be able to remove effects for specific targets", () => {
                const store = useGameStore();

                store.effects = [
                    fx({ target: "foo", action: "fooMut" }),
                    fx({ target: "bar", action: "barMut" }),
                    fx({ target: "bar", action: "barMut2" }),
                ];
                store.removeEffectsByTarget( "bar" );
                expect( store.effects ).toEqual([ fx({ target: "foo", action: "fooMut" }) ]);
            });

            it( "should be able to remove effects for specific targets and their mutation types", () => {
                const store = useGameStore();

                store.effects = [
                    fx({ target: "foo", action: "fooMut" }),
                    fx({ target: "bar", action: "barMut" }),
                    fx({ target: "bar", action: "barMut2" }),
                    fx({ target: "baz", action: "bazMut" }),
                    fx({ target: "baz", action: "bazMut2" }),
                    fx({ target: "baz", action: "barMut" })
                ];

                store.removeEffectsByTargetAndAction( "bar", "barMut" );

                expect( store.effects ).toEqual([
                    fx({ target: "foo", action: "fooMut" }),
                    fx({ target: "bar", action: "barMut2" }),
                    fx({ target: "baz", action: "bazMut" }),
                    fx({ target: "baz", action: "bazMut2" }),
                    fx({ target: "baz", action: "barMut" })
                ]);

                store.removeEffectsByTargetAndAction( "baz", [ "bazMut", "bazMut2" ]);

                expect( store.effects ).toEqual([
                    fx({ target: "foo", action: "fooMut" }),
                    fx({ target: "bar", action: "barMut2" }),
                    fx({ target: "baz", action: "barMut" })
                ]);
            });
        });
    });
});