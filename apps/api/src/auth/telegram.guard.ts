import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class TelegramGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const body = request.body;

    if (!body?.initData) {
      throw new BadRequestException('initData is required');
    }

    const isValid = this.validateTelegramInitData(body.initData);
    if (!isValid) {
      throw new UnauthorizedException('Invalid Telegram WebApp data');
    }

    return true;
  }

  private validateTelegramInitData(initData: string): boolean {
    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    }

    try {
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      if (!hash) return false;

      urlParams.delete('hash');
      urlParams.sort();

      const dataCheckString = urlParams.toString();
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      if (calculatedHash !== hash) return false;

      const authDate = parseInt(urlParams.get('authDate') || '0', 10);
      const maxAge = 86400; // 24 hours
      if (Date.now() / 1000 - authDate > maxAge) return false;

      return true;
    } catch {
      return false;
    }
  }

  static parseInitData(initData: string): {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    language_code?: string;
  } | null {
    try {
      const urlParams = new URLSearchParams(initData);
      const userStr = urlParams.get('user');
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
}
