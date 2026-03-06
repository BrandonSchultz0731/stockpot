import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import { UsersService } from '../users/users.service';
import { AppleAuthService } from './apple-auth.service';
import { AppleAuthDto, GoogleAuthDto } from './dto/social-auth.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly appleAuthService: AppleAuthService,
  ) { }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
  }): Promise<TokenPair> {
    const user = await this.usersService.createUser(data);
    return this.issueTokenPair(user.id, user.email);
  }

  async login(email: string, password: string): Promise<TokenPair> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.authProvider !== 'email') {
      const providerLabel = user.authProvider === 'apple' ? 'Apple' : 'Google';
      throw new ConflictException(
        `An account with this email already exists. Please log in with ${providerLabel}.`,
      );
    }

    const valid = await this.usersService.validatePassword(
      password,
      user.passwordHash,
    );
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokenPair(user.id, user.email);
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

    return this.issueTokenPair(user.id, user.email);
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

  async appleAuth(dto: AppleAuthDto): Promise<TokenPair> {
    const { sub, email } = await this.verifyAppleToken(dto.identityToken);
    const tokenPair = await this.socialAuth({
      provider: 'apple',
      providerUserId: sub,
      email,
      firstName: dto.firstName || email.split('@')[0],
      lastName: dto.lastName,
    });

    // Exchange authorization code for Apple refresh token (best-effort)
    if (dto.authorizationCode) {
      try {
        const appleRefreshToken = await this.appleAuthService.exchangeCode(dto.authorizationCode);
        const user = await this.usersService.findByProviderUserId('apple', sub);
        if (user && appleRefreshToken) {
          await this.usersService.storeAppleRefreshToken(user.id, appleRefreshToken);
        }
      } catch {
        // Non-fatal — user can still use the app
      }
    }

    return tokenPair;
  }

  async googleAuth(dto: GoogleAuthDto): Promise<TokenPair> {
    const { sub, email, firstName, lastName, picture } =
      await this.verifyGoogleToken(dto.idToken);
    return this.socialAuth({
      provider: 'google',
      providerUserId: sub,
      email,
      firstName: firstName || email.split('@')[0],
      lastName,
      avatarUrl: picture,
    });
  }

  private async socialAuth(params: {
    provider: string;
    providerUserId: string;
    email: string;
    firstName: string;
    lastName?: string;
    avatarUrl?: string;
  }): Promise<TokenPair> {
    // 1. Look up by provider + providerUserId (returning social user)
    const existingSocial = await this.usersService.findByProviderUserId(
      params.provider,
      params.providerUserId,
    );
    if (existingSocial) {
      return this.issueTokenPair(existingSocial.id, existingSocial.email);
    }

    // 2. Look up by email — existing account with different provider
    const existingEmail = await this.usersService.findByEmail(params.email);
    if (existingEmail) {
      const providerLabel =
        existingEmail.authProvider === 'email'
          ? 'email and password'
          : existingEmail.authProvider === 'apple'
            ? 'Apple'
            : 'Google';
      throw new ConflictException(
        `An account with this email already exists. Please log in with ${providerLabel}.`,
      );
    }

    // 3. No match — create new social user
    const user = await this.usersService.createSocialUser({
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      avatarUrl: params.avatarUrl,
      authProvider: params.provider,
      providerUserId: params.providerUserId,
    });

    return this.issueTokenPair(user.id, user.email);
  }

  private async verifyAppleToken(
    identityToken: string,
  ): Promise<{ sub: string; email: string }> {
    const client = new JwksClient({
      jwksUri: 'https://appleid.apple.com/auth/keys',
      cache: true,
    });

    const decoded = jwt.decode(identityToken, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      throw new UnauthorizedException('Invalid Apple identity token');
    }

    const kid = decoded.header.kid;
    const key = await client.getSigningKey(kid);
    const publicKey = key.getPublicKey();

    const payload = jwt.verify(identityToken, publicKey, {
      algorithms: ['RS256'],
      issuer: 'https://appleid.apple.com',
      audience: this.configService.get<string>('APPLE_CLIENT_ID'),
    }) as jwt.JwtPayload;

    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Apple token missing required claims');
    }

    return { sub: payload.sub, email: payload.email as string };
  }

  private async verifyGoogleToken(
    idToken: string,
  ): Promise<{
    sub: string;
    email: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
  }> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const client = new OAuth2Client(clientId);

    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google ID token');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      picture: payload.picture,
    };
  }

  private async issueTokenPair(
    userId: string,
    email: string,
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
