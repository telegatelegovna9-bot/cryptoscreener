import { Module } from '@nestjs/common';
import { MarketDataService } from './market-data.service';
import { ExchangeModule } from '../exchange/exchange.module';

@Module({
  imports: [ExchangeModule],
  providers: [MarketDataService],
  exports: [MarketDataService],
})
export class MarketDataModule {}
