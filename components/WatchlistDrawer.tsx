"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useWatchlist, WatchlistItem } from "@/lib/watchlistContext";

interface Props {
  onSelect: (symbol: string) => void;
}

const RISK_CFG = {
  low:    { label: "Low Risk",    bg: "bg-green-500/15",  text: "text-green-400",  border: "border-green-500/25" },
  medium: { label: "Med Risk",    bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/25" },
  high:   { label: "High Risk",   bg: "bg-red-500/15",    text: "text-red-400",    border: "border-red-500/25" },
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "text-cyan-400 bg-cyan-500/15 border-cyan-500/30"
    : score >= 50 ? "text-orange-400 bg-orange-500/15 border-orange-500/30"
    : "text-red-400 bg-red-500/15 border-red-500/30";
  return (
    <div className={`flex flex-col items-center justify-center h-14 w-14 rounded-xl border shrink-0 ${color}`}>
      <span className="text-xl font-black leading-none">{score}</span>
      <span className="text-[9px] opacity-70 mt-0.5">/100</span>
    </div>
  );
}

function WatchCard({ item, onAnalyze, onRemove }: { item: WatchlistItem; onAnalyze: () => void; onRemove: () => void }) {
  const risk = item.riskLevel ? RISK_CFG[item.riskLevel] : null;
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 hover:border-white/15 hover:bg-white/[0.05] transition-all">
      <div className="flex items-start gap-3">
        {item.score !== undefined ? (
          <ScoreBadge score={item.score} />
        ) : (
          <div className="h-14 w-14 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-black text-slate-500">{item.symbol.slice(0, 3)}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-white">{item.symbol}</span>
            {risk && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${risk.bg} ${risk.text} ${risk.border}`}>
                {risk.label}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5">{item.name}</p>
          <div className="flex items-center gap-3 mt-1.5">
            {item.price !== undefined && (
              <span className="text-xs font-semibold text-slate-300">${item.price.toFixed(2)}</span>
            )}
            <span className="text-[10px] text-slate-700">
              Added {new Date(item.addedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={onAnalyze}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 py-2 text-xs font-bold text-cyan-400 hover:bg-cyan-500/25 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Analyze
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={onRemove}
          className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}

export default function WatchlistDrawer({ onSelect }: Props) {
  const { items, isOpen, closeDrawer, removeFromWatchlist } = useWatchlist();

  const avgScore = items.length > 0 && items.some((i) => i.score !== undefined)
    ? Math.round(items.filter((i) => i.score !== undefined).reduce((a, i) => a + i.score!, 0) / items.filter((i) => i.score !== undefined).length)
    : null;

  function handleSelect(symbol: string) {
    onSelect(symbol);
    closeDrawer();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[420px] max-w-[95vw] flex flex-col bg-[#07091a] border-l border-white/10 shadow-2xl"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/8">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">My Watchlist</p>
                    <p className="text-[10px] text-slate-500">{items.length} stock{items.length !== 1 ? "s" : ""} saved</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeDrawer}
                  className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* Portfolio summary row */}
              {items.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-center">
                    <p className="text-base font-black text-white">{items.length}</p>
                    <p className="text-[10px] text-slate-600">Stocks</p>
                  </div>
                  <div className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-center">
                    <p className={`text-base font-black ${avgScore !== null && avgScore >= 70 ? "text-cyan-400" : avgScore !== null && avgScore >= 50 ? "text-orange-400" : "text-slate-400"}`}>
                      {avgScore ?? "–"}
                    </p>
                    <p className="text-[10px] text-slate-600">Avg Score</p>
                  </div>
                  <div className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-center">
                    <p className="text-base font-black text-red-400">
                      {items.filter((i) => i.riskLevel === "high").length}
                    </p>
                    <p className="text-[10px] text-slate-600">High Risk</p>
                  </div>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence initial={false}>
                {items.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-64 text-center"
                  >
                    <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mb-4">
                      <svg className="h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-slate-400">No stocks saved yet</p>
                    <p className="text-xs text-slate-600 mt-2 max-w-[220px] leading-relaxed">
                      Search any stock, view its AI analysis, and click the bookmark icon to save it here.
                    </p>
                  </motion.div>
                ) : (
                  items.map((item, i) => (
                    <motion.div
                      key={item.symbol}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30, height: 0, marginBottom: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                    >
                      <WatchCard
                        item={item}
                        onAnalyze={() => handleSelect(item.symbol)}
                        onRemove={() => removeFromWatchlist(item.symbol)}
                      />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {items.length > 0 && (
              <div className="px-5 py-3 border-t border-white/8">
                <p className="text-[11px] text-slate-700 text-center">
                  Score = AI attractiveness rating · Risk based on volatility
                </p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
