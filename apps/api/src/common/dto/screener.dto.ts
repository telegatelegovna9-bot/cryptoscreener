import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Exchange, SortDirection } from '@crypto-screener/shared';

export class ScreenerFilterDto {
  @ApiProperty()
  @IsString()
  field: string;

  @ApiProperty({ enum: ['gt', 'lt', 'gte', 'lte', 'eq', 'between'] })
  @IsString()
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'between';

  @ApiProperty()
  value: number | [number, number];
}

export class ScreenerRequestDto {
  @ApiPropertyOptional({ type: [ScreenerFilterDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScreenerFilterDto)
  filters?: ScreenerFilterDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: SortDirection, default: SortDirection.DESC })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection;

  @ApiPropertyOptional({ enum: Exchange, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(Exchange, { each: true })
  exchanges?: Exchange[];

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class SavePresetDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ type: [ScreenerFilterDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScreenerFilterDto)
  filters?: ScreenerFilterDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: SortDirection, default: SortDirection.DESC })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection;
}
