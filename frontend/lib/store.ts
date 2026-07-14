"use client";

import { create } from "zustand";

interface UIState {
  selectedDocId: string | null;
  currentPage: number;
  setSelectedDocId: (id: string | null) => void;
  setCurrentPage: (page: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedDocId: null,
  currentPage: 1,
  setSelectedDocId: (id) => set({ selectedDocId: id }),
  setCurrentPage: (page) => set({ currentPage: page }),
}));
