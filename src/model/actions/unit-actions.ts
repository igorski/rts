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
import type { UnitMapping } from "@/definitions/actors";
import { ActorType, Unit, Building, Owner, getUnitMappings } from "@/definitions/actors";
import type { Actor } from "@/model/factories/actor-factory";
import ActorFactory from "@/model/factories/actor-factory";

export const canBuildUnit = ( unit: UnitMapping, buildings: Actor[] ): boolean => {
    switch ( unit.type ) {
        default:
            return false;
        case Unit.SCOUT:
            if ( !buildings.some(({ subClass }) => subClass === Building.BARRACKS )) {
                return false;
            }
            break;
        case Unit.HARVESTER:
            if ( !buildings.some(({ subClass }) => subClass === Building.REFINERY )) {
                return false;
            }
            break;
    }
    return true;
};

/**
 * Returns the unit associated with a building (for instance a
 * refinery comes with a free harvester), can be undefined.
 */
export const unitForBuilding = ( building: Actor ): UnitMapping | undefined => {
    let type: Unit;
    switch ( building.subClass ) {
        default:
            return undefined;
        case Building.REFINERY:
            type = Unit.HARVESTER;
            break;
    }
    return getUnitMappings().find( unit => type === unit.type );
};

/**
 * Creates a Unit Actor associated with a Building Actor
 */
export const buildUnitForBuilding = ( unit: UnitMapping, building: Actor, owner: Owner = Owner.AI ): Actor => {
    const x = building.x + building.width;
    const y = building.y + building.height;

    return ActorFactory.create({
        type: ActorType.UNIT,
        subClass: unit.type as Unit,
        owner,
        x, y,
        width: unit.width,
        height: unit.height
    });
};
