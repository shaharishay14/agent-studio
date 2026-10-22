import { create } from 'zustand'

// Sky is dark only. Light-mode code stays in place; flip this to bring the theme toggle back.
export const DARK_ONLY = true

interface DarkModeStore {
    isDarkMode: boolean
    setIsDarkMode: (isDarkMode: boolean) => void,
    toggleDarkMode: () => void
}

const useDarkModeStore = create<DarkModeStore>((set) => ({
    isDarkMode: DARK_ONLY,
    setIsDarkMode: (isDarkMode: boolean) => set({ isDarkMode: DARK_ONLY || isDarkMode }),
    toggleDarkMode:() => set((state) => ({ isDarkMode: DARK_ONLY || !state.isDarkMode }))
}))

export default useDarkModeStore
