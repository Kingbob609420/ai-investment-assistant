import { StockData } from "./types";
import { calculateMetrics, generateInsights } from "./calculations";

// Seeded random for reproducible demo data per symbol
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function symbolSeed(sym: string) {
  return sym.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

const KNOWN: Record<string, { name: string; price: number; cap: number; pe: number | null; sector: string }> = {
  AAPL:  { name: "Apple Inc.",         price: 211,   cap: 3.2e12, pe: 32,   sector: "Technology" },
  TSLA:  { name: "Tesla, Inc.",         price: 248,   cap: 7.9e11, pe: 56,   sector: "Consumer Cyclical" },
  NVDA:  { name: "NVIDIA Corporation",  price: 137,   cap: 3.36e12,pe: 52,  sector: "Technology" },
  MSFT:  { name: "Microsoft Corporation",price: 449, cap: 3.34e12,pe: 36,   sector: "Technology" },
  GOOGL: { name: "Alphabet Inc.",       price: 165,   cap: 2.03e12,pe: 24,  sector: "Communication" },
  AMZN:  { name: "Amazon.com Inc.",     price: 204,   cap: 2.17e12,pe: 44,  sector: "Consumer Cyclical" },
  META:  { name: "Meta Platforms",      price: 596,   cap: 1.51e12,pe: 27,  sector: "Communication" },
  SPY:   { name: "SPDR S&P 500 ETF",    price: 583,   cap: 5.6e11, pe: null, sector: "ETF" },
  AMD:   { name: "Advanced Micro Devices",price: 108, cap: 1.76e11,pe: 100, sector: "Technology" },
  QQQ:   { name: "Invesco QQQ Trust",   price: 501,   cap: 2.4e11, pe: null, sector: "ETF" },
};

export function generateDemoData(symbol: string, rangeDays = 365): StockData {
  const rand = seededRand(symbolSeed(symbol) + rangeDays);
  const known = KNOWN[symbol.toUpperCase()];
  const basePrice = known?.price ?? 50 + rand() * 450;
  const shortName = known?.name ?? `${symbol} Corp.`;
  const sector = known?.sector ?? "Technology";
  const marketCap = known?.cap ?? basePrice * 1e9 * (0.5 + rand() * 5);
  const pe = known?.pe ?? null;

  // Generate historical OHLCV
  const days = rangeDays <= 30 ? 22 : rangeDays <= 90 ? 63 : rangeDays <= 180 ? 126 : rangeDays <= 365 ? 252 : rangeDays <= 730 ? 104 : 260;
  const useWeekly = rangeDays > 365;

  // Trend bias: slightly random per symbol
  const trendBias = (rand() - 0.4) * 0.0008;
  const volatility = 0.012 + rand() * 0.025;

  const historical = [];
  let price = basePrice * (0.7 + rand() * 0.3);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - rangeDays);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + Math.floor(i * (rangeDays / days)));

    const change = (rand() - 0.48 + trendBias) * volatility;
    const open = price;
    price = Math.max(price * (1 + change), 1);
    const close = price;
    const high = Math.max(open, close) * (1 + rand() * 0.012);
    const low = Math.min(open, close) * (1 - rand() * 0.012);
    const volume = Math.floor((1e6 + rand() * 50e6) * (marketCap / 1e12 + 0.1));

    historical.push({
      date: date.toISOString().split("T")[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
      adjClose: parseFloat(close.toFixed(2)),
    });
  }

  const currentPrice = historical[historical.length - 1].close;
  const prevClose = historical[historical.length - 2]?.close ?? currentPrice;
  const change = currentPrice - prevClose;
  const changePct = (change / prevClose) * 100;

  const fiftyTwoWeekHigh = Math.max(...historical.slice(-52).map((d) => d.high));
  const fiftyTwoWeekLow = Math.min(...historical.slice(-52).map((d) => d.low));

  const quote = {
    symbol: symbol.toUpperCase(),
    shortName,
    regularMarketPrice: parseFloat(currentPrice.toFixed(2)),
    regularMarketChange: parseFloat(change.toFixed(2)),
    regularMarketChangePercent: parseFloat(changePct.toFixed(2)),
    regularMarketVolume: historical[historical.length - 1].volume,
    marketCap,
    fiftyTwoWeekHigh: parseFloat(fiftyTwoWeekHigh.toFixed(2)),
    fiftyTwoWeekLow: parseFloat(fiftyTwoWeekLow.toFixed(2)),
    averageVolume: Math.floor(historical.reduce((s, d) => s + d.volume, 0) / historical.length),
    trailingPE: pe,
    forwardPE: pe ? parseFloat((pe * 0.85).toFixed(1)) : null,
    dividendYield: rand() > 0.6 ? parseFloat((rand() * 0.03).toFixed(4)) : null,
    sector,
    industry: sector,
  };

  const metrics = calculateMetrics(historical, currentPrice);
  const insights = generateInsights(metrics, symbol.toUpperCase());

  return { quote, historical, metrics, insights };
}

const RANGE_DAYS: Record<string, number> = {
  "1M": 30, "3M": 90, "6M": 180, "1Y": 365, "2Y": 730, "5Y": 1825,
};

export function getDemoData(symbol: string, range: string): StockData {
  return generateDemoData(symbol, RANGE_DAYS[range] ?? 365);
}
