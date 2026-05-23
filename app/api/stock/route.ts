import { NextRequest, NextResponse } from "next/server";
import { calculateMetrics, generateInsights } from "@/lib/calculations";
import { getDemoData } from "@/lib/demoData";
import { HistoricalDataPoint, StockQuote } from "@/lib/types";

export const runtime = "nodejs";

const RANGE_MAP: Record<string, { days: number; interval: string }> = {
  "1M": { days: 30,   interval: "1d" },
  "3M": { days: 90,   interval: "1d" },
  "6M": { days: 180,  interval: "1d" },
  "1Y": { days: 365,  interval: "1d" },
  "2Y": { days: 730,  interval: "1wk" },
  "5Y": { days: 1825, interval: "1wk" },
};

function subDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function fetchFromYahoo(
  symbol: string,
  range: string
): Promise<{ quote: StockQuote; historical: HistoricalDataPoint[]; demo: false } | null> {
  try {
    // Lazy-require so a module load failure doesn't crash the whole route
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { default: YahooFinance } = require("yahoo-finance2");
    const yf: {
      quote: (s: string) => Promise<Record<string, unknown>>;
      chart: (s: string, o: Record<string, unknown>) => Promise<{ quotes: Record<string, unknown>[] }>;
    } = new YahooFinance({ suppressNotices: ["yahooSurvey", "ripHistorical"] });

    const config = RANGE_MAP[range] ?? RANGE_MAP["1Y"];

    const [quoteResult, chartResult] = await Promise.all([
      yf.quote(symbol),
      yf.chart(symbol, { period1: subDays(config.days), interval: config.interval }),
    ]);

    const rawQuotes = chartResult?.quotes ?? [];
    if (!quoteResult || rawQuotes.length === 0) return null;

    const q = quoteResult as Record<string, unknown>;
    const n = (f: string, fb = 0) => (typeof q[f] === "number" ? (q[f] as number) : fb);
    const s = (f: string): string | null => (typeof q[f] === "string" ? (q[f] as string) : null);

    const quote: StockQuote = {
      symbol:                    s("symbol")      ?? symbol,
      shortName:                 s("shortName")   ?? s("longName") ?? symbol,
      regularMarketPrice:        n("regularMarketPrice"),
      regularMarketChange:       n("regularMarketChange"),
      regularMarketChangePercent:n("regularMarketChangePercent"),
      regularMarketVolume:       n("regularMarketVolume"),
      marketCap:                 n("marketCap"),
      fiftyTwoWeekHigh:          n("fiftyTwoWeekHigh"),
      fiftyTwoWeekLow:           n("fiftyTwoWeekLow"),
      averageVolume:             n("averageVolume"),
      trailingPE:   typeof q["trailingPE"]   === "number" ? (q["trailingPE"]   as number) : null,
      forwardPE:    typeof q["forwardPE"]    === "number" ? (q["forwardPE"]    as number) : null,
      dividendYield:typeof q["dividendYield"]=== "number" ? (q["dividendYield"]as number) : null,
      sector:   s("sector"),
      industry: s("industry"),
    };

    const historical: HistoricalDataPoint[] = rawQuotes
      .filter((d) => d["close"] != null)
      .map((d) => {
        const num = (f: string, fb = 0) => (typeof d[f] === "number" ? (d[f] as number) : fb);
        const close = num("close");
        const dateVal = d["date"];
        const dateStr = dateVal instanceof Date
          ? dateVal.toISOString().split("T")[0]
          : String(dateVal).split("T")[0];
        return {
          date: dateStr,
          open: num("open", close),
          high: num("high", close),
          low:  num("low",  close),
          close,
          volume:   num("volume"),
          adjClose: num("adjclose", close),
        };
      });

    return { quote, historical, demo: false };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "").toUpperCase().trim();
  const range  = searchParams.get("range") ?? "1Y";

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  // Try live Yahoo Finance first
  const live = await fetchFromYahoo(symbol, range);

  if (live) {
    const metrics  = calculateMetrics(live.historical, live.quote.regularMarketPrice);
    const insights = generateInsights(metrics, symbol);
    return NextResponse.json({ ...live, metrics, insights, demo: false });
  }

  // Fallback: generate realistic demo data so the UI always works
  const demo = getDemoData(symbol, range);
  return NextResponse.json({ ...demo, demo: true });
}
