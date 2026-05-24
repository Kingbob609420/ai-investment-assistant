import { NextRequest, NextResponse } from "next/server";
import { StockMetrics, StockQuote } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "no_key" }, { status: 200 });
  }

  let body: { quote: StockQuote; metrics: StockMetrics; symbol: string; range: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { quote, metrics, symbol, range } = body;

  const prompt = `You are a financial analyst assistant helping beginner retail investors understand stocks. Analyze the following real market data for ${symbol} (${quote.shortName}) and provide a clear, jargon-free analysis.

STOCK DATA (${range} period):
- Current Price: $${quote.regularMarketPrice.toFixed(2)}
- Today's Change: ${quote.regularMarketChangePercent.toFixed(2)}%
- Market Cap: $${(quote.marketCap / 1e9).toFixed(1)}B
- P/E Ratio: ${quote.trailingPE?.toFixed(1) ?? "N/A"}
- 52-Week Range: $${quote.fiftyTwoWeekLow.toFixed(2)} – $${quote.fiftyTwoWeekHigh.toFixed(2)}
- Dividend Yield: ${quote.dividendYield ? (quote.dividendYield * 100).toFixed(2) + "%" : "None"}
- Sector: ${quote.sector ?? "Unknown"}

CALCULATED METRICS:
- Total Return (${range}): ${metrics.totalReturn.toFixed(2)}%
- Annualized Return: ${metrics.annualizedReturn.toFixed(1)}%
- Volatility (annualized): ${metrics.volatility.toFixed(1)}%
- Sharpe Ratio: ${metrics.sharpeRatio.toFixed(2)}
- Max Drawdown: ${metrics.maxDrawdown.toFixed(1)}%
- RSI (14-day): ${metrics.rsi.toFixed(0)}
- Price vs MA20: ${quote.regularMarketPrice > metrics.ma20 ? "above" : "below"} ($${metrics.ma20.toFixed(2)})
- Price vs MA50: ${quote.regularMarketPrice > metrics.ma50 ? "above" : "below"} ($${metrics.ma50.toFixed(2)})
- Price vs MA200: ${quote.regularMarketPrice > metrics.ma200 ? "above" : "below"} ($${metrics.ma200.toFixed(2)})
- Trend: ${metrics.trendDirection}

Respond ONLY with a valid JSON object with these exact keys:
{
  "headline": "One punchy sentence summarizing the stock's situation right now (max 15 words)",
  "momentum": "2-3 sentences explaining momentum in plain English for a beginner",
  "risk": "2-3 sentences explaining the risk level and what it means practically",
  "trend": "2-3 sentences explaining the trend and what moving averages reveal",
  "shouldInvest": "3-4 sentences with a clear, honest recommendation — mention specific numbers from the data",
  "keyInsight": "The single most important thing a beginner should know about this stock right now (1-2 sentences)",
  "sentiment": "bullish" | "bearish" | "neutral"
}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 600,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);

    return NextResponse.json({ ...parsed, powered_by: "gpt-4o-mini" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI request failed" },
      { status: 500 }
    );
  }
}
