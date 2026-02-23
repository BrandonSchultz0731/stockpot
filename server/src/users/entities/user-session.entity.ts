import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 500, name: 'refresh_token' })
  refreshToken: string;

  @Column({ type: 'jsonb', name: 'device_info', nullable: true })
  deviceInfo: Record<string, any>;

  @Column({ type: 'text', name: 'push_token', nullable: true })
  pushToken: string;

  @Column({ type: 'varchar', length: 10, name: 'push_platform', nullable: true })
  pushPlatform: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
