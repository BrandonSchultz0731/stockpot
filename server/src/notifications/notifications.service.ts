import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull, Not } from 'typeorm';
import * as admin from 'firebase-admin';
import { User } from '../users/entities/user.entity';
import { UserSession } from '../users/entities/user-session.entity';
import { RegisterTokenDto } from './dto/register-token.dto';
import { UpdateNotificationPrefsDto } from './dto/update-notification-prefs.dto';
import type { NotificationPrefs } from '@shared/enums';
import { DEFAULT_NOTIFICATION_PREFS } from '@shared/enums';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseInitialized = false;

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(UserSession)
    private readonly sessionsRepo: Repository<UserSession>,
    private readonly configService: ConfigService,
  ) {
    this.initFirebase();
  }

  private initFirebase() {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase credentials not configured — push notifications disabled',
      );
      return;
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    }
    this.firebaseInitialized = true;
    this.logger.log('Firebase Admin initialized');
  }

  async registerPushToken(
    userId: string,
    dto: RegisterTokenDto,
  ): Promise<{ success: boolean }> {
    await this.sessionsRepo.update(
      { userId, expiresAt: MoreThan(new Date()) },
      { pushToken: dto.pushToken, pushPlatform: dto.pushPlatform },
    );
    return { success: true };
  }

  async updatePreferences(
    userId: string,
    dto: UpdateNotificationPrefsDto,
  ): Promise<NotificationPrefs> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    const current = {
      ...DEFAULT_NOTIFICATION_PREFS,
      ...(user?.notificationPrefs as Partial<NotificationPrefs>),
    };
    const updated = { ...current, ...dto };
    await this.usersRepo
      .createQueryBuilder()
      .update(User)
      .set({ notificationPrefs: () => `:prefs` })
      .setParameter('prefs', JSON.stringify(updated))
      .where('id = :id', { id: userId })
      .execute();
    return updated;
  }

  async getTokensForUser(userId: string): Promise<string[]> {
    const sessions = await this.sessionsRepo.find({
      where: {
        userId,
        expiresAt: MoreThan(new Date()),
        pushToken: Not(IsNull()),
      },
      select: ['pushToken'],
    });
    const unique = [...new Set(sessions.map((s) => s.pushToken))];
    return unique;
  }

  async getUsersWithTokens(): Promise<string[]> {
    const sessions = await this.sessionsRepo
      .createQueryBuilder('s')
      .select('DISTINCT s.user_id', 'userId')
      .where('s.push_token IS NOT NULL')
      .andWhere('s.expires_at > NOW()')
      .getRawMany<{ userId: string }>();
    return sessions.map((s) => s.userId);
  }

  async sendPush(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.firebaseInitialized) {
      this.logger.warn('Firebase not initialized — skipping push send');
      return;
    }

    try {
      await admin.messaging().send({
        token,
        notification: { title, body },
        data,
      });
    } catch (error: unknown) {
      const code =
        error instanceof Error && 'code' in error
          ? (error as { code: string }).code
          : undefined;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        this.logger.warn(`Stale FCM token, cleaning up: ${token.slice(0, 10)}...`);
        await this.sessionsRepo.update(
          { pushToken: token },
          { pushToken: undefined },
        );
      } else {
        this.logger.error('Failed to send push notification', error);
      }
    }
  }
}
