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

type SerializedEffect = {
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

    /**
     * assemble a serialized JSON structure
     * back into a Effect instance
     */
    assemble( data: SerializedEffect ): Effect {
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

    /**
     * serializes a Effect instance into a JSON structure
     */
    disassemble( effect: Effect ): SerializedEffect {
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
    }
};
export default EffectFactory;
