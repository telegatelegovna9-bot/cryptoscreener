import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramGuard } from './telegram.guard';
import { UserSettings, Exchange, Timeframe } from '@crypto-screener/shared';

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  defaultExchange: Exchange.BINANCE,
  defaultTimeframe: Timeframe.H1,
  defaultChartCount: 4,
  notifications: { sound: true, desktop: true, telegram: false },
  chart: {
    candleStyle: 'candles',
    showVolume: true,
    showLiquidity: true,
    showPatterns: true,
    showOverlays: true,
  },
  layout: 'grid',
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(username: string, email: string, password: string) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      if (existing.email === email) {
        throw new ConflictException('Email already registered');
      }
      throw new ConflictException('Username already taken');
    }

    const passwordHash = await bcrypt.hash(password, this.saltRounds);

    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        settings: DEFAULT_SETTINGS as any,
      },
      select: { id: true, username: true, email: true, avatar: true, settings: true, createdAt: true },
    });

    const token = this.generateToken(user.id, user.username, user.email);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { user, token };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, username: true, email: true, passwordHash: true, avatar: true, settings: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.username, user.email);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const { passwordHash, ...safeUser } = user;
    return { user: safeUser, token };
  }

  async telegramAuth(initData: string) {
    const telegramUser = TelegramGuard.parseInitData(initData);
    if (!telegramUser?.id) {
      throw new UnauthorizedException('Invalid Telegram data');
    }

    let user = await this.prisma.user.findUnique({
      where: { telegramId: telegramUser.id },
      select: { id: true, username: true, email: true, avatar: true, settings: true, telegramId: true },
    });

    if (!user) {
      const username = `tg_${telegramUser.username || telegramUser.id}`;
      const email = `tg_${telegramUser.id}@telegram.placeholder`;

      try {
        user = await this.prisma.user.create({
          data: {
            username,
            email,
            passwordHash: await bcrypt.hash(crypto.randomUUID(), this.saltRounds),
            telegramId: telegramUser.id,
            avatar: telegramUser.photo_url,
            settings: DEFAULT_SETTINGS as any,
          },
          select: { id: true, username: true, email: true, avatar: true, settings: true, telegramId: true },
        });
      } catch {
        user = await this.prisma.user.findFirst({
          where: { OR: [{ telegramId: telegramUser.id }, { username }] },
          select: { id: true, username: true, email: true, avatar: true, settings: true, telegramId: true },
        });

        if (!user) {
          throw new UnauthorizedException('Failed to create or find user');
        }
      }
    }

    const token = this.generateToken(user.id, user.username, user.email);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { user, token };
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, avatar: true, telegramId: true, settings: true, createdAt: true },
    });
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwt.verify(token);
      const session = await this.prisma.session.findUnique({ where: { token } });
      if (!session || session.expiresAt < new Date()) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  private generateToken(userId: string, username: string, email: string): string {
    return this.jwt.sign({
      sub: userId,
      username,
      email,
    });
  }
}
