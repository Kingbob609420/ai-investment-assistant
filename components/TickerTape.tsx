"use client";

import { useEffect, useState } from "react";

const TICKERS = [
  { sym: "AAPL", name: "Apple" },
  { sym: "TSLA", name: "Tesla" },
  { sym: "NVDA", name: "NVIDIA" },
  { sym: "MSFT", name: "Microsoft" },
  { sym: "GOOGL", name: "Alphabet" },
  { sym: "AMZN", name: "Amazon" },
  { sym: "META", name: "Meta" },
  { sym: "SPY", name: "S&P 500" },
  { sym: "BTC-USD", name: "Bitcoin" },
  { sym: "ETH-USD", name: "Ethereum" },
  { sym: "QQQ", name: "Nasdaq ETF" },
  { sym: "AMD", name: "AMD" },
];

interface TickItem {
  sym: string;
  name: string;
  price: string;
  change: number;
}

export default function TickerTape() {
  const [items, setItems] = useState<TickItem[]>(
    TICKERS.map((t) => ({
      ...t,
      price: (Math.random() * 400 + 50).toFixed(2),
      change: parseFloat((Math.random() * 10 - 5).toFixed(2)),
    }))
  );

  // Randomize slightly every 5 seconds to simulate live data
  useEffect(() => {
    const id = setInterval(() => {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          price: (parseFloat(item.price) * (1 + (Math.random() - 0.5) * 0.002)).toFixed(2),
          change: parseFloat((item.change + (Math.random() - 0.5) * 0.1).toFixed(2)),
        }))
      );
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const double = [...items, ...items];

  return (
    <div className="w-full overflow-hidden border-y border-white/6 bg-white/[0.02] py-2.5">
      <div className="ticker-tape flex gap-8" style={{ width: "max-content" }}>
        {double.map((item, i) => (
          <div key={i} className="flex items-center gap-2 whitespace-nowrap px-4">
            <span className="text-xs font-bold text-white">{item.sym}</span>
            <span className="text-xs text-slate-500">{item.name}</span>
            <span className="text-xs font-semibold text-slate-300">${item.price}</span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                item.change >= 0
                  ? "text-green-400 bg-green-400/10"
                  : "text-red-400 bg-red-400/10"
              }`}
            >
              {item.change >= 0 ? "+" : ""}{item.change}%
            </span>
            <span className="text-slate-700 ml-2">·</span>
          </div>
        ))}
      </div>
    </div>
  );
}
