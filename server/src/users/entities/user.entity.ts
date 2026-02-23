import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserSession } from './user-session.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name', nullable: true })
  lastName: string;

  @Column({ type: 'text', name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  timezone: string;

  @Column({
    type: 'boolean',
    name: 'onboarding_complete',
    default: false,
  })
  onboardingComplete: boolean;

  @Column({ type: 'jsonb', name: 'dietary_profile', nullable: true })
  dietaryProfile: Record<string, any>;

  @Column({ type: 'jsonb', name: 'nutritional_goals', nullable: true })
  nutritionalGoals: Record<string, any>;

  @Column({ type: 'jsonb', name: 'notification_prefs', nullable: true })
  notificationPrefs: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => UserSession, (session) => session.user)
  sessions: UserSession[];
}
