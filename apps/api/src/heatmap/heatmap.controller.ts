import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { HeatmapService } from './heatmap.service';
import { Exchange } from '@crypto-screener/shared';

@ApiTags('Heatmap')
@Controller('heatmap')
export class HeatmapController {
  constructor(private readonly heatmapService: HeatmapService) {}

  @Get(':symbol')
  @ApiOperation({ summary: 'Get liquidity heatmap data for a symbol' })
  @ApiQuery({ name: 'exchange', required: false, enum: Exchange, description: 'Exchange to query' })
  @ApiResponse({ status: 200, description: 'Heatmap data with liquidity levels' })
  async getHeatmap(
    @Param('symbol') symbol: string,
    @Query('exchange') exchange?: Exchange,
  ) {
    try {
      const data = await this.heatmapService.getHeatmapData(
        symbol,
        exchange ?? Exchange.BINANCE,
      );
      return { success: true, data, timestamp: Date.now() };
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to fetch heatmap', HttpStatus.BAD_REQUEST);
    }
  }
}
