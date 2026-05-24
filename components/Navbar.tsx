"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useWatchlist } from "@/lib/watchlistContext";

export default function Navbar() {
  const { scrollY } = useScroll();
  const bg           = useTransform(scrollY, [0, 80], ["rgba(4,6,15,0)", "rgba(4,6,15,0.92)"]);
  const blur         = useTransform(scrollY, [0, 80], ["blur(0px)", "blur(16px)"]);
  const borderOpacity= useTransform(scrollY, [0, 80], [0, 0.12]);

  const { items, toggleDrawer } = useWatchlist();
  const count = items.length;

  return (
    <motion.nav
      style={{ backgroundColor: bg, backdropFilter: blur }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <motion.div
        style={{ borderBottomColor: `rgba(255,255,255,${borderOpacity})` }}
        className="border-b border-transparent"
      >
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">

          {/* Logo */}
          <motion.a
            href="/"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/30"
              >
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              </motion.div>
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-[#04060f] animate-pulse" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">
                StockSage{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">AI</span>
              </span>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">Investment Research</p>
            </div>
          </motion.a>

          {/* Center links */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="hidden md:flex items-center gap-1"
          >
            <a
              href="/dashboard"
              className="relative group px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              Dashboard
            </a>

            {/* Watchlist nav link */}
            <motion.button
              onClick={toggleDrawer}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              Watchlist
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-cyan-500 text-[10px] font-black text-white"
                >
                  {count}
                </motion.span>
              )}
            </motion.button>
          </motion.div>

          {/* Right side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 rounded-full px-3 py-1.5 border border-white/10 bg-white/5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Live Markets
            </div>

            {/* Mobile watchlist icon */}
            <motion.button
              onClick={toggleDrawer}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="relative md:hidden h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-cyan-500 text-[9px] font-black text-white flex items-center justify-center">
                  {count}
                </span>
              )}
            </motion.button>
          </motion.div>

        </div>
      </motion.div>
    </motion.nav>
  );
}
