import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PatternsService } from './patterns.service';
import { GetPatternsDto, DetectPatternsDto } from '../common/dto/pattern.dto';
import { Exchange, PatternType, Timeframe } from '@crypto-screener/shared';

@ApiTags('Patterns')
@Controller('patterns')
export class PatternsController {
  constructor(private readonly patternsService: PatternsService) {}

  @Get()
  @ApiOperation({ summary: 'Get detected patterns with filters' })
  @ApiQuery({ name: 'symbol', required: false })
  @ApiQuery({ name: 'exchange', required: false, enum: Exchange })
  @ApiQuery({ name: 'type', required: false, enum: PatternType })
  @ApiQuery({ name: 'timeframe', required: false, enum: Timeframe })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of detected patterns' })
  async getPatterns(@Query() query: GetPatternsDto) {
    return this.patternsService.getLatestPatterns({
      symbol: query.symbol,
      exchange: query.exchange,
      type: query.type,
      timeframe: query.timeframe,
      limit: query.pageSize,
    });
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest patterns across all symbols' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Latest detected patterns' })
  async getLatest(@Query('limit') limit?: number) {
    return this.patternsService.getLatestPatterns({ limit: limit ?? 50 });
  }

  @Post('detect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger pattern detection for a specific symbol' })
  @ApiResponse({ status: 200, description: 'Detected patterns for the symbol' })
  async detectPatterns(@Body() body: DetectPatternsDto) {
    return this.patternsService.detectPatterns(
      body.symbol,
      body.exchange ?? Exchange.BINANCE,
      body.timeframe ?? Timeframe.H1,
    );
  }
}
