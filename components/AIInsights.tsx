"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AIInsight, StockMetrics, StockQuote } from "@/lib/types";
import { useWatchlist } from "@/lib/watchlistContext";

interface GPTAnalysis {
  headline: string;
  momentum: string;
  risk: string;
  trend: string;
  shouldInvest: string;
  keyInsight: string;
  sentiment: "bullish" | "bearish" | "neutral";
  powered_by?: string;
}

interface Props {
  insights: AIInsight;
  metrics: StockMetrics;
  quote: StockQuote;
  symbol: string;
  companyName: string;
  range: string;
}

/* ── Score ring ─────────────────────────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const radius = 40;
  const circ   = 2 * Math.PI * radius;
  const color  = score >= 70 ? "#22d3ee" : score >= 50 ? "#fb923c" : "#f87171";
  const rgb    = score >= 70 ? "34,211,238" : score >= 50 ? "251,146,60" : "248,113,113";
  return (
    <div className="relative h-28 w-28 flex items-center justify-center shrink-0">
      <motion.div
        animate={{ scale: [1, 1.35, 1], opacity: [0.25, 0, 0.25] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle, rgba(${rgb},0.35) 0%, transparent 70%)` }}
      />
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#ffffff08" strokeWidth="7" />
        <motion.circle
          cx="48" cy="48" r={radius} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (score / 100) * circ }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="text-center z-10">
        <motion.p initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          className="text-3xl font-black" style={{ color }}>{score}</motion.p>
        <p className="text-[10px] text-slate-600 -mt-0.5">/100</p>
      </div>
    </div>
  );
}

/* ── Expandable card ─────────────────────────────────────────────────────── */
function InsightCard({ icon, label, text, delay = 0 }: {
  icon: string; label: string; text: string; delay?: number;
}) {
  const [open, setOpen] = useState(false);
  const preview = text.length > 110 ? text.slice(0, 110) + "…" : text;
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-white/8 bg-white/[0.03] overflow-hidden hover:border-white/14 transition-colors"
    >
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 p-4 text-left">
        <span className="text-base shrink-0">{icon}</span>
        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest flex-1">{label}</span>
        <motion.svg animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }}
          className="h-4 w-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        <motion.div
          key={open ? "open" : "closed"}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.28 }}
          className="overflow-hidden"
        >
          <p className="px-4 pb-4 text-sm text-slate-400 leading-relaxed -mt-1">
            {open ? text : preview}
          </p>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

/* ── GPT loading skeleton ────────────────────────────────────────────────── */
function AILoading() {
  return (
    <div className="space-y-3">
      {[80, 60, 72].map((w, i) => (
        <div key={i} className="rounded-xl border border-white/8 bg-white/[0.03] p-4 space-y-2">
          <div className="h-3 w-24 rounded bg-white/8 shimmer" />
          <div className={`h-3 rounded bg-white/6 shimmer`} style={{ width: `${w}%` }} />
          <div className="h-3 w-1/2 rounded bg-white/5 shimmer" />
        </div>
      ))}
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function AIInsights({ insights, metrics, quote, symbol, companyName, range }: Props) {
  const { score, confidence } = insights;
  const [gpt, setGpt]         = useState<GPTAnalysis | null>(null);
  const [gptLoading, setGptLoading] = useState(false);
  const [copied, setCopied]   = useState(false);
  const { isWatched, addToWatchlist, removeFromWatchlist, openDrawer } = useWatchlist();
  const watched = isWatched(symbol);

  // Fetch GPT analysis on mount
  useEffect(() => {
    setGpt(null);
    setGptLoading(true);
    fetch("/api/ai-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote, metrics, symbol, range }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.error === "no_key" || d.error) setGpt(null);
        else setGpt(d as GPTAnalysis);
      })
      .catch(() => setGpt(null))
      .finally(() => setGptLoading(false));
  }, [symbol, range]); // eslint-disable-line react-hooks/exhaustive-deps

  const verdict      = score >= 75 ? "Strong Signal" : score >= 60 ? "Moderate Signal" : score >= 45 ? "Neutral — Watch" : "Caution";
  const verdictColor = score >= 70 ? "text-cyan-400"  : score >= 50 ? "text-orange-400"  : "text-red-400";
  const trend        = metrics.trendDirection;
  const trendCfg     = {
    bullish: { label: "Bullish", bg: "bg-green-500/10",  text: "text-green-400",  border: "border-green-500/20" },
    bearish: { label: "Bearish", bg: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500/20" },
    neutral: { label: "Neutral", bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  }[trend];

  // Use GPT data if available, fall back to rule-based
  const momentum  = gpt?.momentum  ?? insights.momentum;
  const riskText  = gpt?.risk      ?? insights.risk;
  const trendText = gpt?.trend     ?? insights.trend;
  const summary   = gpt?.headline  ?? insights.summary;

  const sentimentCfg = gpt?.sentiment
    ? { bullish: trendCfg, bearish: { label: "Bearish", bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" }, neutral: { label: "Neutral", bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" } }[gpt.sentiment]
    : trendCfg;

  function handleWatchlist() {
    if (watched) { removeFromWatchlist(symbol); }
    else {
      const rl: "low" | "medium" | "high" = metrics.volatility > 30 ? "high" : metrics.volatility > 20 ? "medium" : "low";
      addToWatchlist(symbol, companyName, score, rl, quote.regularMarketPrice);
      openDrawer();
    }
  }

  function copyReport() {
    const lines = [
      `StockSage AI Report — ${symbol} (${companyName})`,
      `Score: ${score}/100  |  Trend: ${trend}  |  Confidence: ${confidence}`,
      ``,
      `SUMMARY`, summary,
      ``,
      `MOMENTUM`, momentum,
      ``,
      `RISK`, riskText,
      ``,
      `TREND`, trendText,
    ];
    if (gpt?.shouldInvest) { lines.push(``, `SHOULD I INVEST?`, gpt.shouldInvest); }
    lines.push(``, `Generated by StockSage AI — educational use only.`);
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ rotate: 15 }}
            className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">AI Research Insights</h3>
              {gpt?.powered_by && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  GPT-4o mini
                </span>
              )}
              {!gpt && !gptLoading && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/8 text-slate-500 border border-white/10">
                  Rule-based
                </span>
              )}
              {gptLoading && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25 flex items-center gap-1">
                  <svg className="h-2.5 w-2.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  AI thinking…
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 capitalize">{confidence} confidence · {range} analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            onClick={handleWatchlist}
            className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all ${
              watched ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" : "bg-white/5 border-white/10 text-slate-500 hover:text-white"
            }`}>
            <svg className="h-4 w-4" fill={watched ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </motion.button>

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={copyReport}
            className="h-8 px-3 rounded-lg border border-white/10 bg-white/5 text-slate-500 hover:text-white flex items-center gap-1.5 text-xs font-medium transition-all">
            <AnimatePresence mode="wait">
              {copied
                ? <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-green-400 flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied
                  </motion.span>
                : <motion.span key="cp" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy
                  </motion.span>
              }
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
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${sentimentCfg.bg} ${sentimentCfg.text} ${sentimentCfg.border}`}>
              {sentimentCfg.label} Trend
            </span>
            <span className="text-xs text-slate-600 capitalize">{confidence} confidence</span>
          </div>
        </div>
      </div>

      {/* Key insight from GPT */}
      <AnimatePresence>
        {gpt?.keyInsight && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-purple-500/25 bg-gradient-to-r from-purple-500/10 to-pink-500/5 p-4"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-purple-400 text-xs">✦</span>
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Key Insight</span>
              <span className="text-[10px] text-purple-600 ml-auto">GPT-4o mini</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">{gpt.keyInsight}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary */}
      <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/8 to-blue-500/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Summary</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={summary} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
            className="text-sm text-slate-300 leading-relaxed">{summary}</motion.p>
        </AnimatePresence>
      </div>

      {/* Insight cards — GPT or rule-based */}
      {gptLoading ? <AILoading /> : (
        <div className="space-y-2">
          <InsightCard icon="📈" label="Momentum" text={momentum}  delay={0.3} />
          <InsightCard icon="⚡" label="Risk"     text={riskText}  delay={0.35} />
          <InsightCard icon="🧭" label="Trend"    text={trendText} delay={0.4} />
        </div>
      )}

      {/* Should I Invest — GPT version */}
      <ShouldIInvest gptText={gpt?.shouldInvest ?? null} score={score} metrics={metrics} symbol={symbol} />

      {/* Footer disclaimer */}
      <p className="text-[11px] text-slate-700 leading-relaxed border-t border-white/5 pt-3">
        ⚠️ Educational analysis only · Not financial advice · Always consult a licensed advisor before investing
      </p>
    </motion.div>
  );
}

/* ── Should I Invest? ────────────────────────────────────────────────────── */
function ShouldIInvest({ gptText, score, metrics, symbol }: {
  gptText: string | null; score: number; metrics: StockMetrics; symbol: string;
}) {
  const [open, setOpen] = useState(false);

  const fallback =
    score >= 75 && metrics.trendDirection === "bullish"
      ? { label: "Consider Buying", color: "text-green-400", bg: "from-green-500/15 to-green-500/5", border: "border-green-500/25", icon: "✅",
          text: `Indicators align positively for ${symbol} with a score of ${score}/100. If this fits your risk tolerance, a small position (2–5% of your portfolio) may be worth considering.` }
      : score >= 60
      ? { label: "Watch & Wait", color: "text-yellow-400", bg: "from-yellow-500/15 to-yellow-500/5", border: "border-yellow-500/25", icon: "👀",
          text: `${symbol} shows some positive signs but isn't a clear buy yet. Score: ${score}/100. Add it to your watchlist and look for a confirmed uptrend before committing.` }
      : { label: "Hold Off For Now", color: "text-red-400", bg: "from-red-500/15 to-red-500/5", border: "border-red-500/25", icon: "⏸️",
          text: `Mixed or weak signals on ${symbol} (score: ${score}/100). Volatility is ${metrics.volatility.toFixed(1)}% annualized. Better to wait for clearer momentum before entering.` };

  const label  = gptText ? (score >= 70 ? "Consider Buying" : score >= 55 ? "Watch & Wait" : "Hold Off") : fallback.label;
  const lColor = score >= 70 ? "text-green-400" : score >= 55 ? "text-yellow-400" : "text-orange-400";
  const text   = gptText ?? fallback.text;

  return (
    <div>
      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 hover:border-white/18 hover:bg-white/[0.07] transition-all"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🤔</span>
          <span className="text-sm font-bold text-white">Should I Invest?</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${lColor}`}>{label}</span>
          <motion.svg animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }}
            className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </motion.svg>
        </div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className={`mt-2 rounded-xl border ${gptText ? "border-purple-500/25 bg-gradient-to-br from-purple-500/10 to-pink-500/5" : `border-white/10 bg-white/[0.04]`} p-4`}>
              {gptText && (
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-semibold text-purple-400">✦ GPT-4o mini analysis</span>
                </div>
              )}
              <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
