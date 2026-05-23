"use client";

import { useState, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TimeRange } from "@/lib/types";

const POPULAR = ["AAPL", "TSLA", "NVDA", "MSFT", "GOOGL", "AMZN", "META", "SPY"];
const RANGES: TimeRange[] = ["1M", "3M", "6M", "1Y", "2Y", "5Y"];

interface Props {
  onSearch: (symbol: string, range: TimeRange) => void;
  loading: boolean;
}

export default function StockSearch({ onSearch, loading }: Props) {
  const [input, setInput] = useState("");
  const [range, setRange] = useState<TimeRange>("1Y");
  const [focused, setFocused] = useState(false);

  function handleSearch() {
    const sym = input.trim().toUpperCase();
    if (!sym) return;
    onSearch(sym, range);
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSearch();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      {/* Main search row */}
      <div className="flex gap-3">
        <motion.div
          animate={focused ? { scale: 1.005 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
          className="relative flex-1 group"
        >
          {/* Glow behind input */}
          <motion.div
            animate={focused ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute -inset-px rounded-2xl bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 blur-lg"
          />

          <div
            className={`relative flex items-center rounded-2xl border bg-white/5 backdrop-blur-sm overflow-hidden transition-all duration-300 ${
              focused ? "border-cyan-500/60" : "border-white/10 hover:border-white/20"
            }`}
          >
            <motion.div
              animate={focused ? { color: "#22d3ee" } : { color: "#64748b" }}
              className="ml-4 shrink-0"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </motion.div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={handleKey}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Enter ticker symbol  —  AAPL, TSLA, NVDA..."
              className="flex-1 bg-transparent px-3 py-4 text-white placeholder-slate-600 text-sm focus:outline-none font-medium"
              maxLength={10}
            />

            <AnimatePresence>
              {input && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setInput("")}
                  className="mr-3 text-slate-600 hover:text-white transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.04, boxShadow: "0 0 24px rgba(34,211,238,0.4)" }}
          whileTap={{ scale: 0.96 }}
          onClick={handleSearch}
          disabled={loading || !input.trim()}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {/* Shimmer overlay on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
            initial={{ x: "-100%" }}
            whileHover={{ x: "200%" }}
            transition={{ duration: 0.5 }}
          />
          <div className="relative flex items-center gap-2">
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Analyze
              </>
            )}
          </div>
        </motion.button>
      </div>

      {/* Controls row */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {/* Time ranges */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-600 font-medium uppercase tracking-wider">Range</span>
          <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            {RANGES.map((r) => (
              <motion.button
                key={r}
                onClick={() => setRange(r)}
                whileTap={{ scale: 0.92 }}
                className={`relative rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                  range === r ? "text-white" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {range === r && (
                  <motion.div
                    layoutId="range-pill"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-500/40"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{r}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Popular tickers */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-600 font-medium uppercase tracking-wider">Popular</span>
          <div className="flex gap-1.5 flex-wrap">
            {POPULAR.map((sym, i) => (
              <motion.button
                key={sym}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => { setInput(sym); onSearch(sym, range); }}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all duration-200"
              >
                {sym}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
