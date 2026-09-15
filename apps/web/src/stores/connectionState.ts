import { useSyncExternalStore } from "react"

// navigator.onLine, kept as a subscribable value for the banner and the pagination guard.
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())
if (typeof window !== "undefined") {
    window.addEventListener("online", notify)
    window.addEventListener("offline", notify)
}

export const isOnline = (): boolean => typeof navigator === "undefined" || navigator.onLine

export const subscribeOnline = (listener: () => void) => {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
}

export const useOnlineStatus = (): boolean => useSyncExternalStore(subscribeOnline, isOnline, () => true)
