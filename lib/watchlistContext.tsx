"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface WatchlistItem {
  symbol: string;
  name: string;
  addedAt: number;
  score?: number;
  riskLevel?: "low" | "medium" | "high";
  price?: number;
}

interface WatchlistCtx {
  items: WatchlistItem[];
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addToWatchlist: (
    symbol: string,
    name: string,
    score?: number,
    riskLevel?: "low" | "medium" | "high",
    price?: number
  ) => void;
  removeFromWatchlist: (symbol: string) => void;
  isWatched: (symbol: string) => boolean;
}

const Ctx = createContext<WatchlistCtx | null>(null);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("quantify_watchlist");
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("quantify_watchlist", JSON.stringify(items));
    } catch {}
  }, [items]);

  const addToWatchlist = useCallback(
    (symbol: string, name: string, score?: number, riskLevel?: "low" | "medium" | "high", price?: number) => {
      setItems((prev) => {
        if (prev.some((i) => i.symbol === symbol)) return prev;
        return [...prev, { symbol, name, addedAt: Date.now(), score, riskLevel, price }];
      });
    },
    []
  );

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
