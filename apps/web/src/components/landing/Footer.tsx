"use client";

import { Zap, Github, Twitter, MessageCircle } from "lucide-react";

const links = {
  product: [
    { label: "Screener", href: "/app" },
    { label: "Heatmap", href: "/app" },
    { label: "Patterns", href: "/app" },
    { label: "Alerts", href: "/app" },
    { label: "Pricing", href: "#pricing" },
  ],
  resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Changelog", href: "#" },
    { label: "Status", href: "#" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border-default py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <a href="#" className="flex items-center gap-2.5 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-foreground">
                Crypto<span className="gradient-text">Lens</span>
              </span>
            </a>
            <p className="text-sm text-foreground-muted leading-relaxed max-w-xs">
              Professional-grade crypto screener with real-time data, AI pattern
              detection, and stunning visualizations.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[
                { icon: Github, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: MessageCircle, href: "#" },
              ].map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  className="h-8 w-8 rounded-lg bg-bg-surface border border-border-default flex items-center justify-center text-foreground-secondary hover:text-foreground hover:border-border-hover transition-colors"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground-secondary mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {items.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-foreground-muted hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-14 pt-6 border-t border-border-default flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-foreground-dim">
            © 2026 CryptoLens. All rights reserved.
          </span>
          <div className="flex items-center gap-6 text-xs text-foreground-dim">
            <a href="#" className="hover:text-foreground-muted transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground-muted transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-foreground-muted transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
