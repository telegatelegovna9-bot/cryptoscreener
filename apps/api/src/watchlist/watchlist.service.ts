import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WatchlistService {
  constructor(private readonly prisma: PrismaService) {}

  async getWatchlists(userId: string) {
    return this.prisma.watchlist.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createWatchlist(userId: string, name: string, symbols: string[] = []) {
    return this.prisma.watchlist.create({
      data: { userId, name, symbols },
    });
  }

  async updateWatchlist(userId: string, id: string, data: { name?: string; symbols?: string[] }) {
    const watchlist = await this.prisma.watchlist.findFirst({
      where: { id, userId },
    });

    if (!watchlist) {
      throw new NotFoundException('Watchlist not found');
    }

    return this.prisma.watchlist.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async deleteWatchlist(userId: string, id: string) {
    const watchlist = await this.prisma.watchlist.findFirst({
      where: { id, userId },
    });

    if (!watchlist) {
      throw new NotFoundException('Watchlist not found');
    }

    return this.prisma.watchlist.delete({ where: { id } });
  }

  async addSymbol(userId: string, id: string, symbol: string) {
    const watchlist = await this.prisma.watchlist.findFirst({
      where: { id, userId },
    });

    if (!watchlist) {
      throw new NotFoundException('Watchlist not found');
    }

    if (watchlist.symbols.includes(symbol)) {
      throw new ConflictException('Symbol already in watchlist');
    }

    return this.prisma.watchlist.update({
      where: { id },
      data: {
        symbols: [...watchlist.symbols, symbol],
        updatedAt: new Date(),
      },
    });
  }

  async removeSymbol(userId: string, id: string, symbol: string) {
    const watchlist = await this.prisma.watchlist.findFirst({
      where: { id, userId },
    });

    if (!watchlist) {
      throw new NotFoundException('Watchlist not found');
    }

    return this.prisma.watchlist.update({
      where: { id },
      data: {
        symbols: watchlist.symbols.filter((s: any) => s !== symbol),
        updatedAt: new Date(),
      },
    });
  }
}
