"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, TrendingUp, Shield } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Orbs */}
      <div className="orb orb-purple w-[600px] h-[600px] -top-40 -left-40" />
      <div className="orb orb-cyan w-[500px] h-[500px] top-20 -right-32" />
      <div className="orb orb-pink w-[400px] h-[400px] bottom-0 left-1/3" />

      {/* Grid Background */}
      <div className="absolute inset-0 grid-bg opacity-50" />

      {/* Radial Fade */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-bg-base)_70%)]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-glow border border-primary/20 mb-8"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">
            Free Forever · No Credit Card Required
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
        >
          See the Market
          <br />
          <span className="gradient-text">Clearly.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-foreground-muted max-w-2xl mx-auto leading-relaxed"
        >
          Professional-grade crypto screener with real-time data from 9
          exchanges, AI pattern detection, and stunning visualizations.
          <br className="hidden sm:block" />
          Built for traders who demand clarity.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="/app"
            className="cta-btn flex items-center gap-2 text-base font-semibold text-white px-8 py-3.5 rounded-xl"
          >
            Launch Screener
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#preview"
            className="flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors px-6 py-3.5 rounded-xl border border-border-default hover:border-border-hover hover:bg-bg-hover"
          >
            <Play className="h-4 w-4" />
            Watch Demo
          </a>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-14 flex flex-wrap items-center justify-center gap-6 text-xs text-foreground-secondary"
        >
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-accent-cyan" />
            <span>No API keys needed</span>
          </div>
          <div className="w-px h-4 bg-border-default" />
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-bullish" />
            <span>9 exchanges supported</span>
          </div>
          <div className="w-px h-4 bg-border-default" />
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>AI pattern detection</span>
          </div>
        </motion.div>

        {/* Hero Visual — Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 relative"
        >
          {/* Glow behind */}
          <div className="absolute -inset-4 bg-gradient-to-b from-primary/20 via-accent-cyan/10 to-transparent rounded-2xl blur-2xl" />

          {/* Dashboard Mock */}
          <div className="relative glass rounded-2xl p-1 shadow-glow-lg">
            <div className="bg-bg-surface rounded-xl overflow-hidden">
              {/* Title Bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border-default bg-bg-base/50">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-bearish/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-bullish/60" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-[10px] text-foreground-secondary font-mono">
                    cryptolens.io/app
                  </span>
                </div>
              </div>

              {/* Fake Dashboard Content */}
              <div className="p-4 grid grid-cols-4 gap-3">
                {/* Mini Stat Cards */}
                {[
                  { label: "BTC", value: "$67,420", change: "+2.3%", up: true },
                  { label: "ETH", value: "$3,520", change: "-1.1%", up: false },
                  { label: "SOL", value: "$178.5", change: "+5.7%", up: true },
                  { label: "BNB", value: "$612.0", change: "+0.8%", up: true },
                ].map((coin) => (
                  <div
                    key={coin.label}
                    className="bg-bg-base/50 rounded-lg p-3 border border-border-default"
                  >
                    <div className="text-[10px] text-foreground-secondary mb-1">
                      {coin.label}/USDT
                    </div>
                    <div className="text-sm font-semibold tabular-nums">
                      {coin.value}
                    </div>
                    <div
                      className={`text-[10px] font-medium mt-0.5 ${
                        coin.up ? "text-bullish" : "text-bearish"
                      }`}
                    >
                      {coin.change}
                    </div>
                  </div>
                ))}

                {/* Chart Placeholder */}
                <div className="col-span-2 bg-bg-base/50 rounded-lg border border-border-default p-3 h-32">
                  <svg viewBox="0 0 200 60" className="w-full h-full opacity-40">
                    <polyline
                      points="0,50 20,45 40,48 60,30 80,35 100,20 120,25 140,15 160,18 180,10 200,5"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2"
                    />
                    <polyline
                      points="0,50 20,45 40,48 60,30 80,35 100,20 120,25 140,15 160,18 180,10 200,5"
                      fill="url(#greenGrad)"
                      strokeWidth="0"
                    />
                    <defs>
                      <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Screener Table Preview */}
                <div className="col-span-2 bg-bg-base/50 rounded-lg border border-border-default p-3 h-32">
                  <div className="text-[10px] text-foreground-secondary mb-2 font-medium">
                    Top Gainers
                  </div>
                  {[
                    { s: "SOL", ch: "+5.7%" },
                    { s: "DOGE", ch: "+3.2%" },
                    { s: "BTC", ch: "+2.3%" },
                    { s: "ADA", ch: "+1.5%" },
                  ].map((r) => (
                    <div
                      key={r.s}
                      className="flex justify-between text-[10px] py-0.5"
                    >
                      <span className="text-foreground-muted">{r.s}</span>
                      <span className="text-bullish tabular-nums">{r.ch}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
