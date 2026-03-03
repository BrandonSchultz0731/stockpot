import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { MealPlan } from './meal-plan.entity';
import { Recipe } from '../../recipes/entities/recipe.entity';
import { MealType } from '@shared/enums';

@Entity('meal_plan_entries')
@Index(['mealPlanId', 'dayOfWeek'])
export class MealPlanEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'meal_plan_id' })
  mealPlanId: string;

  @Column({ type: 'uuid', name: 'recipe_id' })
  recipeId: string;

  @Column({ type: 'int', name: 'day_of_week' })
  dayOfWeek: number;

  @Column({ type: 'varchar', length: 20, name: 'meal_type' })
  mealType: MealType;

  @Column({ type: 'int', default: 1 })
  servings: number;

  @Column({ type: 'int', name: 'servings_to_cook', nullable: true })
  servingsToCook: number | null;

  @Column({ type: 'uuid', name: 'leftover_source_entry_id', nullable: true })
  leftoverSourceEntryId: string | null;

  @Column({ type: 'boolean', name: 'is_locked', default: false })
  isLocked: boolean;

  @Column({ type: 'boolean', name: 'is_cooked', default: false })
  isCooked: boolean;

  @ManyToOne(() => MealPlan, (mp) => mp.entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meal_plan_id' })
  mealPlan: MealPlan;

  @ManyToOne(() => Recipe, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;

  @ManyToOne(() => MealPlanEntry, (e) => e.leftoverEntries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leftover_source_entry_id' })
  leftoverSourceEntry: MealPlanEntry;

  @OneToMany(() => MealPlanEntry, (e) => e.leftoverSourceEntry)
  leftoverEntries: MealPlanEntry[];
}
