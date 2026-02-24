import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { FoodCache } from '../../food-cache/entities/food-cache.entity';
import { UnitOfMeasure } from '@shared/enums';

@Entity('pantry_items')
export class PantryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'food_cache_id' })
  foodCacheId: string;

  @Column({ type: 'varchar', length: 255, name: 'display_name' })
  displayName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'varchar', length: 50 })
  unit: UnitOfMeasure;

  @Column({ type: 'varchar', length: 50, name: 'storage_location', nullable: true })
  storageLocation: string;

  @Column({ type: 'date', name: 'expiration_date', nullable: true })
  expirationDate: string;

  @Column({ type: 'boolean', name: 'expiry_is_estimated', default: true })
  expiryIsEstimated: boolean;

  @Column({ type: 'boolean', default: false })
  opened: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'added_at' })
  addedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => FoodCache)
  @JoinColumn({ name: 'food_cache_id' })
  foodCache: FoodCache;
}
