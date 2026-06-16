import { create } from "zustand";
import { appsMeta, type AppId } from "@/components/desktop/registry";

export type WindowInstance = {
  id: AppId; // singleton apps: instance id === appId
  appId: AppId;
  title: string;
  icon: string;
  img?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  prev?: { x: number; y: number; w: number; h: number };
};

type DesktopState = {
  windows: WindowInstance[];
  zCounter: number;
  focusedId: AppId | null;
  startOpen: boolean;

  openApp: (appId: AppId) => void;
  closeApp: (id: AppId) => void;
  focus: (id: AppId) => void;
  move: (id: AppId, x: number, y: number) => void;
  resize: (id: AppId, w: number, h: number) => void;
  toggleMinimize: (id: AppId) => void;
  toggleMaximize: (id: AppId) => void;
  setStartOpen: (open: boolean) => void;
};

const isBrowser = typeof window !== "undefined";

function spawnPosition(index: number, w: number, h: number) {
  const vw = isBrowser ? window.innerWidth : 1280;
  const vh = isBrowser ? window.innerHeight : 800;
  const baseX = Math.max(24, (vw - w) / 2);
  const baseY = Math.max(24, (vh - h) / 2 - 30);
  const offset = (index % 6) * 28;
  return { x: baseX + offset, y: Math.max(16, baseY - 40 + offset) };
}

export const useDesktop = create<DesktopState>((set, get) => ({
  windows: [],
  zCounter: 10,
  focusedId: null,
  startOpen: false,

  openApp: (appId) => {
    const state = get();
    const existing = state.windows.find((w) => w.id === appId);
    const z = state.zCounter + 1;
    if (existing) {
      set({
        windows: state.windows.map((w) =>
          w.id === appId ? { ...w, minimized: false, z } : w,
        ),
        zCounter: z,
        focusedId: appId,
        startOpen: false,
      });
      return;
    }
    const meta = appsMeta[appId];
    const w = Math.min(meta.w, isBrowser ? window.innerWidth - 32 : meta.w);
    const h = Math.min(meta.h, isBrowser ? window.innerHeight - 96 : meta.h);
    const { x, y } = spawnPosition(state.windows.length, w, h);
    const win: WindowInstance = {
      id: appId,
      appId,
      title: meta.title,
      icon: meta.icon,
      img: meta.img,
      x,
      y,
      w,
      h,
      z,
      minimized: false,
      maximized: false,
    };
    set({
      windows: [...state.windows, win],
      zCounter: z,
      focusedId: appId,
      startOpen: false,
    });
  },

  closeApp: (id) =>
    set((s) => ({
      windows: s.windows.filter((w) => w.id !== id),
      focusedId: s.focusedId === id ? null : s.focusedId,
    })),

  focus: (id) =>
    set((s) => {
      const z = s.zCounter + 1;
      return {
        windows: s.windows.map((w) => (w.id === id ? { ...w, z, minimized: false } : w)),
        zCounter: z,
        focusedId: id,
      };
    }),

  move: (id, x, y) =>
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)) })),

  resize: (id, w, h) =>
    set((s) => ({
      windows: s.windows.map((win) =>
        win.id === id ? { ...win, w: Math.max(320, w), h: Math.max(220, h) } : win,
      ),
    })),

  toggleMinimize: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: !w.minimized } : w)),
      focusedId: s.focusedId === id ? null : s.focusedId,
    })),

  toggleMaximize: (id) =>
    set((s) => {
      const vw = isBrowser ? window.innerWidth : 1280;
      const vh = isBrowser ? window.innerHeight : 800;
      const z = s.zCounter + 1;
      return {
        zCounter: z,
        focusedId: id,
        windows: s.windows.map((w) => {
          if (w.id !== id) return w;
          if (w.maximized && w.prev) {
            return { ...w, ...w.prev, maximized: false, prev: undefined, z };
          }
          return {
            ...w,
            prev: { x: w.x, y: w.y, w: w.w, h: w.h },
            x: 8,
            y: 8,
            w: vw - 16,
            h: vh - 64,
            maximized: true,
            z,
          };
        }),
      };
    }),

  setStartOpen: (open) => set({ startOpen: open }),
}));
