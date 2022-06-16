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
import LZString from "lz-string";
import type { EnvironmentDef } from "@/definitions/world-tiles";
import EffectFactory, { type Effect, type SerializedEffect } from "./effect-factory";
import PlayerFactory, { type Player, type SerializedPlayer } from "./player-factory";
import WorldFactory, { type SerializedWorld } from "./world-factory";

export type Game = {
    created: number;
    world: EnvironmentDef;
    player: Player;
    effects: Effect[];
};

type SerializedGame = {
    c: number;
    p: SerializedPlayer;
    w: SerializedWorld;
    e: SerializedEffect[];
};

const GameFactory =
{
    create( world?: EnvironmentDef ): Game {
        const now = Date.now();
        return {
            created: now,
            world: world || WorldFactory.populate( WorldFactory.create()),
            player: PlayerFactory.create(),
            effects: [],
        };
    },

    serialize( game: Game ): string {
        const out: SerializedGame = {
            c: game.created,
            w: WorldFactory.serialize( game.world ),
            p: PlayerFactory.serialize( game.player ),
            e: game.effects.map( EffectFactory.serialize ),
        };
        const json = JSON.stringify( out );
        try {
            const compressed = LZString.compressToUTF16( json );
            if ( process.env.NODE_ENV !== "production" ) {
                console.log(
                    `Compressed ${json.length} to ${compressed.length}
                    (${(( compressed.length / json.length ) * 100 ).toFixed( 2 )}% of original size)`
                );
            }
            return compressed;
        }
        catch ( e ) {
            return json;
        }
    },

    deserialize( encodedData: string ): Game | undefined {
        let data: SerializedGame;
        try {
            data = JSON.parse( LZString.decompressFromUTF16( encodedData )! ) as SerializedGame;
        } catch ( e ) {
            return undefined;
        }

        const game   = GameFactory.create( WorldFactory.deserialize( data.w ));
        game.created = data.c;
        game.player  = PlayerFactory.deserialize( data.p );
        game.effects = data.e.map( EffectFactory.deserialize );

        return game;
    }
};
export default GameFactory;
