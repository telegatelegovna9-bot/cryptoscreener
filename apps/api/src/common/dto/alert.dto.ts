import { IsString, IsOptional, IsEnum, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertType, AlertDelivery, Exchange } from '@crypto-screener/shared';

export class CreateAlertRuleDto {
  @ApiProperty({ enum: AlertType })
  @IsEnum(AlertType)
  type: AlertType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiPropertyOptional({ enum: Exchange })
  @IsOptional()
  @IsEnum(Exchange)
  exchange?: Exchange;

  @ApiProperty()
  condition: Record<string, unknown>;

  @ApiProperty({ enum: AlertDelivery, isArray: true })
  @IsArray()
  @IsEnum(AlertDelivery, { each: true })
  deliveries: AlertDelivery[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class GetAlertsDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  pageSize?: number;
}
