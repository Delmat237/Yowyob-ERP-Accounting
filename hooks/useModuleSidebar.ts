import { create } from 'zustand/react';

interface ModuleSidebarState {
  isCollapsed: boolean;
  toggle: () => void;
}

export const useModuleSidebar = create<ModuleSidebarState>((set) => ({
  isCollapsed: false,
  toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
}));