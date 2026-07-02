import { create } from "zustand";
import { ModuleKey } from "@/config/navigation";

interface NavigationState {
    activeModule: ModuleKey;
    setActiveModule: (key: ModuleKey) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
    activeModule: "dashboard",
    setActiveModule: (key) => set({ activeModule: key }),
}));
