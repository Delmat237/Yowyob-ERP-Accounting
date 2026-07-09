const DB_NAME = "yowyob_erp_offline";
const DB_VERSION = 1;

export type StoreName = "entities" | "outbox" | "meta";

function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined") {
            reject(new Error("IndexedDB indisponible côté serveur"));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(request.error ?? new Error("Ouverture IndexedDB échouée"));
        };

        request.onblocked = () => {
            console.warn("[IndexedDB] Mise à jour bloquée — fermez les autres onglets KSM.");
        };

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains("entities")) {
                const entities = db.createObjectStore("entities", { keyPath: "key" });
                entities.createIndex("entity", "entity", { unique: false });
                entities.createIndex("entityId", "entityId", { unique: false });
                entities.createIndex("updatedAt", "updatedAt", { unique: false });
            }
            if (!db.objectStoreNames.contains("outbox")) {
                const outbox = db.createObjectStore("outbox", { keyPath: "id" });
                outbox.createIndex("status", "status", { unique: false });
                outbox.createIndex("createdAt", "createdAt", { unique: false });
                outbox.createIndex("entity", "entity", { unique: false });
            }
            if (!db.objectStoreNames.contains("meta")) {
                db.createObjectStore("meta", { keyPath: "key" });
            }
        };

        request.onsuccess = () => resolve(request.result);
    });
}

function isInvalidStateError(error: unknown): boolean {
    return error instanceof DOMException && error.name === "InvalidStateError";
}

/**
 * Ouvre une connexion, exécute une transaction, puis ferme — évite les connexions périmées.
 */
async function withTransaction<T>(
    store: StoreName,
    mode: IDBTransactionMode,
    run: (objectStore: IDBObjectStore) => IDBRequest<T> | void,
    extract?: (req: IDBRequest<T>) => T,
): Promise<T> {
    const attempt = async (): Promise<T> => {
        const db = await openDatabase();
        try {
            return await new Promise<T>((resolve, reject) => {
                let tx: IDBTransaction;
                try {
                    tx = db.transaction(store, mode);
                } catch (error) {
                    reject(error);
                    return;
                }

                const objectStore = tx.objectStore(store);
                const req = run(objectStore);

                tx.oncomplete = () => {
                    if (req && extract) {
                        resolve(extract(req as IDBRequest<T>));
                    } else {
                        resolve(undefined as T);
                    }
                };
                tx.onerror = () => reject(tx.error ?? new Error("Transaction IndexedDB échouée"));
                tx.onabort = () => reject(tx.error ?? new Error("Transaction IndexedDB annulée"));

                if (req) {
                    req.onerror = () => reject(req.error);
                }
            });
        } finally {
            db.close();
        }
    };

    try {
        return await attempt();
    } catch (error) {
        if (isInvalidStateError(error)) {
            return attempt();
        }
        throw error;
    }
}

/** @deprecated Préférer les helpers idbGet/idbPut — conservé pour compatibilité. */
export function getDb(): Promise<IDBDatabase> {
    return openDatabase();
}

export async function idbGet<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> {
    return withTransaction(store, "readonly", (s) => s.get(key), (req) => req.result as T | undefined);
}

export async function idbGetAll<T>(store: StoreName): Promise<T[]> {
    return withTransaction(store, "readonly", (s) => s.getAll(), (req) => (req.result ?? []) as T[]);
}

export async function idbGetAllByIndex<T>(
    store: StoreName,
    indexName: string,
    query: IDBValidKey | IDBKeyRange,
): Promise<T[]> {
    return withTransaction(
        store,
        "readonly",
        (s) => s.index(indexName).getAll(query),
        (req) => (req.result ?? []) as T[],
    );
}

export async function idbPut<T>(store: StoreName, value: T): Promise<void> {
    await withTransaction(store, "readwrite", (s) => {
        s.put(value);
    });
}

export async function idbDelete(store: StoreName, key: IDBValidKey): Promise<void> {
    await withTransaction(store, "readwrite", (s) => {
        s.delete(key);
    });
}
