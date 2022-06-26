import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import WorldFactory from "@/model/factories/world-factory";
import { randomBuildingMapping, randomUnit, randomBuilding } from "../test-util";

const gameStoreMock = {
    created: 100,
    world: WorldFactory.create(),
    effects: [],
    setGame: vi.fn(),
    setLastRender: vi.fn(),
    actors: [ randomUnit(), randomUnit(), randomUnit() ],
    addActor: vi.fn(),
};
vi.mock( "@/stores/game", () => ({
    useGameStore: () => gameStoreMock
}));
const unitActionsMock = {
    unitForBuilding: vi.fn(() => "unitForBuildingResult" ),
    buildUnitForBuilding: vi.fn(() => "buildUnitForBuildingResult" ),
    navigateToPoint: vi.fn(() => "navigateToPointResult" ),
    handleAI: vi.fn(() => "handleAIResult" ),
};
vi.mock( "@/model/actions/unit-actions", () => unitActionsMock );

import type { Store } from "pinia";
import { setActivePinia, createPinia } from "pinia";
import { Owner } from "@/definitions/actors";
import type { Point } from "@/definitions/math";
import { useActionStore } from "@/stores/action";

describe( "Action Pinia store", () => {
    beforeEach(() => {
        setActivePinia( createPinia());
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe( "actions", () => {
        it( "should be able to set the placeable building", () => {
            const store = useActionStore();
            store.placableBuilding = undefined;

            const building = randomBuildingMapping();
            store.placeBuilding( building );

            expect( store.placableBuilding ).toEqual( building );
        });

        it( "should be able to set the placeable building placement", () => {
            const store = useActionStore();
            store.placement = undefined;

            const position = { x: 10, y: 12 };
            store.completePlacement( position );

            expect( store.placement ).toEqual( position );
        });

        describe( "when updating the construction progress of a Building-type Actor", () => {
            it( "should update the completion value of the Actor", () => {
                const store = useActionStore();
                const actor = gameStoreMock.actors[ 1 ];

                const action = { target: actor.id, value: 0.5 };
                store.updateBuildingStep( action );

                expect( actor.completion ).toEqual( action.value );
                expect( gameStoreMock.addActor ).not.toHaveBeenCalled();
            });

            it( "should build the associated unit and add it to the Actor list on construction completion", () => {
                const store = useActionStore();
                const actor = gameStoreMock.actors[ 1 ];

                const spy1 = vi.spyOn( unitActionsMock, "unitForBuilding" );
                const spy2 = vi.spyOn( unitActionsMock, "buildUnitForBuilding" );

                const action = { target: actor.id, value: 1 };
                store.updateBuildingStep( action );

                expect( unitActionsMock.unitForBuilding ).toHaveBeenCalledWith( actor );
                expect( unitActionsMock.buildUnitForBuilding ).toHaveBeenCalledWith( "unitForBuildingResult", actor, Owner.PLAYER );
                expect( gameStoreMock.addActor ).toHaveBeenCalledWith( "buildUnitForBuildingResult" );
            });
        });

        it( "should be able to set the currently selected Actors", () => {
            const store = useActionStore();
            store.selectedActors = [];

            const actors = [ gameStoreMock.actors[ 0 ], gameStoreMock.actors[ 2 ] ];
            store.setSelection( actors );

            expect( store.selectedActors ).toEqual( actors );
        });

        it( "should be able to assign a target to all currently selected Unit-type Actors", () => {
            const store = useActionStore();
            store.selectedActors = [ randomUnit(), randomBuilding(), randomUnit() ];

            const spy = vi.spyOn( unitActionsMock, "navigateToPoint" );
            store.assignTarget( 10, 15 );

            expect( spy ).toHaveBeenNthCalledWith( 1, store.selectedActors[ 0 ], 10, 15 );
            expect( spy ).toHaveBeenNthCalledWith( 2, store.selectedActors[ 2 ], 10, 15 );
        });

        it( "should be able to update the x-position of a specific Actor", () => {
            const store = useActionStore();
            const actor = gameStoreMock.actors[ 1 ];

            const action = { target: actor.id, value: 15 };
            store.setActorX( action );

            expect( actor.x ).toEqual( action.value );
        });

        it( "should be able to update the y-position of a specific Actor", () => {
            const store = useActionStore();
            const actor = gameStoreMock.actors[ 1 ];

            const action = { target: actor.id, value: 15 };
            store.setActorY( action );

            expect( actor.y ).toEqual( action.value );
        });

        it( "should be able to update the value of the current AI action of a specific Actor", () => {
            const store = useActionStore();
            const actor = gameStoreMock.actors[ 1 ];

            const action = { target: actor.id, value: 0.7 };
            store.setAiActionValue( action );

            expect( actor.aiValue ).toEqual( action.value );
        });

        it( "should invoke the next AI action whenever an Actor completes their current AI action", () => {
            const store = useActionStore();
            const actor = gameStoreMock.actors[ 1 ];

            const spy = vi.spyOn( unitActionsMock, "handleAI" );
            store.handleAIActionEnd({ value: 1, target: actor.id });

            expect( spy ).toHaveBeenCalledWith( actor );
        });
    });

});
