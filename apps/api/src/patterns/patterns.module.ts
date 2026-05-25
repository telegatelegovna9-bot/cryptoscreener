import { Module } from '@nestjs/common';
import { PatternsService } from './patterns.service';
import { PatternsController } from './patterns.controller';
import { ExchangeModule } from '../exchange/exchange.module';
import { CandleModule } from '../candle/candle.module';

@Module({
  imports: [ExchangeModule, CandleModule],
  controllers: [PatternsController],
  providers: [PatternsService],
  exports: [PatternsService],
})
export class PatternsModule {}
