'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  token: string | null;
  name: string | null;
  image: string | null;
  setToken: (token: string, name: string, image?: string) => void;
  clearToken: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: null,
      name: null,
      image: null,
      setToken: (token, name, image) => set({ token, name, image: image ?? null }),
      clearToken: () => set({ token: null, name: null, image: null }),
    }),
    { name: 'ox-user' },
  ),
);
