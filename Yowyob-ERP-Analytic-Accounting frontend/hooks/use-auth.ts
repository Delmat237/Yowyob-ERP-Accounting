import { create } from "zustand";
import { AccountingRole } from "@/lib/roles";

interface User {
    id: string;
    name: string;
    email: string;
    roles: string[];
    avatarUrl?: string;
}

interface AuthState {
    user: User | null;
    accountingRole: AccountingRole | null;
    isAuthenticated: boolean;
    initFromStorage: () => void;
    setUser: (user: User | null) => void;
    clear: () => void;
}

function extractRole(roles?: string[]): AccountingRole | null {
    if (!roles) return null;
    if (roles.includes("RESPONSABLE_COMPTABLE")) return "RESPONSABLE_COMPTABLE";
    if (roles.includes("COMPTABLE")) return "COMPTABLE";
    return null;
}

export const useAuth = create<AuthState>((set) => ({
    user: null,
    accountingRole: null,
    isAuthenticated: false,

    initFromStorage: () => {
        try {
            const raw = localStorage.getItem("analytic_user");
            if (raw) {
                const user: User = JSON.parse(raw);
                set({ user, accountingRole: extractRole(user.roles), isAuthenticated: true });
            } else {
                // Default demo user
                const demoUser: User = {
                    id: "demo-1",
                    name: "Jean Dupont",
                    email: "j.dupont@yowyob.com",
                    roles: ["RESPONSABLE_COMPTABLE"],
                };
                set({ user: demoUser, accountingRole: "RESPONSABLE_COMPTABLE", isAuthenticated: true });
            }
        } catch {
            // ignore
        }
    },

    setUser: (user) => {
        if (user) {
            set({ user, accountingRole: extractRole(user.roles), isAuthenticated: true });
        } else {
            set({ user: null, accountingRole: null, isAuthenticated: false });
        }
    },

    clear: () => set({ user: null, accountingRole: null, isAuthenticated: false }),
}));
