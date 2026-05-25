import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ScreenerService } from './screener.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { ScreenerRequestDto, SavePresetDto } from '../common/dto/screener.dto';

@ApiTags('Screener')
@Controller('screener')
export class ScreenerController {
  constructor(private readonly screenerService: ScreenerService) {}

  @Post('filter')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Filter tickers with screener criteria' })
  @ApiResponse({ status: 200, description: 'Filtered ticker results' })
  async filter(@Body() dto: ScreenerRequestDto) {
    const result = await this.screenerService.filter({
      filters: dto.filters,
      sortBy: dto.sortBy,
      sortDirection: dto.sortDirection,
      exchanges: dto.exchanges,
      page: dto.page,
      pageSize: dto.pageSize,
      search: dto.search,
    });

    return { success: true, data: result, timestamp: Date.now() };
  }

  @Get('presets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user screener presets' })
  @ApiResponse({ status: 200, description: 'List of presets' })
  async getPresets(@Request() req: any) {
    const presets = await this.screenerService.getPresets(req.user.id);
    return { success: true, data: presets, timestamp: Date.now() };
  }

  @Post('presets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save a screener preset' })
  @ApiResponse({ status: 201, description: 'Preset created' })
  async savePreset(@Body() dto: SavePresetDto, @Request() req: any) {
    const preset = await this.screenerService.savePreset(
      {
        name: dto.name,
        filters: dto.filters,
        sortBy: dto.sortBy,
        sortDirection: dto.sortDirection,
      },
      req.user.id,
    );

    return { success: true, data: preset, timestamp: Date.now() };
  }

  @Delete('presets/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a screener preset' })
  @ApiResponse({ status: 200, description: 'Preset deleted' })
  async deletePreset(@Param('id') id: string, @Request() req: any) {
    await this.screenerService.deletePreset(id, req.user.id);
    return { success: true, timestamp: Date.now() };
  }

  @Get('quick/:type')
  @ApiOperation({ summary: 'Execute a quick filter preset' })
  @ApiResponse({ status: 200, description: 'Quick filter results' })
  async quickFilter(@Param('type') type: string) {
    const result = await this.screenerService.executeQuickFilter(type);
    return { success: true, data: result, timestamp: Date.now() };
  }
}
