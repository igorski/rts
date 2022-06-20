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
import { useI18n } from "vue-i18n";

export enum ActorType {
    BUILDING,
    UNIT
};

export enum Building {
    REFINERY,
    BARRACKS,
    TURRET
};

export type BuildingMapping = {
    type: Building | string;
    cost: number;
    name: string;
    width: number;
    height: number;
};

export enum Unit {
    SCOUT,
    HARVESTER,
};

export type UnitMapping = {
    type: Unit | string;
    cost: number;
    name: string;
};

export enum Owner {
    PLAYER,
    AI
};

export const getBuildingMappings = (): BuildingMapping[] => {
    return Object.values( Building )
        .filter( value => typeof value === "number" )
        .map( type =>
    {
        let cost = 500;
        let name = "";
        let width = 1;
        let height = 1;
        switch ( type ) {
            default:
                if ( process.env.NODE_ENV !== "production" ) {
                    throw new Error( `There is no mapping for Building type "${type}" available` );
                }
                break;
            case Building.REFINERY:
                cost = 300;
                name = "refinery";
                width = 3;
                height = 2;
                break;
            case Building.BARRACKS:
                cost = 1000;
                name = "barracks";
                width = 3;
                height = 3;
                break;
            case Building.TURRET:
                cost = 2500;
                name = "defenseTurret";
                break;

        }
        return { type, cost, name: useI18n().t( `building.${name}` ), width, height };
    });
};

export const getUnitMappings = (): UnitMapping[] => {
    return Object.values( Unit )
        .filter( value => typeof value === "number" )
        .map( type => {
            let cost = 50;
            let name = "";
            switch ( type ) {
                default:
                    if ( process.env.NODE_ENV !== "production" ) {
                        throw new Error( `There is no mapping for Unit type "${type}" available` );
                    }
                    break;
                case Unit.SCOUT:
                    name = "scout";
                    break;
                case Unit.HARVESTER:
                    name = "harvester";
                    cost = 150;
                    break;
            }
            return { type, cost, name: useI18n().t( `unit.${name}` )};
        });
};
