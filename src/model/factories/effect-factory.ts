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
interface EffectProps {
    store: string;
    start: number;
    duration: number;
    from: number;
    to: number;
    action?: string;
    callback?: string;
    target?: any;
};

export interface Effect extends EffectProps {
    increment: number;
};

export type SerializedEffect = {
    st: string;
    s: number;
    d: number;
    sv: number;
    ev: number;
    a: string | undefined;
    c: string | undefined;
    t: any | undefined;
};

/**
 * An effect is a state that wears off after times passes
 * An effect should operate on a single property. If more than one effect applies to the same
 * property this should be recalculated into a new duration and value range.
 */
const EffectFactory =
{
    /**
     * Creates an effect that should complete over elapsed game time
     * TODO we now have no type completion when passing the Pinia actions as String names
     * it does however allow us to easily construct Effects and (de)serialize them
     *
     * @param {String} store name of the store the effect commits actions to
     * @param {Number} start time offset (e.g. current game time in milliseconds)
     * @param {Number} duration total effect duration in milliseconds, provided in game time.
     * @param {Number} from the value when the effect starts
     * @param {Number} to the value when the effect ends
     * @param {String=} action the name of the optional Pinia action to commit to on update
     * @param {String=} callback optional Pinia action to dispatch when effect is completed
     * @param {*=} target optional data property of any type to identify the effect target (f.i. character identifier)
     *                    when supplied, actions will receive { value, target } Object instead
     *                    of primitive value as argument
     * @return {Effect}
     */
    create({ store, start, duration, from, to, action, callback, target }: EffectProps ): Effect {
        if ( process.env.NODE_ENV !== "production" ) {
            if ( !action && !callback ) {
                throw new Error( "cannot instantiate an Effect without either an action or callback" );
            }
        }
        return {
            store,
            action,
            start,
            duration,
            from,
            to,
            callback,
            target,
            increment: ( to - from ) / duration
        };
    },

    serialize( effect: Effect ): SerializedEffect {
        return {
            st: effect.store,
            a: effect.action,
            s: effect.start,
            d: effect.duration,
            sv: effect.from,
            ev: effect.to,
            c: effect.callback,
            t: effect.target,
        };
    },

    deserialize( data: SerializedEffect ): Effect {
        return EffectFactory.create({
            store: data.st,
            start: data.s,
            duration: data.d,
            from: data.sv,
            to: data.ev,
            action: data.a,
            callback: data.c,
            target: data.t
        });
    },
};
export default EffectFactory;
