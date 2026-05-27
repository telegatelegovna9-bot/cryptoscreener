"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Filter,
  Grid3X3,
  Puzzle,
  BellRing,
  CandlestickChart,
  Layers,
  Zap,
  Shield,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: Filter,
    title: "Advanced Screener",
    description:
      "Filter 1000+ pairs across 9 exchanges by volume, price change, OI, funding rate, and more. Save custom presets.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: CandlestickChart,
    title: "Multi-Chart Grid",
    description:
      "View 1, 4, 6, or 9 charts simultaneously with real-time candlestick data powered by lightweight-charts.",
    color: "text-accent-cyan",
    bg: "bg-accent-cyan/10",
  },
  {
    icon: Grid3X3,
    title: "Market Heatmap",
    description:
      "Treemap visualization colored by price change. Instantly spot sector rotations and market sentiment.",
    color: "text-accent-pink",
    bg: "bg-accent-pink/10",
  },
  {
    icon: Puzzle,
    title: "AI Pattern Detection",
    description:
      "Automatically detect triangles, head & shoulders, double tops, breakouts, and 10+ other patterns with confidence scores.",
    color: "text-accent-orange",
    bg: "bg-accent-orange/10",
  },
  {
    icon: BellRing,
    title: "Smart Alerts",
    description:
      "Set price, volume, and pattern alerts. Get notified in-app or via Telegram when conditions are met.",
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    icon: Layers,
    title: "Multi-Exchange",
    description:
      "Binance, Bybit, OKX, Bitget, Gate, and more — all unified in a single interface with normalized data.",
    color: "text-accent-blue",
    bg: "bg-accent-blue/10",
  },
  {
    icon: Zap,
    title: "Real-Time WebSocket",
    description:
      "Sub-second latency with persistent WebSocket connections. Price flash animations for every tick.",
    color: "text-bullish",
    bg: "bg-bullish/10",
  },
  {
    icon: Shield,
    title: "No API Keys Required",
    description:
      "Public market data only. No account linking, no withdrawal permissions. Your security is our priority.",
    color: "text-foreground-muted",
    bg: "bg-foreground-muted/10",
  },
  {
    icon: Globe,
    title: "Spot & Futures",
    description:
      "Toggle between spot and perpetual futures markets. Compare funding rates and open interest across exchanges.",
    color: "text-primary-hover",
    bg: "bg-primary-hover/10",
  },
];

export function Features() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="py-24 relative" ref={ref}>
      <div className="orb orb-purple w-[400px] h-[400px] top-0 right-0 opacity-20" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 block">
            Everything You Need
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Professional Tools,
            <br />
            <span className="gradient-text">Zero Complexity</span>
          </h2>
          <p className="mt-4 text-foreground-muted max-w-lg mx-auto">
            From real-time screening to AI-powered pattern detection — everything
            a serious trader needs, in one beautiful interface.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="feature-card glass p-6 rounded-xl"
            >
              <div
                className={`h-10 w-10 rounded-lg ${feature.bg} flex items-center justify-center mb-4`}
              >
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-foreground-muted leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
