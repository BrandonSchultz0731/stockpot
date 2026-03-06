import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AppleAuthService {
  constructor(private readonly configService: ConfigService) {}

  async exchangeCode(authorizationCode: string): Promise<string | null> {
    const clientSecret = this.generateClientSecret();
    const clientId = this.configService.get<string>('APPLE_CLIENT_ID');

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: authorizationCode,
      grant_type: 'authorization_code',
    });

    const response = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.refresh_token ?? null;
  }

  async revokeToken(appleRefreshToken: string | null): Promise<void> {
    if (!appleRefreshToken) return;
    try {
      const clientSecret = this.generateClientSecret();
      const clientId = this.configService.get<string>('APPLE_CLIENT_ID');

      const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        token: appleRefreshToken,
        token_type_hint: 'refresh_token',
      });

      await fetch('https://appleid.apple.com/auth/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
    } catch {
      // Best-effort — don't block account deletion
    }
  }

  private generateClientSecret(): string {
    const keyId = this.configService.get<string>('APPLE_KEY_ID');
    const teamId = this.configService.get<string>('APPLE_TEAM_ID');
    const clientId = this.configService.get<string>('APPLE_CLIENT_ID');
    const privateKey = this.configService
      .get<string>('APPLE_PRIVATE_KEY')
      .replace(/\\n/g, '\n');

    return jwt.sign({}, privateKey, {
      algorithm: 'ES256',
      expiresIn: '180d',
      audience: 'https://appleid.apple.com',
      issuer: teamId,
      subject: clientId,
      header: { alg: 'ES256', kid: keyId },
    });
  }
}
