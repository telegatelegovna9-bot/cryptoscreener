'use client';

import { HeatmapView } from '@/components/heatmap-view';

export default function HeatmapPage() {
  return (
    <div className="h-full p-6">
      <h1 className="text-2xl font-bold mb-4">Market Heatmap</h1>
      <HeatmapView />
    </div>
  );
}
