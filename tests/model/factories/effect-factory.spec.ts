import { describe, it, expect } from "vitest";
import EffectFactory from "@/model/factories/effect-factory";

describe( "Effect factory", () => {
    it( "should require either an update action or callback action to be defined", () => {
        expect(() => {
            EffectFactory.create({
                store: "storeName",
                action: "update",
                start: 100,
                duration: 1000,
                from: 0,
                to: 1
            });
        }).not.toThrow();

        expect(() => {
            EffectFactory.create({
                store: "storeName",
                start: 100,
                duration: 1000,
                from: 0,
                to: 1,
                callback: "callback"
            });
        }).not.toThrow();
    });

    it( "should calculate the total Effect duration", () => {
        const store = "storeName";
        const action = "someAction";
        const start = 600;
        const duration = 1000;
        const from = 2000;
        const to = 5000;
        const effect = EffectFactory.create({ store, action, start, duration, from, to });
        expect(effect.duration).toEqual(duration);
    });

    it( "should be able to create a complex Effect structure", () => {
        const store = "fooStore";
        const action = "someAction";
        const start = Date.now();
        const duration = 1000;
        const from = 2000;
        const to = 5000;
        const callback = "someAction";
        const target = { some: "thing" };

        const effect = EffectFactory.create(
            { store, action, start, duration, from, to, callback, target }
        );

        expect(effect).toEqual({
            store,
            action,
            start,
            duration: duration,
            from,
            to,
            callback,
            increment: (to - from) / duration,
            target
        });
    });

    it( "should be able to assemble and disassemble a serialized effect", () => {
        const store = "fooStore";
        const action = "someAction";
        const start = Date.now();
        const duration = 1000;
        const from = 2000;
        const to = 5000;
        const callback = "someAction";
        const target = { some: "thing" };

        const effect = EffectFactory.create(
            { store, action, start, duration, from, to, callback, target }
        );
        const disassembled = EffectFactory.disassemble(effect);
        expect(EffectFactory.assemble(disassembled)).toEqual(effect);
    });
});
