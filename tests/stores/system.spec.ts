import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Store } from "pinia";
import { setActivePinia, createPinia } from "pinia";
import { useSystemStore } from "@/stores/system";

describe( "System Pinia store", () => {
    beforeEach(() => {
        setActivePinia( createPinia());
    });

    describe( "when opening dialogs", () => {
        const message = "foo";

        it( "should default to showing an information message without action buttons", () => {
            const store = useSystemStore();
            store.dialog = undefined;

            store.openDialog({ message });
            expect( store.dialog ).toEqual({
                type: "info",
                title: "",
                message,
                confirm: undefined,
                cancel: undefined
            });
        });

        it( "should allow opening dialogs with additional titles and action buttons", () => {
            const store = useSystemStore();
            store.dialog = undefined;

            const type = "error";
            const title = "bar";
            const confirm = vi.fn();
            const cancel = vi.fn();

            store.openDialog({ type, message, title, confirm, cancel });
            expect( store.dialog ).toEqual({ type, message, title, confirm, cancel });
        });

        it( "should be able to close an active dialog", () => {
            const store = useSystemStore();
            store.dialog = { message, type: "info" };
            store.closeDialog();
            expect( store.dialog ).toBeUndefined();
        });

        it( "should be able to open an error dialog", () => {
            const store = useSystemStore();
            store.dialog = undefined;
            store.showError( message );
            expect( store.dialog ).toEqual({
                type: "error",
                title: expect.any( String ),
                cancel: undefined,
                confirm: undefined,
                message,
            });
        });
    });
});
