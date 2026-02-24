import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: { onboardingComplete: boolean };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
  }): Promise<TokenPair> {
    const user = await this.usersService.createUser(data);
    return this.issueTokenPair(user.id, user.email, false);
  }

  async login(email: string, password: string): Promise<TokenPair> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.usersService.validatePassword(
      password,
      user.passwordHash,
    );
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokenPair(user.id, user.email, user.onboardingComplete);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const session = await this.usersService.findSessionById(payload.jti);
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    // Compare token hash to detect reuse
    const tokenValid = await bcrypt.compare(
      refreshToken,
      session.refreshToken,
    );
    if (!tokenValid) {
      // Possible token reuse attack — revoke all sessions for this user
      await this.usersService.deleteAllUserSessions(session.userId);
      throw new ForbiddenException(
        'Refresh token reuse detected. All sessions revoked.',
      );
    }

    // Delete old session
    await this.usersService.deleteSession(session.id);

    // Issue new token pair
    const user = await this.usersService.findById(session.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.issueTokenPair(user.id, user.email, user.onboardingComplete);
  }

  async logout(refreshToken: string): Promise<void> {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      // Token expired or invalid — still attempt cleanup
      return;
    }

    if (payload.jti) {
      await this.usersService.deleteSession(payload.jti);
    }
  }

  private async issueTokenPair(
    userId: string,
    email: string,
    onboardingComplete: boolean,
  ): Promise<TokenPair> {
    const accessExpiry = this.configService.get<string>('JWT_ACCESS_EXPIRY');
    const refreshExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRY');

    // Create session row first (generates UUID)
    const expiresAt = this.calculateExpiry(refreshExpiry);
    const session = await this.usersService.createSession({
      userId,
      refreshToken: 'pending', // placeholder until we hash the real token
      expiresAt,
    });

    // Sign tokens
    const accessToken = this.jwtService.sign(
      { sub: userId, email },
      { expiresIn: accessExpiry as any },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, type: 'refresh', jti: session.id },
      { expiresIn: refreshExpiry as any },
    );

    // Hash refresh token and store it
    const hashedRefresh = await bcrypt.hash(refreshToken, 12);
    await this.usersService.updateSessionToken(
      session.id,
      hashedRefresh,
      expiresAt,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiry,
      user: { onboardingComplete },
    };
  }

  private calculateExpiry(duration: string): Date {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // default 7 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const ms = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    }[unit];

    return new Date(Date.now() + value * ms);
  }
}
