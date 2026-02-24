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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(UserSession)
    private readonly sessionsRepo: Repository<UserSession>,
  ) {}

  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
  }): Promise<User> {
    const existing = await this.usersRepo.findOne({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = this.usersRepo.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    });
    return this.usersRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async validatePassword(plaintext: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
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
}
