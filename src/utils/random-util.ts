import Random from "random-seed";

const rand = Random.create();

export const random             = (): number => rand.floatBetween( 0, 1 ); // seeded Math.random()
export const randomInRangeInt   = ( min: number, max: number ): number => rand.intBetween( min, max );
export const randomInRangeFloat = ( min: number, max: number ): number => rand.floatBetween( min, max );
export const randomFromList     = ( list: any[] ): any => list[ rand.intBetween( 0, list.length - 1 )];
export const randomBool         = (): boolean => rand.intBetween( 0, 1 ) === 1;
