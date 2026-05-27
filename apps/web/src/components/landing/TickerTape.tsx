"use client";

const tickers = [
  { symbol: "BTC", price: "$67,420", change: "+2.3%", up: true },
  { symbol: "ETH", price: "$3,520", change: "-1.1%", up: false },
  { symbol: "SOL", price: "$178.50", change: "+5.7%", up: true },
  { symbol: "BNB", price: "$612.00", change: "+0.8%", up: true },
  { symbol: "XRP", price: "$0.6200", change: "-0.4%", up: false },
  { symbol: "DOGE", price: "$0.1630", change: "+3.2%", up: true },
  { symbol: "ADA", price: "$0.4800", change: "+1.5%", up: true },
  { symbol: "AVAX", price: "$38.20", change: "-2.8%", up: false },
  { symbol: "DOT", price: "$7.85", change: "+1.2%", up: true },
  { symbol: "LINK", price: "$14.32", change: "+4.1%", up: true },
  { symbol: "MATIC", price: "$0.89", change: "-0.9%", up: false },
  { symbol: "UNI", price: "$12.45", change: "+2.8%", up: true },
];

export function TickerTape() {
  const doubled = [...tickers, ...tickers];

  return (
    <div className="ticker-tape py-3 overflow-hidden">
      <div className="animate-marquee flex items-center gap-8 whitespace-nowrap">
        {doubled.map((t, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-foreground">{t.symbol}</span>
            <span className="text-foreground-muted tabular-nums font-mono">
              {t.price}
            </span>
            <span
              className={`tabular-nums font-mono ${
                t.up ? "text-bullish" : "text-bearish"
              }`}
            >
              {t.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
