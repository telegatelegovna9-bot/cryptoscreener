import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { MarketDataModule } from '../market-data/market-data.module';
import { ExchangeModule } from '../exchange/exchange.module';

@Module({
  imports: [MarketDataModule, ExchangeModule],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
