import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("connectionState", () => {
    let online = true
    const handlers = new Map<string, () => void>()
    const realNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator")
    beforeEach(() => {
        vi.resetModules()
        ;(globalThis as any).window = { addEventListener: (name: string, fn: () => void) => handlers.set(name, fn) }
        // Node's navigator is a getter-only global: replace the property, not the value.
        Object.defineProperty(globalThis, "navigator", { value: { get onLine() { return online } }, configurable: true })
    })
    afterEach(() => {
        delete (globalThis as any).window
        if (realNavigator) Object.defineProperty(globalThis, "navigator", realNavigator)
        handlers.clear()
        online = true
    })

    it("reflects navigator.onLine and notifies subscribers on the browser events", async () => {
        const { isOnline, subscribeOnline } = await import("./connectionState")
        expect(isOnline()).toBe(true)
        const seen = vi.fn()
        const unsubscribe = subscribeOnline(seen)
        online = false
        handlers.get("offline")!()
        expect(isOnline()).toBe(false)
        expect(seen).toHaveBeenCalledTimes(1)
        unsubscribe()
        handlers.get("online")!()
        expect(seen).toHaveBeenCalledTimes(1)
    })
})
