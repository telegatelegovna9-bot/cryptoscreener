import { Module } from '@nestjs/common';
import { ScreenerService } from './screener.service';
import { ScreenerController } from './screener.controller';
import { MarketDataModule } from '../market-data/market-data.module';

@Module({
  imports: [MarketDataModule],
  controllers: [ScreenerController],
  providers: [ScreenerService],
  exports: [ScreenerService],
})
export class ScreenerModule {}
