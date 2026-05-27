"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, Sparkles, Zap, Crown } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to get started",
    icon: Zap,
    popular: false,
    features: [
      "Real-time price data",
      "9 exchanges",
      "Screener with filters",
      "Heatmap view",
      "1 chart grid",
      "10 alerts",
      "Watchlist (50 coins)",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For serious traders who need more",
    icon: Sparkles,
    popular: true,
    features: [
      "Everything in Free",
      "9-chart grid layout",
      "AI pattern detection",
      "Unlimited alerts",
      "Unlimited watchlist",
      "Custom screener presets",
      "Futures data & OI",
      "Priority support",
      "API access (coming soon)",
    ],
  },
  {
    name: "Enterprise",
    price: "$49",
    period: "/month",
    description: "For teams and institutions",
    icon: Crown,
    popular: false,
    features: [
      "Everything in Pro",
      "Team accounts (5 seats)",
      "Custom data feeds",
      "White-label option",
      "Dedicated WebSocket",
      "SLA guarantee",
      "Phone support",
      "Custom integrations",
    ],
  },
];

export function Pricing() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" className="py-24 relative" ref={ref}>
      <div className="orb orb-purple w-[400px] h-[400px] top-1/2 -right-40 opacity-15" />

      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-warning mb-3 block">
            Simple Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Start Free, <span className="gradient-text">Scale Later</span>
          </h2>
          <p className="mt-4 text-foreground-muted max-w-md mx-auto">
            No hidden fees. No API keys. Cancel anytime.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`glass p-6 rounded-xl flex flex-col ${
                plan.popular ? "pricing-popular" : ""
              }`}
            >
              {plan.popular && (
                <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
                  Most Popular
                </div>
              )}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                    plan.popular
                      ? "bg-primary-glow text-primary"
                      : "bg-bg-elevated text-foreground-muted"
                  }`}
                >
                  <plan.icon className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold text-foreground">
                  {plan.name}
                </span>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold text-foreground">
                  {plan.price}
                </span>
                <span className="text-sm text-foreground-muted">
                  {plan.period}
                </span>
              </div>
              <p className="text-sm text-foreground-muted mb-6">
                {plan.description}
              </p>
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent-cyan shrink-0 mt-0.5" />
                    <span className="text-foreground-muted">{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="/app"
                className={`block text-center text-sm font-semibold py-2.5 rounded-xl transition-all ${
                  plan.popular
                    ? "cta-btn text-white"
                    : "border border-border-default text-foreground-muted hover:text-foreground hover:border-border-hover hover:bg-bg-hover"
                }`}
              >
                {plan.price === "$0" ? "Get Started Free" : "Start Free Trial"}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
