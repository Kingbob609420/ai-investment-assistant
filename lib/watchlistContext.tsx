"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface WatchlistItem {
  symbol: string;
  name: string;
  addedAt: number;
}

interface WatchlistCtx {
  items: WatchlistItem[];
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addToWatchlist: (symbol: string, name: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  isWatched: (symbol: string) => boolean;
}

const Ctx = createContext<WatchlistCtx | null>(null);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("stocksage_watchlist");
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  // Persist whenever items change
  useEffect(() => {
    try {
      localStorage.setItem("stocksage_watchlist", JSON.stringify(items));
    } catch {}
  }, [items]);

  const addToWatchlist = useCallback((symbol: string, name: string) => {
    setItems((prev) => {
      if (prev.some((i) => i.symbol === symbol)) return prev;
      return [...prev, { symbol, name, addedAt: Date.now() }];
    });
  }, []);

  const removeFromWatchlist = useCallback((symbol: string) => {
    setItems((prev) => prev.filter((i) => i.symbol !== symbol));
  }, []);

  const isWatched = useCallback(
    (symbol: string) => items.some((i) => i.symbol === symbol),
    [items]
  );

  return (
    <Ctx.Provider
      value={{
        items,
        isOpen,
        openDrawer: () => setIsOpen(true),
        closeDrawer: () => setIsOpen(false),
        toggleDrawer: () => setIsOpen((v) => !v),
        addToWatchlist,
        removeFromWatchlist,
        isWatched,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useWatchlist() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWatchlist must be inside WatchlistProvider");
  return ctx;
}
