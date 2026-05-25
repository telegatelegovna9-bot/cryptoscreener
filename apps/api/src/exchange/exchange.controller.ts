import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ExchangeService } from './exchange.service';
import { GetCandlesDto, GetTickersDto, GetOrderBookDto } from '../common/dto/exchange.dto';
import { Exchange } from '@crypto-screener/shared';

@ApiTags('Exchanges')
@Controller('exchanges')
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  @Get()
  @ApiOperation({ summary: 'List all supported exchanges' })
  @ApiResponse({ status: 200, description: 'List of exchanges' })
  getAllExchanges() {
    const exchanges = this.exchangeService.getAllExchanges();
    return { success: true, data: exchanges, timestamp: Date.now() };
  }

  @Get('tickers')
  @ApiOperation({ summary: 'Get all tickers (shorthand)' })
  async getAllTickers(
    @Query('exchange') exchange?: string,
    @Query('marketType') marketType?: string,
  ) {
    try {
      const tickers = await this.exchangeService.getTickers(exchange || 'binance', undefined, marketType);
      return { success: true, data: tickers, timestamp: Date.now() };
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to fetch tickers', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('candles')
  @ApiOperation({ summary: 'Get candles (shorthand)' })
  async getAllCandles(
    @Query('symbol') symbol: string,
    @Query('exchange') exchange?: string,
    @Query('timeframe') timeframe?: string,
    @Query('limit') limit?: number,
    @Query('since') since?: string,
  ) {
    try {
      const sinceNum = since ? parseInt(since, 10) : undefined;
      const candles = await this.exchangeService.getCandles(
        exchange || 'binance',
        symbol,
        timeframe || '1h',
        sinceNum && !isNaN(sinceNum) ? sinceNum : undefined,
        limit || 500,
      );
      return { success: true, data: candles, timestamp: Date.now() };
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to fetch candles', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('orderbook')
  @ApiOperation({ summary: 'Get order book (shorthand)' })
  async getOrderBookShorthand(
    @Query('symbol') symbol: string,
    @Query('exchange') exchange?: string,
    @Query('limit') limit?: number,
  ) {
    try {
      const book = await this.exchangeService.getOrderBook(exchange || 'binance', symbol, limit || 50);
      return { success: true, data: book, timestamp: Date.now() };
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to fetch order book', HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':exchange/tickers')
  @ApiOperation({ summary: 'Get tickers from an exchange' })
  @ApiParam({ name: 'exchange', enum: Exchange })
  @ApiQuery({ name: 'symbols', required: false, description: 'Comma-separated symbols' })
  @ApiQuery({ name: 'marketType', required: false, description: 'spot, futures, or perpetual' })
  async getTickers(
    @Param('exchange') exchange: string,
    @Query() query: GetTickersDto,
  ) {
    try {
      const symbols = query.symbols ? query.symbols.split(',').map((s) => s.trim()) : undefined;
      const tickers = await this.exchangeService.getTickers(exchange, symbols, (query as any).marketType);
      return { success: true, data: tickers, timestamp: Date.now() };
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to fetch tickers', HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':exchange/candles')
  @ApiOperation({ summary: 'Get OHLCV candles' })
  @ApiParam({ name: 'exchange', enum: Exchange })
  async getCandles(
    @Param('exchange') exchange: string,
    @Query() query: GetCandlesDto,
  ) {
    try {
      const candles = await this.exchangeService.getCandles(
        exchange,
        query.symbol,
        query.timeframe || '1h',
        query.since,
        query.limit || 500,
      );
      return { success: true, data: candles, timestamp: Date.now() };
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to fetch candles', HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':exchange/orderbook/:symbol')
  @ApiOperation({ summary: 'Get order book' })
  @ApiParam({ name: 'exchange', enum: Exchange })
  @ApiParam({ name: 'symbol', example: 'BTCUSDT' })
  async getOrderBook(
    @Param('exchange') exchange: string,
    @Param('symbol') symbol: string,
    @Query() query: GetOrderBookDto,
  ) {
    try {
      const book = await this.exchangeService.getOrderBook(exchange, symbol, query.limit || 50);
      return { success: true, data: book, timestamp: Date.now() };
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to fetch order book', HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':exchange/funding/:symbol')
  @ApiOperation({ summary: 'Get funding rate' })
  @ApiParam({ name: 'exchange', enum: Exchange })
  @ApiParam({ name: 'symbol', example: 'BTCUSDT' })
  async getFundingRate(
    @Param('exchange') exchange: string,
    @Param('symbol') symbol: string,
  ) {
    try {
      const funding = await this.exchangeService.getFundingRate(exchange, symbol);
      return { success: true, data: funding, timestamp: Date.now() };
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to fetch funding rate', HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':exchange/oi/:symbol')
  @ApiOperation({ summary: 'Get open interest' })
  @ApiParam({ name: 'exchange', enum: Exchange })
  @ApiParam({ name: 'symbol', example: 'BTCUSDT' })
  async getOpenInterest(
    @Param('exchange') exchange: string,
    @Param('symbol') symbol: string,
  ) {
    try {
      const oi = await this.exchangeService.getOpenInterest(exchange, symbol);
      return { success: true, data: oi, timestamp: Date.now() };
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to fetch open interest', HttpStatus.BAD_REQUEST);
    }
  }
}
