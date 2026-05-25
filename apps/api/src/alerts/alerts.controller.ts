import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CreateAlertRuleDto, GetAlertsDto } from '../common/dto/alert.dto';

@ApiTags('Alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user alerts' })
  @ApiResponse({ status: 200, description: 'Paginated list of alerts' })
  async getAlerts(@Request() req: any, @Query() query: GetAlertsDto) {
    const result = await this.alertsService.getAlerts(
      req.user.id,
      query.unreadOnly,
      query.page || 1,
      query.pageSize || 50,
    );
    return { success: true, data: result, timestamp: Date.now() };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark alert as read' })
  @ApiResponse({ status: 200, description: 'Alert marked as read' })
  async markAsRead(@Param('id') id: string) {
    await this.alertsService.markAsRead(id);
    return { success: true, timestamp: Date.now() };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all alerts as read' })
  @ApiResponse({ status: 200, description: 'All alerts marked as read' })
  async markAllAsRead(@Request() req: any) {
    await this.alertsService.markAllAsRead(req.user.id);
    return { success: true, timestamp: Date.now() };
  }

  @Get('rules')
  @ApiOperation({ summary: 'Get user alert rules' })
  @ApiResponse({ status: 200, description: 'List of alert rules' })
  async getRules(@Request() req: any) {
    const rules = await this.alertsService.getRules(req.user.id);
    return { success: true, data: rules, timestamp: Date.now() };
  }

  @Post('rules')
  @ApiOperation({ summary: 'Create an alert rule' })
  @ApiResponse({ status: 201, description: 'Alert rule created' })
  async createRule(@Body() dto: CreateAlertRuleDto, @Request() req: any) {
    const rule = await this.alertsService.createRule({
      userId: req.user.id,
      type: dto.type,
      symbol: dto.symbol,
      exchange: dto.exchange,
      condition: dto.condition,
      deliveries: dto.deliveries,
      enabled: dto.enabled,
    });
    return { success: true, data: rule, timestamp: Date.now() };
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an alert rule' })
  @ApiResponse({ status: 200, description: 'Alert rule deleted' })
  async deleteRule(@Param('id') id: string, @Request() req: any) {
    await this.alertsService.deleteRule(id, req.user.id);
    return { success: true, timestamp: Date.now() };
  }
}
