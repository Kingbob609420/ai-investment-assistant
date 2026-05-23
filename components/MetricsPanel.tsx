"use client";

import { motion } from "framer-motion";
import { StockQuote, StockMetrics } from "@/lib/types";
import AnimatedCounter from "./AnimatedCounter";

function fmtLarge(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toFixed(0)}`;
}

function fmtVol(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  positive?: boolean | null;
  animated?: boolean;
  delay?: number;
}

function MetricCard({ label, value, sub, positive, animated, delay = 0 }: MetricCardProps) {
  const color =
    positive === true ? "text-green-400" : positive === false ? "text-red-400" : "text-white";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.03, y: -2 }}
      className="group rounded-xl border border-white/8 bg-white/[0.03] p-3.5 hover:border-white/15 hover:bg-white/[0.06] transition-all duration-300 cursor-default"
    >
      <p className="text-[11px] text-slate-500 mb-1.5 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-black tracking-tight ${color}`}>
        {animated && typeof value === "number" ? (
          <AnimatedCounter
            value={value}
            decimals={2}
            duration={700}
            className={color}
          />
        ) : (
          value
        )}
      </p>
      {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

interface Props {
  quote: StockQuote;
  metrics: StockMetrics;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export default function MetricsPanel({ quote, metrics }: Props) {
  const isUp = quote.regularMarketChange >= 0;

  const pct =
    quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow > 0
      ? ((quote.regularMarketPrice - quote.fiftyTwoWeekLow) /
          (quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow)) *
        100
      : 50;

  return (
    <div className="space-y-5">
      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-5 relative overflow-hidden"
      >
        {/* Background glow */}
        <div
          className={`absolute -top-8 -right-8 h-32 w-32 rounded-full blur-3xl opacity-20 ${
            isUp ? "bg-cyan-400" : "bg-red-400"
          }`}
        />

        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-white">{quote.shortName}</p>
              <p className="text-xs text-slate-500">{quote.symbol} · NYSE</p>
            </div>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                isUp ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
              }`}
            >
              {isUp ? "▲" : "▼"} Today
            </motion.span>
          </div>

          <div className="mb-4">
            <p className="text-4xl font-black text-white tracking-tight">
              $<AnimatedCounter value={quote.regularMarketPrice} decimals={2} duration={900} />
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm font-bold ${isUp ? "text-green-400" : "text-red-400"}`}>
                {isUp ? "+" : ""}{quote.regularMarketChange.toFixed(2)} (
                {isUp ? "+" : ""}{quote.regularMarketChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* 52-week bar */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-600 mb-1.5">
              <span>52W Low ${quote.fiftyTwoWeekLow.toFixed(2)}</span>
              <span>52W High ${quote.fiftyTwoWeekHigh.toFixed(2)}</span>
            </div>
            <div className="relative h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full bg-gradient-to-r ${
                  isUp ? "from-cyan-500 to-blue-500" : "from-red-500 to-orange-500"
                }`}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key metrics */}
      <div>
        <p className="text-[11px] text-slate-600 uppercase tracking-widest mb-3 font-semibold">Key Metrics</p>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-2"
        >
          <MetricCard label="Total Return" value={`${metrics.totalReturn >= 0 ? "+" : ""}${metrics.totalReturn.toFixed(2)}%`} positive={metrics.totalReturn >= 0} delay={0.05} />
          <MetricCard label="Ann. Return" value={`${metrics.annualizedReturn >= 0 ? "+" : ""}${metrics.annualizedReturn.toFixed(1)}%`} positive={metrics.annualizedReturn >= 0} delay={0.1} />
          <MetricCard label="Volatility" value={`${metrics.volatility.toFixed(1)}%`} sub="Annualized" delay={0.15} />
          <MetricCard label="Sharpe Ratio" value={metrics.sharpeRatio.toFixed(2)} sub="Risk-adjusted" positive={metrics.sharpeRatio > 0} delay={0.2} />
          <MetricCard label="Max Drawdown" value={`-${metrics.maxDrawdown.toFixed(1)}%`} positive={false} delay={0.25} />
          <MetricCard label="RSI (14)" value={metrics.rsi.toFixed(0)} sub={metrics.rsi > 70 ? "Overbought" : metrics.rsi < 30 ? "Oversold" : "Neutral"} delay={0.3} />
        </motion.div>
      </div>

      {/* Moving averages */}
      <div>
        <p className="text-[11px] text-slate-600 uppercase tracking-widest mb-3 font-semibold">Moving Averages</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "MA 20", v: metrics.ma20 },
            { label: "MA 50", v: metrics.ma50 },
            { label: "MA 200", v: metrics.ma200 },
          ].map(({ label, v }, i) => (
            <MetricCard
              key={label}
              label={label}
              value={`$${v.toFixed(2)}`}
              positive={quote.regularMarketPrice > v ? true : quote.regularMarketPrice < v ? false : null}
              delay={0.35 + i * 0.05}
            />
          ))}
        </div>
      </div>

      {/* Market info */}
      <div>
        <p className="text-[11px] text-slate-600 uppercase tracking-widest mb-3 font-semibold">Market Info</p>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard label="Market Cap" value={fmtLarge(quote.marketCap)} delay={0.5} />
          <MetricCard label="Avg Volume" value={fmtVol(quote.averageVolume)} delay={0.55} />
          {quote.trailingPE && <MetricCard label="P/E Ratio" value={quote.trailingPE.toFixed(1)} delay={0.6} />}
          {quote.dividendYield && <MetricCard label="Div Yield" value={`${(quote.dividendYield * 100).toFixed(2)}%`} positive={true} delay={0.65} />}
        </div>
      </div>
    </div>
  );
}
