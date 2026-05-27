"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X, Zap } from "lucide-react";
import { cn } from "@/lib/cn";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#preview", label: "Live Demo" },
  { href: "#pricing", label: "Pricing" },
  { href: "#stats", label: "Stats" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-bg-base/80 backdrop-blur-xl border-b border-glass-border shadow-glass"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center shadow-glow transition-shadow group-hover:shadow-glow-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground">
            Crypto<span className="gradient-text">Lens</span>
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/app"
            className="text-sm text-foreground-muted hover:text-foreground transition-colors px-4 py-2"
          >
            Sign In
          </a>
          <a
            href="/app"
            className="cta-btn text-sm font-semibold text-white px-5 py-2.5 rounded-xl"
          >
            Launch App
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-foreground-muted hover:text-foreground"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-bg-base/95 backdrop-blur-xl border-b border-glass-border p-4 space-y-3"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-foreground-muted hover:text-foreground py-2 px-3 rounded-lg hover:bg-bg-hover"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/app"
            className="block cta-btn text-sm font-semibold text-white text-center px-5 py-2.5 rounded-xl mt-2"
          >
            Launch App
          </a>
        </motion.div>
      )}
    </motion.nav>
  );
}
