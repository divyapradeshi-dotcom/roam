import { useSyncExternalStore } from "react";

const favoriteIds = new Set<string>();
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function isFavorite(id: string): boolean {
  return favoriteIds.has(id);
}

export function toggleFavorite(id: string): boolean {
  let nowFavorite = false;
  if (favoriteIds.has(id)) {
    favoriteIds.delete(id);
    nowFavorite = false;
  } else {
    favoriteIds.add(id);
    nowFavorite = true;
  }
  notify();
  return nowFavorite;
}

export function subscribeFavorites(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getFavoritesSnapshot(): Set<string> {
  return favoriteIds;
}

export function useIsFavorite(id: string): boolean {
  return useSyncExternalStore(
    subscribeFavorites,
    () => favoriteIds.has(id),
    () => false,
  );
}

