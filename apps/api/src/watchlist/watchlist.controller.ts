import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WatchlistService } from './watchlist.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CreateWatchlistDto, UpdateWatchlistDto, AddSymbolDto } from '../common/dto/watchlist.dto';

@ApiTags('Watchlists')
@Controller('watchlists')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user watchlists' })
  @ApiResponse({ status: 200, description: 'List of watchlists' })
  async getWatchlists(@Request() req: any) {
    return this.watchlistService.getWatchlists(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new watchlist' })
  @ApiResponse({ status: 201, description: 'Watchlist created' })
  async createWatchlist(@Request() req: any, @Body() body: CreateWatchlistDto) {
    return this.watchlistService.createWatchlist(req.user.id, body.name, body.symbols);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a watchlist' })
  @ApiResponse({ status: 200, description: 'Watchlist updated' })
  async updateWatchlist(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: UpdateWatchlistDto,
  ) {
    return this.watchlistService.updateWatchlist(req.user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a watchlist' })
  @ApiResponse({ status: 204, description: 'Watchlist deleted' })
  async deleteWatchlist(@Request() req: any, @Param('id') id: string) {
    await this.watchlistService.deleteWatchlist(req.user.id, id);
  }

  @Post(':id/symbols')
  @ApiOperation({ summary: 'Add symbol to watchlist' })
  @ApiResponse({ status: 200, description: 'Symbol added' })
  async addSymbol(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: AddSymbolDto,
  ) {
    return this.watchlistService.addSymbol(req.user.id, id, body.symbol);
  }

  @Delete(':id/symbols/:symbol')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove symbol from watchlist' })
  @ApiResponse({ status: 204, description: 'Symbol removed' })
  async removeSymbol(
    @Request() req: any,
    @Param('id') id: string,
    @Param('symbol') symbol: string,
  ) {
    await this.watchlistService.removeSymbol(req.user.id, id, symbol);
  }
}
