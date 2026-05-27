"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowRight, ExternalLink } from "lucide-react";

const screenerData = [
  { rank: 1, symbol: "SOL", exchange: "Binance", price: "$178.50", change: 5.7, volume: "$450M", oi: "+12%", funding: "0.025%" },
  { rank: 2, symbol: "DOGE", exchange: "Bybit", price: "$0.1630", change: 3.2, volume: "$210M", oi: "+8%", funding: "0.018%" },
  { rank: 3, symbol: "LINK", exchange: "OKX", price: "$14.32", change: 4.1, volume: "$180M", oi: "+15%", funding: "0.031%" },
  { rank: 4, symbol: "BTC", exchange: "Binance", price: "$67,420", change: 2.3, volume: "$1.2B", oi: "+5%", funding: "0.012%" },
  { rank: 5, symbol: "ADA", exchange: "Bitget", price: "$0.4800", change: 1.5, volume: "$150M", oi: "+3%", funding: "0.009%" },
  { rank: 6, symbol: "ETH", exchange: "Binance", price: "$3,520", change: -1.1, volume: "$800M", oi: "+2%", funding: "0.008%" },
  { rank: 7, symbol: "AVAX", exchange: "Gate", price: "$38.20", change: -2.8, volume: "$120M", oi: "-4%", funding: "-0.005%" },
];

const quickFilters = [
  { label: "🔥 Top Gainers", active: true },
  { label: "📊 High Volume", active: false },
  { label: "⚡ OI Spike", active: false },
  { label: "💎 Funding Flip", active: false },
];

export function LivePreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="preview" className="py-24 relative" ref={ref}>
      <div className="orb orb-cyan w-[500px] h-[500px] -bottom-40 -left-40 opacity-15" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-cyan mb-3 block">
            Live Demo
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold">
            See It In <span className="gradient-text">Action</span>
          </h2>
          <p className="mt-4 text-foreground-muted max-w-lg mx-auto">
            Real-time screener with instant filtering, sorting, and multi-exchange
            data. Try it yourself — it&apos;s free.
          </p>
        </motion.div>

        {/* Screener Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          {/* Glow */}
          <div className="absolute -inset-4 bg-gradient-to-b from-accent-cyan/15 via-primary/10 to-transparent rounded-3xl blur-2xl" />

          <div className="relative glass rounded-2xl p-1 shadow-glow-lg">
            <div className="bg-bg-surface rounded-xl overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border-default">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-bearish/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-bullish/60" />
                  </div>
                  <span className="text-xs text-foreground-secondary font-mono">
                    screener — futures — 1h
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-foreground-dim px-2 py-1 rounded bg-bg-base/50 border border-border-default">
                    Binance · Bybit · OKX
                  </span>
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border-default overflow-x-auto">
                {quickFilters.map((f) => (
                  <button
                    key={f.label}
                    className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                      f.active
                        ? "bg-primary-glow text-primary border border-primary/20"
                        : "text-foreground-muted border border-border-default hover:border-border-hover"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="text-left py-2.5 px-5 text-foreground-secondary font-medium">#</th>
                      <th className="text-left py-2.5 px-2 text-foreground-secondary font-medium">Symbol</th>
                      <th className="text-left py-2.5 px-2 text-foreground-secondary font-medium">Exchange</th>
                      <th className="text-right py-2.5 px-2 text-foreground-secondary font-medium">Price</th>
                      <th className="text-right py-2.5 px-2 text-foreground-secondary font-medium">24h%</th>
                      <th className="text-right py-2.5 px-2 text-foreground-secondary font-medium">Volume</th>
                      <th className="text-right py-2.5 px-2 text-foreground-secondary font-medium">OI Δ</th>
                      <th className="text-right py-2.5 px-5 text-foreground-secondary font-medium">Funding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {screenerData.map((row, i) => (
                      <motion.tr
                        key={row.symbol}
                        initial={{ opacity: 0, x: -20 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.4, delay: 0.4 + i * 0.06 }}
                        className="border-b border-border-default/50 hover:bg-bg-hover transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-5 text-foreground-dim">{row.rank}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-bg-elevated border border-border-default flex items-center justify-center">
                              <span className="text-[9px] font-bold text-foreground-muted">
                                {row.symbol.slice(0, 2)}
                              </span>
                            </div>
                            <span className="font-semibold text-foreground">
                              {row.symbol}
                            </span>
                            <span className="text-foreground-dim">/USDT</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-foreground-secondary">{row.exchange}</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums text-foreground">
                          {row.price}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span
                            className={`inline-flex items-center gap-0.5 font-mono tabular-nums ${
                              row.change >= 0 ? "text-bullish" : "text-bearish"
                            }`}
                          >
                            {row.change >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {row.change >= 0 ? "+" : ""}
                            {row.change.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums text-foreground-muted">
                          {row.volume}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className={`font-mono tabular-nums ${
                            row.oi.startsWith("+") ? "text-bullish" : "text-bearish"
                          }`}>
                            {row.oi}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right font-mono tabular-nums text-foreground-muted">
                          {row.funding}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-border-default">
                <span className="text-[10px] text-foreground-dim">
                  Showing 7 of 1,247 pairs · Updated live
                </span>
                <a
                  href="/app"
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover transition-colors"
                >
                  Open Full Screener
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
