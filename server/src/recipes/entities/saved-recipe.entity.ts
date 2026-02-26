import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Recipe } from './recipe.entity';

@Entity('saved_recipes')
@Unique(['userId', 'recipeId'])
export class SavedRecipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Index()
  @Column({ type: 'uuid', name: 'recipe_id' })
  recipeId: string;

  @Column({ type: 'boolean', name: 'is_favorite', default: false })
  isFavorite: boolean;

  @Column({ type: 'int', nullable: true })
  rating: number;

  @Column({ type: 'int', name: 'custom_servings', nullable: true })
  customServings: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'saved_at' })
  savedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Recipe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;
}
