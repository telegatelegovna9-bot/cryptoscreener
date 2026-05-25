import { Module } from '@nestjs/common';
import { HeatmapService } from './heatmap.service';
import { HeatmapController } from './heatmap.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { ExchangeModule } from '../exchange/exchange.module';

@Module({
  imports: [PrismaModule, RedisModule, ExchangeModule],
  controllers: [HeatmapController],
  providers: [HeatmapService],
  exports: [HeatmapService],
})
export class HeatmapModule {}
