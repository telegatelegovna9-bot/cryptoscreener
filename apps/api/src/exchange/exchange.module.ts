import { Module } from '@nestjs/common';
import { ExchangeService } from './exchange.service';
import { ExchangeStreamService } from './exchange-stream.service';
import { ExchangeController } from './exchange.controller';

@Module({
  controllers: [ExchangeController],
  providers: [ExchangeService, ExchangeStreamService],
  exports: [ExchangeService, ExchangeStreamService],
})
export class ExchangeModule {}
