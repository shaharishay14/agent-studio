import { create } from 'zustand'

export interface User {
  agent_country: string
  username: string
  email: string
  id:string;
}

interface UserStore {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
  isAuthenticated: boolean
  setIsAuthenticated: (isAuthenticated: boolean) => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isAuthenticated: false,
  setIsAuthenticated: (isAuthenticated: boolean) => set({ isAuthenticated }),
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))

