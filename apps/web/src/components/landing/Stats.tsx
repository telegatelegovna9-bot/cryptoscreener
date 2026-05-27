"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { value: "9", label: "Exchanges", suffix: "" },
  { value: "1,247", label: "Trading Pairs", suffix: "+" },
  { value: "50", label: "Patterns Detected", suffix: "+" },
  { value: "<50", label: "Latency", suffix: "ms" },
  { value: "24/7", label: "Monitoring", suffix: "" },
  { value: "0", label: "Cost", suffix: "$" },
];

export function Stats() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="stats" className="py-24 relative" ref={ref}>
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-pink mb-3 block">
            By The Numbers
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Built for <span className="gradient-text-warm">Performance</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass p-6 rounded-xl text-center"
            >
              <div className="text-3xl sm:text-4xl font-bold text-foreground">
                {stat.value}
                <span className="text-primary">{stat.suffix}</span>
              </div>
              <div className="mt-2 text-sm text-foreground-muted">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
