import { HistoricalDataPoint, StockMetrics, AIInsight } from "./types";

export function calculateMetrics(
  historical: HistoricalDataPoint[],
  currentPrice: number
): StockMetrics {
  if (historical.length < 2) {
    return {
      totalReturn: 0,
      annualizedReturn: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      avgVolume: 0,
      ma20: currentPrice,
      ma50: currentPrice,
      ma200: currentPrice,
      currentPrice,
      rsi: 50,
      beta: 1,
      trendDirection: "neutral",
    };
  }

  const closes = historical.map((d) => d.adjClose || d.close);
  const volumes = historical.map((d) => d.volume);

  // Total return
  const firstPrice = closes[0];
  const lastPrice = closes[closes.length - 1];
  const totalReturn = ((lastPrice - firstPrice) / firstPrice) * 100;

  // Daily returns
  const dailyReturns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    dailyReturns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }

  // Annualized return
  const tradingDays = closes.length;
  const annualizedReturn =
    (Math.pow(lastPrice / firstPrice, 252 / tradingDays) - 1) * 100;

  // Volatility (annualized)
  const avgDailyReturn =
    dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce(
      (sum, r) => sum + Math.pow(r - avgDailyReturn, 2),
      0
    ) / dailyReturns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100;

  // Sharpe ratio (assuming risk-free rate of 5%)
  const riskFreeRate = 0.05;
  const sharpeRatio =
    volatility > 0
      ? (annualizedReturn / 100 - riskFreeRate) / (volatility / 100)
      : 0;

  // Max drawdown
  let peak = closes[0];
  let maxDrawdown = 0;
  for (const close of closes) {
    if (close > peak) peak = close;
    const drawdown = ((peak - close) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  // Moving averages
  const ma20 = movingAverage(closes, 20);
  const ma50 = movingAverage(closes, 50);
  const ma200 = movingAverage(closes, 200);

  // Average volume
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;

  // RSI (14-period)
  const rsi = calculateRSI(closes, 14);

  // Trend direction
  let trendDirection: "bullish" | "bearish" | "neutral" = "neutral";
  if (currentPrice > ma50 && ma50 > ma200 && totalReturn > 0) {
    trendDirection = "bullish";
  } else if (currentPrice < ma50 && ma50 < ma200 && totalReturn < 0) {
    trendDirection = "bearish";
  }

  // Beta approximation (simplified — how volatile vs 10% market)
  const beta = Math.min(Math.max(volatility / 20, 0.3), 3.0);

  return {
    totalReturn,
    annualizedReturn,
    volatility,
    sharpeRatio,
    maxDrawdown,
    avgVolume,
    ma20,
    ma50,
    ma200,
    currentPrice,
    rsi,
    beta,
    trendDirection,
  };
}

function movingAverage(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1];
  const slice = data.slice(data.length - period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function calculateRSI(closes: number[], period: number): number {
  if (closes.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function generateInsights(
  metrics: StockMetrics,
  symbol: string
): AIInsight {
  const {
    totalReturn,
    volatility,
    sharpeRatio,
    maxDrawdown,
    trendDirection,
    rsi,
    ma20,
    ma50,
    ma200,
    currentPrice,
    annualizedReturn,
  } = metrics;

  // Score out of 100
  let score = 50;
  if (totalReturn > 20) score += 15;
  else if (totalReturn > 10) score += 10;
  else if (totalReturn > 0) score += 5;
  else if (totalReturn < -20) score -= 15;
  else if (totalReturn < -10) score -= 10;
  else score -= 5;

  if (sharpeRatio > 1.5) score += 15;
  else if (sharpeRatio > 1) score += 10;
  else if (sharpeRatio > 0.5) score += 5;
  else if (sharpeRatio < 0) score -= 15;

  if (volatility < 15) score += 10;
  else if (volatility < 25) score += 5;
  else if (volatility > 50) score -= 10;

  if (rsi < 30) score -= 5; // oversold (could go either way)
  else if (rsi > 70) score -= 5; // overbought

  if (trendDirection === "bullish") score += 10;
  else if (trendDirection === "bearish") score -= 10;

  score = Math.min(Math.max(score, 5), 95);

  // Summary
  const summary =
    trendDirection === "bullish"
      ? `${symbol} shows strong bullish momentum with a ${totalReturn.toFixed(1)}% return over the selected period. The stock is trading above its key moving averages, signaling sustained upward pressure.`
      : trendDirection === "bearish"
      ? `${symbol} is under selling pressure with a ${Math.abs(totalReturn).toFixed(1)}% decline over the selected period. The stock is trading below key moving averages, suggesting continued weakness.`
      : `${symbol} is moving sideways with a ${totalReturn.toFixed(1)}% change over the selected period. No clear directional trend has established yet.`;

  // Momentum
  let momentum: string;
  if (rsi > 70) {
    momentum = `RSI at ${rsi.toFixed(0)} signals the stock may be overbought — short-term pullback is possible. Strong buying interest has driven prices up rapidly.`;
  } else if (rsi < 30) {
    momentum = `RSI at ${rsi.toFixed(0)} signals the stock may be oversold — a bounce or recovery could be near. Heavy selling may be overdone.`;
  } else if (currentPrice > ma20 && currentPrice > ma50) {
    momentum = `Momentum is positive. The stock trades above both its 20-day (${ma20.toFixed(2)}) and 50-day (${ma50.toFixed(2)}) moving averages, showing buying strength.`;
  } else {
    momentum = `Momentum is mixed. Watch for a breakout above the 20-day MA (${ma20.toFixed(2)}) as a potential entry signal.`;
  }

  // Risk
  let risk: string;
  if (volatility > 50) {
    risk = `Volatility is very high at ${volatility.toFixed(1)}% annualized — this stock can swing wildly. Only suitable for risk-tolerant investors. Max drawdown reached ${maxDrawdown.toFixed(1)}%.`;
  } else if (volatility > 30) {
    risk = `Volatility is elevated at ${volatility.toFixed(1)}% annualized — expect significant price swings. The stock has seen a max drawdown of ${maxDrawdown.toFixed(1)}% in this period.`;
  } else if (volatility > 15) {
    risk = `Volatility is moderate at ${volatility.toFixed(1)}% annualized — typical for individual stocks. Max drawdown of ${maxDrawdown.toFixed(1)}% is within normal range.`;
  } else {
    risk = `Volatility is low at ${volatility.toFixed(1)}% annualized — relatively stable compared to most stocks. A good sign for conservative investors.`;
  }

  // Trend
  let trend: string;
  if (currentPrice > ma200 && ma50 > ma200) {
    trend = `Long-term trend is bullish. The stock is above its 200-day MA (${ma200.toFixed(2)}) and the 50-day MA is above the 200-day — a classic golden cross signal.`;
  } else if (currentPrice < ma200 && ma50 < ma200) {
    trend = `Long-term trend is bearish. The stock is below its 200-day MA (${ma200.toFixed(2)}) and the 50-day MA is below the 200-day — a death cross pattern.`;
  } else {
    trend = `Trend is transitioning. The stock is ${currentPrice > ma200 ? "above" : "below"} its 200-day MA (${ma200.toFixed(2)}). Watch for a definitive break to confirm direction.`;
  }

  // Recommendation
  let recommendation: string;
  const confidence: "low" | "medium" | "high" =
    score > 70 ? "high" : score > 50 ? "medium" : "low";

  if (score >= 75) {
    recommendation = `Strong indicators suggest ${symbol} is positioned well. Sharpe ratio of ${sharpeRatio.toFixed(2)} indicates good risk-adjusted returns. Consider this for a growth-oriented portfolio, but always diversify.`;
  } else if (score >= 60) {
    recommendation = `${symbol} shows decent fundamentals with room for improvement. An annualized return of ${annualizedReturn.toFixed(1)}% beats most savings rates. Suitable as part of a diversified portfolio.`;
  } else if (score >= 45) {
    recommendation = `${symbol} presents mixed signals. Wait for clearer trend confirmation before making a decision. Paper-trade or watch for 2-4 weeks first.`;
  } else {
    recommendation = `${symbol} shows concerning metrics. The risk-reward ratio appears unfavorable at this time. Consider waiting for stabilization or look at other opportunities.`;
  }

  return {
    summary,
    momentum,
    risk,
    trend,
    recommendation,
    score,
    confidence,
  };
}

export function prepareChartData(
  historical: HistoricalDataPoint[],
  metrics: StockMetrics
) {
  const closes = historical.map((d) => d.adjClose || d.close);

  // Calculate rolling MAs for chart
  const chartData = historical.map((point, i) => {
    const slice20 = closes.slice(Math.max(0, i - 19), i + 1);
    const slice50 = closes.slice(Math.max(0, i - 49), i + 1);

    const ma20 =
      i >= 19
        ? slice20.reduce((a, b) => a + b, 0) / slice20.length
        : null;
    const ma50 =
      i >= 49
        ? slice50.reduce((a, b) => a + b, 0) / slice50.length
        : null;

    return {
      date: new Date(point.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      fullDate: point.date,
      price: Number((point.adjClose || point.close).toFixed(2)),
      open: Number(point.open.toFixed(2)),
      high: Number(point.high.toFixed(2)),
      low: Number(point.low.toFixed(2)),
      volume: point.volume,
      ma20: ma20 !== null ? Number(ma20.toFixed(2)) : null,
      ma50: ma50 !== null ? Number(ma50.toFixed(2)) : null,
    };
  });

  // Thin out data for large ranges to keep charts performant
  if (chartData.length > 300) {
    const step = Math.ceil(chartData.length / 300);
    return chartData.filter((_, i) => i % step === 0 || i === chartData.length - 1);
  }
  return chartData;
}
