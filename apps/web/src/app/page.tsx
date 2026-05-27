'use client';

import { CoinList } from '@/components/coin-list';
import { ChartGrid } from '@/components/chart-grid';

export default function Home() {
  return (
    <div className="flex h-full">
      <div className="w-[480px] flex-shrink-0 border-r border-border overflow-hidden">
        <CoinList />
      </div>
      <div className="flex-1 overflow-hidden">
        <ChartGrid />
      </div>
    </div>
  );
}
