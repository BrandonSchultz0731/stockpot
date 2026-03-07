import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import { UsersService } from '../users/users.service';
import { AppleAuthService } from './apple-auth.service';
import { EmailService } from './email.service';
import { AppleAuthDto, GoogleAuthDto } from './dto/social-auth.dto';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';

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
    private readonly emailService: EmailService,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokenRepo: Repository<PasswordResetToken>,
    @InjectRepository(EmailVerificationToken)
    private readonly verificationTokenRepo: Repository<EmailVerificationToken>,
  ) { }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
  }): Promise<TokenPair> {
    const user = await this.usersService.createUser(data);
    await this.sendVerificationCode(user.id, user.email, user.firstName);
    return this.issueTokenPair(user.id, user.email);
  }

  async login(email: string, password: string): Promise<TokenPair> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.authProvider !== 'email') {
      const providerLabel = user.authProvider.charAt(0).toUpperCase() + user.authProvider.slice(1);
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
          : existingEmail.authProvider.charAt(0).toUpperCase() + existingEmail.authProvider.slice(1);
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

  async verifyEmail(userId: string, code: string): Promise<void> {
    const candidates = await this.verificationTokenRepo.find({
      where: { userId, used: false },
      order: { createdAt: 'DESC' },
    });

    const now = new Date();
    let matchedToken: EmailVerificationToken | null = null;

    for (const candidate of candidates) {
      if (candidate.expiresAt < now) continue;
      const isMatch = await bcrypt.compare(code, candidate.tokenHash);
      if (isMatch) {
        matchedToken = candidate;
        break;
      }
    }

    if (!matchedToken) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    await this.verificationTokenRepo.update(matchedToken.id, { used: true });
    await this.usersService.markEmailVerified(userId);
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }
    await this.sendVerificationCode(user.id, user.email, user.firstName);
  }

  private async sendVerificationCode(
    userId: string,
    email: string,
    firstName: string,
  ): Promise<void> {
    // Invalidate existing unused tokens
    await this.verificationTokenRepo.update(
      { userId, used: false },
      { used: true },
    );

    const code = crypto.randomInt(100000, 999999).toString();
    const tokenHash = await bcrypt.hash(code, 12);

    await this.verificationTokenRepo.save({
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    await this.emailService.sendEmailVerificationEmail(email, firstName, code);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    // Always return success to prevent email enumeration
    if (!user) return;

    if (user.authProvider !== 'email') {
      const providerLabel = user.authProvider.charAt(0).toUpperCase() + user.authProvider.slice(1);
      await this.emailService.sendSocialProviderReminder(
        user.email,
        user.firstName,
        providerLabel,
      );
      return;
    }

    // Invalidate any existing unused tokens for this user
    await this.resetTokenRepo.update(
      { userId: user.id, used: false },
      { used: true },
    );

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const tokenHash = await bcrypt.hash(code, 12);

    await this.resetTokenRepo.save({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });

    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.firstName,
      code,
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find all unexpired, unused tokens (ordered newest first)
    const candidates = await this.resetTokenRepo.find({
      where: { used: false },
      order: { createdAt: 'DESC' },
    });

    const now = new Date();
    let matchedToken: PasswordResetToken | null = null;

    for (const candidate of candidates) {
      if (candidate.expiresAt < now) continue;
      const isMatch = await bcrypt.compare(token, candidate.tokenHash);
      if (isMatch) {
        matchedToken = candidate;
        break;
      }
    }

    if (!matchedToken) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.usersService.updatePasswordHash(matchedToken.userId, passwordHash);

    // Mark token as used
    await this.resetTokenRepo.update(matchedToken.id, { used: true });

    // Revoke all sessions so user must log in with new password
    await this.usersService.deleteAllUserSessions(matchedToken.userId);
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
