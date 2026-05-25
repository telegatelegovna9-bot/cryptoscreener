import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exchange, Timeframe } from '@crypto-screener/shared';

export class GetCandlesDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @IsString()
  symbol: string;

  @ApiPropertyOptional({ enum: Timeframe, default: Timeframe.H1 })
  @IsOptional()
  @IsEnum(Timeframe)
  timeframe?: Timeframe;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  since?: number;

  @ApiPropertyOptional({ default: 500 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;
}

export class GetTickersDto {
  @ApiPropertyOptional({ description: 'Comma-separated symbols' })
  @IsOptional()
  @IsString()
  symbols?: string;
}

export class GetOrderBookDto {
  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}
