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
import type { ActorType, Building, Unit } from "@/definitions/actors";
import { Owner } from "@/definitions/actors";
import { getUid } from "@/utils/uid-util";

export type Actor = {
    id: string;
    type: ActorType;
    subClass: Building | Unit;
    x: number;
    y: number;
    width: number;
    height: number;
    maxEnergy: number;
    energy: number;
    attack: number;
    defense: number;
    owner: Owner;
    completion: number;
};

export type SerializedActor = {
    i: string;
    t: ActorType;
    s: Building | Unit;
    x: number;
    y: number;
    w: number;
    h: number;
    m: number;
    e: number;
    a: number;
    d: number;
    o: Owner;
    c: number;
};

interface ActorProps {
    type: ActorType;
    subClass: Building | Unit;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    maxEnergy?: number;
    energy?: number;
    attack?: number;
    defense?: number;
    owner?: number;
    completion?: number;
};

const ActorFactory =
{
    create({
        type, subClass, x = 0, y = 0, width = 1, height = 1,
        maxEnergy = 1, energy = 1, attack = 0, defense = 0,
        owner = Owner.AI, completion = 1,
    }: ActorProps ): Actor {
        return {
            id: getUid(),
            type,
            subClass,
            x, y,
            width, height,
            maxEnergy, energy,
            attack, defense,
            owner, completion,
        };
    },

    serialize( actor: Actor ): SerializedActor {
        return {
            i: actor.id,
            t: actor.type,
            s: actor.subClass,
            x: actor.x,
            y: actor.y,
            w: actor.width,
            h: actor.height,
            m: actor.maxEnergy,
            e: actor.energy,
            a: actor.attack,
            d: actor.defense,
            o: actor.owner,
            c: actor.completion,
        };
    },

    deserialize( data: SerializedActor ): Actor {
        const actor = ActorFactory.create({
            type: data.t,
            subClass: data.s,
            x: data.x,
            y: data.y,
            width: data.w,
            height: data.h,
            maxEnergy: data.m,
            energy: data.e,
            attack: data.a,
            defense: data.d,
            owner: data.o,
            completion: data.c,
        });
        actor.id = data.i;
        return actor;
    },
};
export default ActorFactory;
