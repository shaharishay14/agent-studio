import { create } from 'zustand'

interface DarkModeStore {
    isDarkMode: boolean
    setIsDarkMode: (isDarkMode: boolean) => void,
    toggleDarkMode: () => void
}

const useDarkModeStore = create<DarkModeStore>((set) => ({
    isDarkMode: false,
    setIsDarkMode: (isDarkMode: boolean) => set({ isDarkMode }),
    toggleDarkMode:() => set((state) => ({ isDarkMode: !state.isDarkMode }))
}))

export default useDarkModeStore