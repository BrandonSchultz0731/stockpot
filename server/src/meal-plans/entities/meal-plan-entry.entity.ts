import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MealPlan } from './meal-plan.entity';
import { Recipe } from '../../recipes/entities/recipe.entity';

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
  mealType: string;

  @Column({ type: 'int', default: 1 })
  servings: number;

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
}
