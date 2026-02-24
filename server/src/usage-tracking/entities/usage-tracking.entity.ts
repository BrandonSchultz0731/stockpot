import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('usage_tracking')
@Unique(['userId', 'periodStart'])
export class UsageTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'date', name: 'period_start' })
  periodStart: string;

  @Column({ type: 'int', name: 'receipt_scans', default: 0 })
  receiptScans: number;

  @Column({ type: 'int', name: 'meal_plans_generated', default: 0 })
  mealPlansGenerated: number;

  @Column({ type: 'int', name: 'recipes_generated', default: 0 })
  recipesGenerated: number;

  @Column({ type: 'int', name: 'ai_chat_messages', default: 0 })
  aiChatMessages: number;

  @Column({ type: 'int', name: 'substitution_requests', default: 0 })
  substitutionRequests: number;

  @Column({ type: 'int', name: 'total_input_tokens', default: 0 })
  totalInputTokens: number;

  @Column({ type: 'int', name: 'total_output_tokens', default: 0 })
  totalOutputTokens: number;

  @Column({ type: 'int', name: 'estimated_cost_cents', default: 0 })
  estimatedCostCents: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
