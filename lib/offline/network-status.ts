export type NetworkMode = "online" | "offline";

type NetworkListener = (mode: NetworkMode) => void;

const MAX_CONSECUTIVE_FAILURES = 2;

class NetworkStatusManager {
    private mode: NetworkMode =
        typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline";

    private consecutiveFailures = 0;
    private listeners = new Set<NetworkListener>();

    constructor() {
        if (typeof window === "undefined") return;
        window.addEventListener("online", this.handleBrowserOnline);
        window.addEventListener("offline", this.handleBrowserOffline);
    }

    getMode(): NetworkMode {
        return this.mode;
    }

    isOnline(): boolean {
        return this.mode === "online";
    }

    subscribe(listener: NetworkListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    reportApiSuccess(): void {
        this.consecutiveFailures = 0;
        if (this.mode !== "online") this.setMode("online");
    }

    reportApiNetworkFailure(): void {
        this.consecutiveFailures += 1;
        if (this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            this.setMode("offline");
        }
    }

    private handleBrowserOnline = (): void => {
        if (this.consecutiveFailures === 0) {
            this.setMode("online");
        }
    };

    private handleBrowserOffline = (): void => {
        this.setMode("offline");
    };

    private setMode(next: NetworkMode): void {
        if (this.mode === next) return;
        this.mode = next;
        this.listeners.forEach((l) => l(next));
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent(`network:${next}`));
        }
    }
}

export const networkStatus = new NetworkStatusManager();

/** Hors ligne navigateur ou mode réseau applicatif offline. */
export function isClientOffline(): boolean {
    return (
        typeof navigator !== "undefined" &&
        (!navigator.onLine || !networkStatus.isOnline())
    );
}

export function isNetworkError(error: unknown): boolean {
    if (error instanceof TypeError) return true;
    const status = (error as { status?: number })?.status;
    return status === 0;
}
