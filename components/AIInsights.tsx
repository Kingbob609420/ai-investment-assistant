"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AIInsight, StockMetrics } from "@/lib/types";
import { useWatchlist } from "@/lib/watchlistContext";

interface Props {
  insights: AIInsight;
  metrics: StockMetrics;
  symbol: string;
  companyName: string;
}

/* ── Score ring ─────────────────────────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const radius = 40;
  const circ   = 2 * Math.PI * radius;
  const color  = score >= 70 ? "#22d3ee" : score >= 50 ? "#fb923c" : "#f87171";
  const glowRgb= score >= 70 ? "34,211,238" : score >= 50 ? "251,146,60" : "248,113,113";

  return (
    <div className="relative h-28 w-28 flex items-center justify-center shrink-0">
      <motion.div
        animate={{ scale: [1, 1.35, 1], opacity: [0.25, 0, 0.25] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle, rgba(${glowRgb},0.35) 0%, transparent 70%)` }}
      />
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#ffffff08" strokeWidth="7" />
        <motion.circle
          cx="48" cy="48" r={radius}
          fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (score / 100) * circ }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="text-center z-10">
        <motion.p
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          className="text-3xl font-black" style={{ color }}
        >
          {score}
        </motion.p>
        <p className="text-[10px] text-slate-600 -mt-0.5">/100</p>
      </div>
    </div>
  );
}

/* ── Expandable insight card ─────────────────────────────────────────────── */
function InsightCard({
  icon, label, text, accent, delay = 0,
}: {
  icon: string; label: string; text: string; accent: string; delay?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const preview = text.length > 100 ? text.slice(0, 100) + "…" : text;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-white/8 bg-white/[0.03] overflow-hidden hover:border-white/15 transition-colors"
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-sm shrink-0 ${accent}`}>
          {icon}
        </div>
        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest flex-1">{label}</span>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="text-slate-600 shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {!expanded && (
          <motion.p
            key="preview"
            initial={false}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4 text-sm text-slate-500 leading-relaxed -mt-1"
          >
            {preview}
          </motion.p>
        )}
        {expanded && (
          <motion.p
            key="full"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="px-4 pb-4 text-sm text-slate-400 leading-relaxed -mt-1"
          >
            {text}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── "Should I Invest?" verdict ─────────────────────────────────────────── */
function InvestVerdict({ score, metrics }: { score: number; metrics: StockMetrics }) {
  const [open, setOpen] = useState(false);

  const verdict =
    score >= 75 && metrics.trendDirection === "bullish"
      ? { label: "Consider Buying", color: "text-green-400", bg: "from-green-500/15 to-green-500/5", border: "border-green-500/25", icon: "✅",
          text: `The indicators align positively. The stock is in a bullish trend with a score of ${score}/100. If this fits your risk tolerance and portfolio, it may be worth a small position. Start with no more than 2–5% of your portfolio.` }
      : score >= 60
      ? { label: "Watch & Wait", color: "text-yellow-400", bg: "from-yellow-500/15 to-yellow-500/5", border: "border-yellow-500/25", icon: "👀",
          text: `The stock shows some positive signs but isn't a clear-cut buy yet. Add it to your watchlist, wait for a confirmed trend, or look for a better entry price. Score: ${score}/100.` }
      : score >= 45
      ? { label: "Hold Off For Now", color: "text-orange-400", bg: "from-orange-500/15 to-orange-500/5", border: "border-orange-500/25", icon: "⏸️",
          text: `Mixed signals suggest this isn't the best time to enter. Volatility is elevated relative to potential return. Consider waiting for clarity before committing capital. Score: ${score}/100.` }
      : { label: "Avoid For Now", color: "text-red-400", bg: "from-red-500/15 to-red-500/5", border: "border-red-500/25", icon: "🚫",
          text: `The current risk-reward ratio looks unfavorable. The stock shows signs of weakness. It's better to wait for stabilization or find a stronger opportunity elsewhere. Score: ${score}/100.` };

  return (
    <div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 hover:border-white/20 hover:bg-white/[0.07] transition-all"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🤔</span>
          <span className="text-sm font-bold text-white">Should I Invest?</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${verdict.color}`}>{verdict.label}</span>
          <motion.svg
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="h-4 w-4 text-slate-600"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </motion.svg>
        </div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className={`mt-2 rounded-xl border ${verdict.border} bg-gradient-to-br ${verdict.bg} p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{verdict.icon}</span>
                <span className={`text-sm font-black ${verdict.color}`}>{verdict.label}</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{verdict.text}</p>
              <p className="text-[11px] text-slate-600 mt-3 pt-3 border-t border-white/5">
                ⚠️ Not financial advice — always do your own research and consult a licensed advisor.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function AIInsights({ insights, metrics, symbol, companyName }: Props) {
  const { score, confidence } = insights;
  const trend = metrics.trendDirection;
  const [copied, setCopied] = useState(false);

  const { isWatched, addToWatchlist, removeFromWatchlist, openDrawer } = useWatchlist();
  const watched = isWatched(symbol);

  const verdict     = score >= 75 ? "Strong Signal" : score >= 60 ? "Moderate Signal" : score >= 45 ? "Neutral — Watch" : "Caution";
  const verdictColor= score >= 70 ? "text-cyan-400"  : score >= 50 ? "text-orange-400"  : "text-red-400";

  const trendConfig = {
    bullish: { label: "Bullish", bg: "bg-green-500/10",  text: "text-green-400",  border: "border-green-500/20" },
    bearish: { label: "Bearish", bg: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500/20" },
    neutral: { label: "Neutral", bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  }[trend];

  function copyReport() {
    const report = [
      `StockSage AI Report — ${symbol} (${companyName})`,
      `Score: ${score}/100  |  Trend: ${trend}  |  Confidence: ${confidence}`,
      ``,
      `SUMMARY`,  insights.summary,
      ``,
      `MOMENTUM`, insights.momentum,
      ``,
      `RISK`,     insights.risk,
      ``,
      `TREND`,    insights.trend,
      ``,
      `RECOMMENDATION`, insights.recommendation,
      ``,
      `Generated by StockSage AI — for educational use only.`,
    ].join("\n");

    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleWatchlist() {
    if (watched) {
      removeFromWatchlist(symbol);
    } else {
      addToWatchlist(symbol, companyName);
      openDrawer();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 space-y-5"
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 15 }}
            className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0"
          >
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </motion.div>
          <div>
            <h3 className="text-base font-bold text-white">AI Research Insights</h3>
            <p className="text-xs text-slate-500">Rule-based · <span className="capitalize">{confidence}</span> confidence</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Watchlist toggle */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleWatchlist}
            title={watched ? "Remove from watchlist" : "Add to watchlist"}
            className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all ${
              watched
                ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
                : "bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-white/20"
            }`}
          >
            <svg className="h-4 w-4" fill={watched ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </motion.button>

          {/* Copy report */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={copyReport}
            title="Copy report"
            className="h-8 px-3 rounded-lg border border-white/10 bg-white/5 text-slate-500 hover:text-white hover:border-white/20 flex items-center gap-1.5 text-xs font-medium transition-all"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-green-400 flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Copied
                </motion.span>
              ) : (
                <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Copy
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Score + verdict */}
      <div className="flex items-center gap-5 rounded-xl border border-white/8 bg-white/[0.03] p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent" />
        <ScoreRing score={score} />
        <div className="relative">
          <p className={`text-2xl font-black ${verdictColor}`}>{verdict}</p>
          <p className="text-xs text-slate-500 mt-1">{symbol} attractiveness score</p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${trendConfig.bg} ${trendConfig.text} ${trendConfig.border}`}>
              {trendConfig.label} Trend
            </span>
            <span className="text-xs text-slate-600 capitalize">{confidence} confidence</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/8 to-blue-500/5 p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Summary</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{insights.summary}</p>
      </motion.div>

      {/* Expandable insight cards */}
      <div className="space-y-2">
        <InsightCard icon="📈" label="Momentum" text={insights.momentum} accent="bg-blue-500/10"   delay={0.35} />
        <InsightCard icon="⚡" label="Risk"     text={insights.risk}     accent="bg-orange-500/10" delay={0.40} />
        <InsightCard icon="🧭" label="Trend"    text={insights.trend}    accent="bg-green-500/10"  delay={0.45} />
      </div>

      {/* Should I Invest? */}
      <InvestVerdict score={score} metrics={metrics} />

      {/* Recommendation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="rounded-xl border border-purple-500/25 bg-gradient-to-br from-purple-500/10 to-pink-500/5 p-4"
      >
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-purple-400">★</span>
          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Beginner Recommendation</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{insights.recommendation}</p>
        <p className="text-[11px] text-slate-600 mt-3 leading-relaxed border-t border-white/5 pt-3">
          ⚠️ Educational analysis only. Not financial advice. Always consult a licensed advisor before investing.
        </p>
      </motion.div>
    </motion.div>
  );
}
