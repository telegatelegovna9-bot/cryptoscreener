import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Exchange, Timeframe, PatternType } from '@crypto-screener/shared';

export class GetPatternsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiPropertyOptional({ enum: Exchange })
  @IsOptional()
  @IsEnum(Exchange)
  exchange?: Exchange;

  @ApiPropertyOptional({ enum: PatternType })
  @IsOptional()
  @IsEnum(PatternType)
  type?: PatternType;

  @ApiPropertyOptional({ enum: Timeframe })
  @IsOptional()
  @IsEnum(Timeframe)
  timeframe?: Timeframe;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  pageSize?: number;
}

export class DetectPatternsDto {
  @ApiPropertyOptional({ example: 'BTCUSDT' })
  @IsString()
  symbol: string;

  @ApiPropertyOptional({ enum: Exchange, default: Exchange.BINANCE })
  @IsOptional()
  @IsEnum(Exchange)
  exchange?: Exchange;

  @ApiPropertyOptional({ enum: Timeframe, default: Timeframe.H1 })
  @IsOptional()
  @IsEnum(Timeframe)
  timeframe?: Timeframe;
}
