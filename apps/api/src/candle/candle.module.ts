import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CandleService } from './candle.service';
import { ExchangeModule } from '../exchange/exchange.module';

@Module({
  imports: [
    ExchangeModule,
    BullModule.registerQueue({
      name: 'candle-ingestion',
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    }),
  ],
  providers: [CandleService],
  exports: [CandleService],
})
export class CandleModule {}
