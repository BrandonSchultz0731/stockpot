import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { DEFAULT_NOTIFICATION_PREFS, SubscriptionTier } from '@shared/enums';

function normalizeEmail(email: string): string {
  const [local, domain] = email.toLowerCase().split('@');
  const stripped = local.split('+')[0];
  return `${stripped}@${domain}`;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(UserSession)
    private readonly sessionsRepo: Repository<UserSession>,
  ) { }

  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
  }): Promise<User> {
    const email = normalizeEmail(data.email);
    const existing = await this.usersRepo.findOne({
      where: { email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = this.usersRepo.create({
      email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      emailVerified: false,
      notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
    });
    return this.usersRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email: normalizeEmail(email) } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async validatePassword(
    plaintext: string,
    hash: string | null,
  ): Promise<boolean> {
    if (!hash) return false;
    return bcrypt.compare(plaintext, hash);
  }

  async findByProviderUserId(
    provider: string,
    providerUserId: string,
  ): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { authProvider: provider, providerUserId },
    });
  }

  async createSocialUser(data: {
    email: string;
    firstName: string;
    lastName?: string;
    avatarUrl?: string;
    authProvider: string;
    providerUserId: string;
  }): Promise<User> {
    const user = this.usersRepo.create({
      email: normalizeEmail(data.email),
      passwordHash: null,
      firstName: data.firstName,
      lastName: data.lastName,
      avatarUrl: data.avatarUrl,
      authProvider: data.authProvider,
      providerUserId: data.providerUserId,
      notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS },
    });
    return this.usersRepo.save(user);
  }

  async createSession(data: {
    userId: string;
    refreshToken: string;
    expiresAt: Date;
    deviceInfo?: Record<string, any>;
  }): Promise<UserSession> {
    const session = this.sessionsRepo.create({
      userId: data.userId,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
      deviceInfo: data.deviceInfo,
    });
    return this.sessionsRepo.save(session);
  }

  async findSessionById(id: string): Promise<UserSession | null> {
    return this.sessionsRepo.findOne({ where: { id } });
  }

  async updateSessionToken(
    sessionId: string,
    hashedToken: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.sessionsRepo.update(sessionId, {
      refreshToken: hashedToken,
      expiresAt,
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.sessionsRepo.delete(sessionId);
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    await this.sessionsRepo.delete({ userId });
  }

  async getProfile(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { passwordHash, ...profile } = user;
    return profile;
  }

  async completeOnboarding(userId: string, dto: CompleteOnboardingDto) {
    await this.usersRepo.update(userId, {
      dietaryProfile: dto.dietaryProfile,
      nutritionalGoals: dto.nutritionalGoals,
      onboardingComplete: true,
    });
    return { success: true };
  }

  async deleteAccount(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.sessionsRepo.delete({ userId });
    await this.usersRepo.delete(userId);
    return { success: true, appleRefreshToken: user.appleRefreshToken };
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.usersRepo.update(userId, { emailVerified: true });
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.usersRepo.update(userId, { passwordHash });
  }

  async storeAppleRefreshToken(userId: string, token: string): Promise<void> {
    await this.usersRepo.update(userId, { appleRefreshToken: token });
  }

  async updateSubscriptionTier(userId: string, tier: SubscriptionTier): Promise<void> {
    await this.usersRepo.update(userId, { subscriptionTier: tier });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const update: Record<string, any> = {};
    if (dto.dietaryProfile) {
      update.dietaryProfile = dto.dietaryProfile;
    }
    if (dto.nutritionalGoals) {
      update.nutritionalGoals = dto.nutritionalGoals;
    }
    await this.usersRepo.update(userId, update);
    return this.getProfile(userId);
  }
}
