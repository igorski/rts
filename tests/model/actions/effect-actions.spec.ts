import { describe, it, expect, vi, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { updateEffect } from "@/model/actions/effect-actions";
import EffectFactory from "@/model/factories/effect-factory";
import { GAME_STORE_NAME } from "@/stores/game";

const gameStoreMock = {
    updateAction: vi.fn(),
    callbackAction: vi.fn()
};
vi.mock( "@/stores/game", () => ({
    useGameStore: () => gameStoreMock
}));

setActivePinia( createPinia());

describe( "Effect actions", () => {

    const store = GAME_STORE_NAME;
    const action = "updateAction";
    const start = 1000;
    const duration = 1000;
    const from = 0;
    const to = 1;
    const callback = "callbackAction";

    afterEach(() => {
        vi.clearAllMocks();
    });

    it( "should not perform an action for an Effect that is scheduled in the future", () => {
        const effect = EffectFactory.create({ store, action, start, duration, from, to });
        const result = updateEffect( effect, 0 );

        // effect is not done
        expect( result ).toBe( false );

        // effect is scheduled in future, should not have take action
        expect( gameStoreMock.updateAction ).not.toHaveBeenCalled();
        expect( gameStoreMock.callbackAction ).not.toHaveBeenCalled();
    });

    it( "should perform an action for an Effect where its active lifetime overlaps the current time", () => {
        const effect = EffectFactory.create({ store, action, start, duration, from, to });
        const result = updateEffect( effect, start + ( duration / 2 ));

        // effect is not done (still halfway through its lifetime)
        expect( result ).toBe( false );

        // expect update function to have been called with correctly interpolated value
        expect( gameStoreMock.updateAction ).toHaveBeenCalledWith( 0.5 );
        expect( gameStoreMock.callbackAction ).not.toHaveBeenCalled();
    });

    it( "Should perform the final action for an Effect where the active lifetime ends at the current time", () => {
        const effect = EffectFactory.create({ store, action, start, duration, from, to });
        const result = updateEffect( effect, start + duration );

        // effect is done (current time is at its lifetime end)
        expect( result ).toBe( true );

        // expect update function to have been called with correctly interpolated value
        expect( gameStoreMock.updateAction ).toHaveBeenCalledWith( 1 );
        expect( gameStoreMock.callbackAction ).not.toHaveBeenCalled();
    });

    it( "Should perform the final action for an Effect where the active lifetime ended before the current time", () => {
        const effect = EffectFactory.create({ store, action, start, duration, from, to });
        const result = updateEffect( effect, start + ( duration * 2 ));

        // effect is done (current time is at its lifetime end)
        expect( result ).toBe( true );

        // expect update function to have been called with correctly interpolated value
        expect( gameStoreMock.updateAction ).toHaveBeenCalledWith( 1 );
        expect( gameStoreMock.callbackAction ).not.toHaveBeenCalled();
    });

    it( "Should dispatch the callback method when the effect completes", () => {
        const effect = EffectFactory.create(
            { store, action, start, duration, from, to, callback }
        );

        // ensure callback isn't invoked before effect is started
        updateEffect( effect, 0 );
        expect( gameStoreMock.callbackAction ).not.toHaveBeenCalled();

        // ensure callback isn't invoked when effect is started
        updateEffect( effect, start );
        expect( gameStoreMock.callbackAction ).not.toHaveBeenCalled();

        // ensure callback isn't invoked halfway through effect lifetime
        updateEffect( effect, start + ( duration / 2 ));
        expect( gameStoreMock.callbackAction ).not.toHaveBeenCalled();

        // ensure callback is invoked when effect has reached its end
        updateEffect( effect, start + duration );
        expect( gameStoreMock.callbackAction ).toHaveBeenCalledWith({ value: to, target: undefined });
    });

    describe("When the optional target property is defined", () => {
        it( "Should call the commit method with both value and target", () => {
            const target = "fooBar";
            const effect = EffectFactory.create({ store, action, start, duration, from, to, target });
            const result = updateEffect( effect, start + ( duration * 2 ));

            // effect is done (current time is at its lifetime end)
            expect( result ).toBe( true );

            // expect update function to have been called with correctly interpolated value
            expect( gameStoreMock.updateAction ).toHaveBeenCalledWith({ value: to, target });
            expect( gameStoreMock.callbackAction ).not.toHaveBeenCalled();
        });

        it( "Should dispatch the callback method supplying target when the effect completes", () => {
            const target = { foo: "bar" };
            const effect = EffectFactory.create(
                { store, action, start, duration, from, to, callback, target }
            );
            updateEffect( effect, start + duration );
            expect( gameStoreMock.callbackAction ).toHaveBeenCalledWith({ value: to, target });
        });
    });
});
