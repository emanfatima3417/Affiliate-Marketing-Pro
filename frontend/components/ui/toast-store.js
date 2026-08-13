"use client";
import { useSyncExternalStore } from "react";

let toasts = [];
let listeners = [];

function emitChange() {
  listeners.forEach((l) => l());
}

export const toastStore = {
  subscribe(listener) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  getSnapshot() {
    return toasts;
  },
  add(toast) {
    const id = Math.random().toString(36).slice(2);
    toasts = [...toasts, { id, ...toast }];
    emitChange();
    setTimeout(() => toastStore.remove(id), toast.duration || 4000);
  },
  remove(id) {
    toasts = toasts.filter((t) => t.id !== id);
    emitChange();
  },
};

export function useToasts() {
  return useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot, () => []);
}

export function toast({ title, description, variant = "default" }) {
  toastStore.add({ title, description, variant });
}
