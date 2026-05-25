import { IsString, IsArray, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWatchlistDto {
  @ApiProperty({ example: 'My Watchlist' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name: string;

  @ApiProperty({ example: ['BTCUSDT', 'ETHUSDT'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  symbols: string[];
}

export class UpdateWatchlistDto {
  @ApiProperty({ required: false })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name?: string;
}

export class AddSymbolDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @IsString()
  symbol: string;
}
