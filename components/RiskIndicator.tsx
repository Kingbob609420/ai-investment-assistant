"use client";

import { motion } from "framer-motion";
import { StockMetrics } from "@/lib/types";

interface Props { metrics: StockMetrics; }

function getRisk(volatility: number, drawdown: number) {
  const c = volatility * 0.6 + drawdown * 0.4;
  if (c < 12) return { label: "Low Risk", color: "#4ade80", segments: 1, desc: "Conservative — stable, good for cautious investors" };
  if (c < 22) return { label: "Moderate", color: "#facc15", segments: 2, desc: "Balanced — typical stock volatility" };
  if (c < 38) return { label: "High Risk", color: "#fb923c", segments: 3, desc: "Aggressive — significant swings, risk-tolerant only" };
  return { label: "Very High", color: "#f87171", segments: 4, desc: "Speculative — extreme volatility, use small positions" };
}

export default function RiskIndicator({ metrics }: Props) {
  const risk = getRisk(metrics.volatility, metrics.maxDrawdown);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 relative overflow-hidden"
    >
      {/* Glow */}
      <div
        className="absolute -top-6 -right-6 h-24 w-24 rounded-full blur-2xl opacity-20"
        style={{ background: risk.color }}
      />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-white">Risk Meter</span>
          </div>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="text-sm font-black"
            style={{ color: risk.color }}
          >
            {risk.label}
          </motion.span>
        </div>

        {/* Segments */}
        <div className="flex gap-1.5 mb-3">
          {[1, 2, 3, 4].map((seg) => (
            <motion.div
              key={seg}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3 + seg * 0.1, duration: 0.4, ease: "easeOut" }}
              className="h-2 flex-1 rounded-full origin-left"
              style={{
                background:
                  seg <= risk.segments
                    ? `linear-gradient(90deg, ${risk.color}aa, ${risk.color})`
                    : "rgba(255,255,255,0.06)",
                boxShadow: seg <= risk.segments && seg === risk.segments ? `0 0 8px ${risk.color}60` : "none",
              }}
            />
          ))}
        </div>

        <p className="text-xs text-slate-500 mb-4">{risk.desc}</p>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Volatility", value: `${metrics.volatility.toFixed(1)}%`, sub: "annualized", warn: metrics.volatility > 40 },
            { label: "Max Drawdown", value: `-${metrics.maxDrawdown.toFixed(1)}%`, sub: "peak to trough", warn: true },
            { label: "Beta (est.)", value: metrics.beta.toFixed(2), sub: "vs market", warn: metrics.beta > 1.5 },
            { label: "Sharpe Ratio", value: metrics.sharpeRatio.toFixed(2), sub: "risk-adjusted", warn: metrics.sharpeRatio < 0 },
          ].map(({ label, value, sub, warn }) => (
            <motion.div
              key={label}
              whileHover={{ scale: 1.04, y: -2 }}
              className="rounded-xl bg-white/[0.03] border border-white/8 p-3 cursor-default transition-all"
            >
              <p className="text-[10px] text-slate-600 mb-1 uppercase tracking-wide font-medium">{label}</p>
              <p className={`text-sm font-black ${warn ? "text-orange-400" : "text-white"}`}>{value}</p>
              <p className="text-[10px] text-slate-700">{sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
