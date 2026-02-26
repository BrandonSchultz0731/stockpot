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
import type {
  RecipeIngredient,
  RecipeStep,
  RecipeNutrition,
} from '@shared/enums';
import { MealType } from '@shared/enums';

@Entity('recipes')
export class Recipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', name: 'prep_time_minutes', nullable: true })
  prepTimeMinutes: number;

  @Column({ type: 'int', name: 'cook_time_minutes', nullable: true })
  cookTimeMinutes: number;

  @Column({ type: 'int', name: 'total_time_minutes', nullable: true })
  totalTimeMinutes: number;

  @Column({ type: 'int', nullable: true })
  servings: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  difficulty: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cuisine: string;

  @Column({ type: 'varchar', length: 20, name: 'meal_type', nullable: true })
  mealType: MealType;

  @Column({ type: 'varchar', length: 20, default: 'ai' })
  source: string;

  @Column({ type: 'text', name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ type: 'jsonb' })
  ingredients: RecipeIngredient[];

  @Column({ type: 'jsonb' })
  steps: RecipeStep[];

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', name: 'dietary_flags', nullable: true })
  dietaryFlags: string[];

  @Column({ type: 'jsonb', nullable: true })
  nutrition: RecipeNutrition;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
