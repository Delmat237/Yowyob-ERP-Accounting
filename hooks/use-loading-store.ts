import { create } from 'zustand/react';

interface LoadingState {
    isLoading: boolean;
    progress: number;
    setIsLoading: (isLoading: boolean) => void;
    setProgress: (progress: number) => void;
    startLoading: () => void;
    stopLoading: () => void;
}

let safetyTimer: NodeJS.Timeout | null = null;

export const useLoadingStore = create<LoadingState>((set) => ({
    isLoading: false,
    progress: 0,
    setIsLoading: (isLoading) => set({ isLoading, progress: isLoading ? 0 : 0 }),
    setProgress: (progress) => set({ progress }),
    startLoading: () => {
        if (safetyTimer) clearTimeout(safetyTimer);
        set({ isLoading: true, progress: 0 });

        // Safety timeout if the page fails to mount or stopLoading is not called
        safetyTimer = setTimeout(() => {
            set({ isLoading: false, progress: 0 });
        }, 8000); // 8 second safety
    },
    stopLoading: () => {
        if (safetyTimer) clearTimeout(safetyTimer);
        set({ isLoading: false, progress: 0 });
    },
}));
