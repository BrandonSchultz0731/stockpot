import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MessageType } from '@shared/enums';

@Entity('usage_tracking')
@Unique(['userId', 'periodStart'])
export class UsageTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'date', name: 'period_start' })
  periodStart: string;

  @Column({ type: 'jsonb', name: 'feature_counts', default: () => "'{}'" })
  featureCounts: Partial<Record<MessageType, number>>;

  @Column({ type: 'int', name: 'total_input_tokens', default: 0 })
  totalInputTokens: number;

  @Column({ type: 'int', name: 'total_output_tokens', default: 0 })
  totalOutputTokens: number;

  @Column({ type: 'int', name: 'estimated_cost_cents', default: 0 })
  estimatedCostCents: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
