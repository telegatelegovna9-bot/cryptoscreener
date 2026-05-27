'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAlertStore } from '@/stores/alert';
import { Badge } from '@/components/ui/badge';

const severityConfig = {
  high: { color: 'bg-destructive', badgeVariant: 'destructive' as const, label: 'HIGH' },
  critical: { color: 'bg-destructive', badgeVariant: 'destructive' as const, label: 'CRITICAL' },
  medium: { color: 'bg-warning', badgeVariant: 'warning' as const, label: 'MEDIUM' },
  low: { color: 'bg-primary', badgeVariant: 'default' as const, label: 'LOW' },
};

function AlertCard({
  alert,
  onDismiss,
}: {
  alert: ReturnType<typeof useAlertStore.getState>['alerts'][0];
  onDismiss: () => void;
}) {
  const [progress, setProgress] = useState(100);
  const config = severityConfig[alert.severity] ?? severityConfig.low;

  useEffect(() => {
    const duration = 5000;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev - step;
        if (next <= 0) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onDismiss]);

  return (
    <motion.div
      layout
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="w-80 bg-card border border-border rounded-lg shadow-xl overflow-hidden"
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                'inline-block w-2 h-2 rounded-full shrink-0',
                config.color
              )}
            />
            <span className="text-sm font-semibold text-foreground truncate">
              {alert.title}
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="text-foreground-muted hover:text-foreground transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="text-xs text-foreground-muted mb-2 line-clamp-2">
          {alert.message}
        </p>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {alert.symbol}
          </Badge>
          <Badge variant={config.badgeVariant} className="text-[10px]">
            {config.label}
          </Badge>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-muted">
        <div
          className={cn('h-full transition-all duration-75 ease-linear', config.color)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}

export function AlertPopup() {
  const alerts = useAlertStore((s) => s.popupAlerts);
  const dismissPopup = useAlertStore((s) => s.dismissPopup);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onDismiss={() => dismissPopup(alert.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
