'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Filter,
  BarChart3,
  Grid3x3,
  Triangle,
  Bell,
  Star,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const navItems = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/screener', label: 'Screener', icon: Filter },
  { href: '/charts', label: 'Charts', icon: BarChart3 },
  { href: '/heatmap', label: 'Heatmap', icon: Grid3x3 },
  { href: '/patterns', label: 'Patterns', icon: Triangle },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/watchlist', label: 'Watchlist', icon: Star },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-16 bg-card border-r border-border z-50 flex flex-col items-center py-4">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-white font-bold text-sm mb-6 hover:bg-primary-hover transition-colors"
      >
        CS
      </Link>

      {/* Navigation */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-150',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-foreground-muted hover:bg-glass-strong hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
