import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import WorldFactory from "@/model/factories/world-factory";

const storeModernMock = {
    get: vi.fn(() => "storeModernMockGet"),
    set: vi.fn(),
    remove: vi.fn(() => "storeModernMockRemove" )
};
vi.mock( "store/dist/store.modern", () => ({ default: storeModernMock }));
const gameFactoryMock = {
    serialize: vi.fn(() => "serializedGame" ),
    deserialize: vi.fn(() => "deserializedGame" )
};
vi.mock( "@/model/factories/game-factory", () => ({ default: gameFactoryMock }));
const gameStoreMock = {
    created: 100,
    world: WorldFactory.create(),
    effects: [],
    setGame: vi.fn(),
    setLastRender: vi.fn(),
};
vi.mock( "@/stores/game", () => ({
    useGameStore: () => gameStoreMock
}));

import type { Store } from "pinia";
import { setActivePinia, createPinia } from "pinia";
import { useStorageStore } from "@/stores/storage";

describe( "Storage Pinia store", () => {
    beforeEach(() => {
        setActivePinia( createPinia());
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it( "should be able to save the game state into local storage", async () => {
        const store = useStorageStore();

        await store.saveGame();

        expect( gameFactoryMock.serialize ).toHaveBeenCalledWith({ created: expect.any( Number ), world: expect.any( Object ), effects: expect.any( Array )} );
        expect( storeModernMock.set ).toHaveBeenCalledWith( "rtsGame", "serializedGame" );
    });

    it( "should be able to restore a saved game from local storage", async () => {
        const store = useStorageStore();

        const success = await store.loadGame();

        expect( success ).toBe( true );
        expect( storeModernMock.get ).toHaveBeenCalledWith(  "rtsGame" );
        expect( gameFactoryMock.deserialize ).toHaveBeenCalledWith( "storeModernMockGet" );
        expect( gameStoreMock.setGame ).toHaveBeenCalledWith( "deserializedGame" );
        expect( gameStoreMock.setLastRender ).toHaveBeenCalledWith( expect.any( Number ));
    });

    it( "should be able to reset an existing game and remove a saved game state from local storage", () => {
        const store = useStorageStore();

        store.resetGame();

        expect( storeModernMock.remove ).toHaveBeenCalledWith( "rtsGame" );
    });
});
