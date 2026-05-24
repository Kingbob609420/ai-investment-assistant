"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import WatchlistDrawer from "@/components/WatchlistDrawer";
import { useRouter } from "next/navigation";

interface StockSummary {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  score: number;
  confidence: string;
  trend: "bullish" | "bearish" | "neutral";
  volatility: number;
  riskLevel: "low" | "medium" | "high";
  sharpe: number;
  totalReturn: number;
  livePrice: boolean;
}

interface NewsItem {
  title: string;
  publisher: string;
  url: string;
  publishedAt: number;
  thumbnail: string | null;
}

const RISK_CFG = {
  low:    { label: "Low",    bg: "bg-green-500/15",  text: "text-green-400",  border: "border-green-500/25" },
  medium: { label: "Medium", bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/25" },
  high:   { label: "High",   bg: "bg-red-500/15",    text: "text-red-400",    border: "border-red-500/25" },
};

const TREND_CFG = {
  bullish: { label: "Bullish", color: "text-green-400" },
  bearish: { label: "Bearish", color: "text-red-400" },
  neutral: { label: "Neutral", color: "text-yellow-400" },
};

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "from-cyan-500 to-blue-500"
    : score >= 50 ? "from-orange-500 to-yellow-500"
    : "from-red-500 to-pink-500";
  const textColor = score >= 70 ? "text-cyan-400" : score >= 50 ? "text-orange-400" : "text-red-400";
  return (
    <div className="flex items-center gap-2">
      <span className={`text-lg font-black ${textColor} w-7 text-right shrink-0`}>{score}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
        />
      </div>
    </div>
  );
}

function StockCard({ stock, rank, onAnalyze }: { stock: StockSummary; rank: number; onAnalyze: () => void }) {
  const risk = RISK_CFG[stock.riskLevel];
  const trend = TREND_CFG[stock.trend];
  const changePos = stock.change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: rank * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/18 hover:bg-white/[0.05] transition-all"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-black text-cyan-400">{stock.symbol.slice(0, 3)}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">{stock.symbol}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${risk.bg} ${risk.text} ${risk.border} font-semibold`}>
                {risk.label} Risk
              </span>
            </div>
            <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{stock.name}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-white">${stock.price.toFixed(2)}</p>
          <p className={`text-[11px] font-semibold ${changePos ? "text-green-400" : "text-red-400"}`}>
            {changePos ? "+" : ""}{stock.change.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-slate-600 uppercase tracking-widest font-medium">AI Score</span>
          <span className={`text-[10px] font-semibold capitalize ${trend.color}`}>{trend.label}</span>
        </div>
        <ScoreBar score={stock.score} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Volatility", val: `${stock.volatility}%` },
          { label: "1Y Return",  val: `${stock.totalReturn > 0 ? "+" : ""}${stock.totalReturn}%` },
          { label: "Sharpe",     val: stock.sharpe.toFixed(2) },
        ].map(({ label, val }) => (
          <div key={label} className="rounded-lg bg-white/[0.03] border border-white/6 px-2 py-1.5 text-center">
            <p className="text-xs font-semibold text-slate-300">{val}</p>
            <p className="text-[9px] text-slate-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Analyze button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onAnalyze}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/15 border border-cyan-500/30 py-2.5 text-xs font-bold text-cyan-400 hover:from-cyan-500/30 hover:to-blue-500/25 transition-all"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Full Analysis
      </motion.button>
    </motion.div>
  );
}

function NewsCard({ item, i }: { item: NewsItem; i: number }) {
  const age = Date.now() - item.publishedAt;
  const ageStr = age < 3_600_000
    ? `${Math.round(age / 60_000)}m ago`
    : age < 86_400_000
    ? `${Math.round(age / 3_600_000)}h ago`
    : `${Math.round(age / 86_400_000)}d ago`;

  return (
    <motion.a
      href={item.url === "#" ? undefined : item.url}
      target={item.url === "#" ? undefined : "_blank"}
      rel="noopener noreferrer"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-4 hover:border-white/16 hover:bg-white/[0.05] transition-all cursor-pointer group"
    >
      {item.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnail}
          alt=""
          className="h-14 w-20 rounded-lg object-cover shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-200 leading-snug group-hover:text-white transition-colors line-clamp-2">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11px] text-slate-500">{item.publisher}</span>
          <span className="text-slate-700">·</span>
          <span className="text-[11px] text-slate-600">{ageStr}</span>
        </div>
      </div>
      <svg className="h-4 w-4 text-slate-700 group-hover:text-slate-400 transition-colors shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </motion.a>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stocks, setStocks] = useState<StockSummary[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [sortBy, setSortBy] = useState<"score" | "change" | "risk">("score");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setStocks(d.stocks ?? []))
      .catch(() => setStocks([]))
      .finally(() => setLoadingStocks(false));

    fetch("/api/news?symbol=SPY")
      .then((r) => r.json())
      .then((d) => setNews(d.news ?? []))
      .catch(() => setNews([]))
      .finally(() => setLoadingNews(false));
  }, []);

  function handleAnalyze(symbol: string) {
    sessionStorage.setItem("quantify_autosearch", symbol);
    router.push("/");
  }

  const sorted = [...stocks].sort((a, b) => {
    if (sortBy === "score") return b.score - a.score;
    if (sortBy === "change") return b.change - a.change;
    const riskOrder = { low: 0, medium: 1, high: 2 };
    return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
  });

  const topScore = stocks.length > 0 ? Math.max(...stocks.map((s) => s.score)) : null;
  const avgScore = stocks.length > 0 ? Math.round(stocks.reduce((a, s) => a + s.score, 0) / stocks.length) : null;
  const bullish  = stocks.filter((s) => s.trend === "bullish").length;

  return (
    <div className="min-h-screen bg-[#04060f] text-slate-100 overflow-x-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-[600px] w-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/3 right-1/4 h-[500px] w-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)" }} />
      </div>

      <Navbar />
      <WatchlistDrawer onSelect={(sym) => handleAnalyze(sym)} />

      <main className="relative mx-auto max-w-7xl px-6 pt-28 pb-20">

        {/* Page header */}
        <Reveal>
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-green-400"
              />
              <span className="text-xs text-slate-500 uppercase tracking-widest font-medium">Live Market Overview</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              Market{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Dashboard
              </span>
            </h1>
            <p className="text-slate-400 mt-3 text-sm max-w-lg leading-relaxed">
              AI-ranked top stocks across sectors. Scores reflect momentum, trend, risk, and return.
              Click any card for a full analysis.
            </p>
          </div>
        </Reveal>

        {/* Summary stats */}
        {!loadingStocks && stocks.length > 0 && (
          <Reveal delay={0.05}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { label: "Stocks Tracked", val: String(stocks.length), color: "text-white" },
                { label: "Top Score",       val: String(topScore),    color: "text-cyan-400" },
                { label: "Average Score",   val: String(avgScore),    color: "text-blue-400" },
                { label: "Bullish Picks",   val: String(bullish),     color: "text-green-400" },
              ].map(({ label, val, color }) => (
                <div key={label} className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-center">
                  <p className={`text-2xl font-black ${color}`}>{val}</p>
                  <p className="text-[11px] text-slate-600 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        )}

        {/* Sort controls */}
        <Reveal delay={0.08}>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[11px] text-slate-600 uppercase tracking-wider font-medium">Sort by</span>
            <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
              {(["score", "change", "risk"] as const).map((s) => (
                <motion.button
                  key={s}
                  onClick={() => setSortBy(s)}
                  whileTap={{ scale: 0.93 }}
                  className={`relative rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors duration-200 ${
                    sortBy === s ? "text-white" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {sortBy === s && (
                    <motion.div
                      layoutId="sort-pill"
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-500/40"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative">{s === "risk" ? "Lowest Risk" : s === "change" ? "Today's Change" : "AI Score"}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Stocks grid */}
        {loadingStocks ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/8 bg-white/[0.025] h-64 overflow-hidden relative">
                <div className="shimmer absolute inset-0" />
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
              {sorted.map((stock, i) => (
                <StockCard
                  key={stock.symbol}
                  stock={stock}
                  rank={i}
                  onAnalyze={() => handleAnalyze(stock.symbol)}
                />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* News section */}
        <Reveal delay={0.1}>
          <div className="mb-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/8 text-xs text-slate-500 uppercase tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Market News
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
          </div>
        </Reveal>

        {loadingNews ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/[0.025] h-20 relative overflow-hidden">
                <div className="shimmer absolute inset-0" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl">
            {news.map((item, i) => (
              <NewsCard key={i} item={item} i={i} />
            ))}
            {news.length === 0 && (
              <p className="text-sm text-slate-600 text-center py-8">No news available right now.</p>
            )}
          </div>
        )}

        {/* Back to analyzer */}
        <Reveal delay={0.1}>
          <div className="mt-16 text-center">
            <p className="text-xs text-slate-600 mb-3">Ready to dig deeper into a specific stock?</p>
            <Link href="/">
              <motion.span
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-900/40"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Open Stock Analyzer
              </motion.span>
            </Link>
          </div>
        </Reveal>
      </main>
    </div>
  );
}
