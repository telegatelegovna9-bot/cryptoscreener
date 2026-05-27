"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 relative" ref={ref}>
      <div className="orb orb-pink w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" />

      <div className="max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-glow border border-primary/20 mb-8">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">
              Join 10,000+ traders
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
            Ready to See the
            <br />
            <span className="gradient-text">Market Clearly?</span>
          </h2>

          <p className="mt-6 text-lg text-foreground-muted max-w-xl mx-auto">
            Start screening in seconds. No signup required for basic features.
            Upgrade when you&apos;re ready.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/app"
              className="cta-btn flex items-center gap-2 text-lg font-semibold text-white px-10 py-4 rounded-xl"
            >
              Launch CryptoLens
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>

          <p className="mt-6 text-xs text-foreground-dim">
            No credit card · No API keys · Free forever on basic plan
          </p>
        </motion.div>
      </div>
    </section>
  );
}
