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
import { i18n } from "@/i18n";

export enum ActorType {
    BUILDING,
    UNIT
};

export enum Building {
    CONSTRUCTION_YARD,
    REFINERY,
    BARRACKS,
    TURRET
};

export type BuildingMapping = {
    subClass: Building | string;
    cost: number;
    name: string;
    width: number;
    height: number;
    z: number;
    constructable: boolean;
};

export enum Unit {
    SCOUT,
    HARVESTER,
};

export enum AiActions {
    IDLE,
    GOTO_WAYPOINT,
    RETURN_TO_BASE,
    HARVESTER_HARVEST,
    HARVESTER_RETURN,
};

export type UnitMapping = {
    subClass: Unit | string;
    cost: number;
    name: string;
    width: number;
    height: number;
};

export enum Owner {
    PLAYER,
    AI
};

export const getBuildingMappings = (): BuildingMapping[] => {
    return Object.values( Building )
        .filter( value => typeof value === "number" )
        .map( subClass =>
    {
        let cost = 500;
        let name = "";
        let width = 1;
        let height = 1;
        let z = 1;
        let constructable = true;
        switch ( subClass ) {
            default:
                if ( process.env.NODE_ENV !== "production" ) {
                    throw new Error( `There is no mapping for Building subClass "${subClass}" available` );
                }
                break;
            case Building.CONSTRUCTION_YARD:
                cost = 1000;
                name = "constructionYard";
                width = 2;
                height = 2;
                z = 2;
                // construction yard cannot be built, once you lose it, you lost the ability to construct buildings!
                constructable = false;
                break;
            case Building.REFINERY:
                cost = 300;
                name = "refinery";
                width = 3;
                height = 2;
                z = 3;
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
                z = 5;
                break;

        }
        return { subClass, cost, constructable, name: i18n.t( `building.${name}` ), width, height, z };
    });
};

export const getUnitMappings = (): UnitMapping[] => {
    return Object.values( Unit )
        .filter( value => typeof value === "number" )
        .map( subClass => {
            let cost = 50;
            let name = "";
            let width = 1;
            let height = 1;
            switch ( subClass ) {
                default:
                    if ( process.env.NODE_ENV !== "production" ) {
                        throw new Error( `There is no mapping for Unit subClass "${subClass}" available` );
                    }
                    break;
                case Unit.SCOUT:
                    name = "scout";
                    break;
                case Unit.HARVESTER:
                    name = "harvester";
                    cost = 750;
                    break;
            }
            return { subClass, cost, name: i18n.t( `unit.${name}` ), width, height };
        });
};
