"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import AnimatedCounter from "./AnimatedCounter";

interface ChartPoint {
  date: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  ma20: number | null;
  ma50: number | null;
}

interface Props {
  data: ChartPoint[];
  symbol: string;
  totalReturn: number;
  currentPrice: number;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="rounded-xl border border-white/10 bg-[#04060f]/95 backdrop-blur-md p-3 shadow-2xl text-xs min-w-[140px]"
    >
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-slate-400">{p.name}</span>
          </div>
          <span className="text-white font-bold">
            {p.name === "Volume" ? fmtVol(p.value) : `$${p.value?.toFixed(2)}`}
          </span>
        </div>
      ))}
    </motion.div>
  );
};

function fmtVol(v: number) {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toString();
}

type ViewMode = "price" | "volume";

export default function StockChart({ data, symbol, totalReturn, currentPrice }: Props) {
  const [view, setView] = useState<ViewMode>("price");

  const isPositive = totalReturn >= 0;
  const strokeColor = isPositive ? "#22d3ee" : "#f87171";
  const gradientId = isPositive ? "grad-up" : "grad-down";

  const step = Math.max(1, Math.floor(data.length / 8));
  const tickFormatter = (_: unknown, i: number) => (i % step === 0 ? data[i]?.date || "" : "");

  const prices = data.map((d) => d.price);
  const priceMin = Math.min(...prices) * 0.985;
  const priceMax = Math.max(...prices) * 1.015;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden"
    >
      {/* Header bar */}
      <div className="flex items-start justify-between p-6 pb-4">
        <div>
          <div className="flex items-baseline gap-3">
            <h3 className="text-xl font-bold text-white">{symbol}</h3>
            <motion.div
              key={currentPrice}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-black text-white"
            >
              <AnimatedCounter value={currentPrice} prefix="$" decimals={2} duration={800} />
            </motion.div>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <motion.span
              key={totalReturn}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`text-sm font-bold px-2 py-0.5 rounded-lg ${
                isPositive ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
              }`}
            >
              {isPositive ? "▲" : "▼"} {Math.abs(totalReturn).toFixed(2)}% total return
            </motion.span>
            <span className="text-xs text-slate-600">{data.length} data points</span>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          {(["price", "volume"] as ViewMode[]).map((v) => (
            <motion.button
              key={v}
              onClick={() => setView(v)}
              whileTap={{ scale: 0.92 }}
              className={`relative rounded-lg px-3.5 py-2 text-xs font-semibold capitalize transition-colors ${
                view === v ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {view === v && (
                <motion.div
                  layoutId="chart-view"
                  className="absolute inset-0 rounded-lg bg-white/10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative">{v}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="px-2 pb-4"
        >
          {view === "price" ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="grad-up" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                    <stop offset="60%" stopColor="#22d3ee" stopOpacity={0.05} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-down" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={0.3} />
                    <stop offset="60%" stopColor="#f87171" stopOpacity={0.05} />
                    <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff07" vertical={false} />
                <XAxis dataKey="date" tickFormatter={tickFormatter} tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[priceMin, priceMax]} tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? (v/1000).toFixed(1)+"k" : v.toFixed(0)}`} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16 }} iconType="circle" iconSize={6} />
                <Area type="monotone" dataKey="price" name="Price" stroke={strokeColor} strokeWidth={2.5} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: strokeColor }} />
                <Area type="monotone" dataKey="ma20" name="MA 20" stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="0" fill="none" dot={false} activeDot={false} connectNulls />
                <Area type="monotone" dataKey="ma50" name="MA 50" stroke="#fb923c" strokeWidth={1.5} fill="none" dot={false} activeDot={false} connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff07" vertical={false} />
                <XAxis dataKey="date" tickFormatter={tickFormatter} tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtVol} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="volume" name="Volume" fill="#22d3ee" fillOpacity={0.5} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
