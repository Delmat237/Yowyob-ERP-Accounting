import React from 'react';
import { create } from 'zustand/react';

interface ComposeState {
    isOpen: boolean;
    isMinimized: boolean;
    isMaximized: boolean;
    title: string;
    content: React.ReactNode | null;
    onOpen: (props: { title: string; content: React.ReactNode; isMaximized?: boolean }) => void;
    onClose: () => void;
    onToggleMinimize: () => void;
    onToggleMaximize: () => void;
}

export const useCompose = create<ComposeState>((set) => ({
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    title: '',
    content: null,
    onOpen: ({ title, content, isMaximized = true }) => set({
        isOpen: true,
        isMinimized: false,
        isMaximized,
        title,
        content
    }),
    onClose: () => set({
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        title: '',
        content: null
    }),
    onToggleMinimize: () => set((state) => ({ isMinimized: !state.isMinimized })),
    onToggleMaximize: () => set((state) => ({ isMaximized: !state.isMaximized })),
}));