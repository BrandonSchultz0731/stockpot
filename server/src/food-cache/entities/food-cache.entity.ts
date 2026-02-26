import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ShelfLife } from '@shared/enums';

@Entity('food_cache')
export class FoodCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', name: 'fdc_id', unique: true, nullable: true })
  fdcId: number;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 500, name: 'usda_description', nullable: true })
  usdaDescription: string;

  @Column({ type: 'varchar', length: 50, name: 'usda_data_type', nullable: true })
  usdaDataType: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'boolean', name: 'is_perishable', nullable: true })
  isPerishable: boolean;

  @Column({ type: 'jsonb', name: 'shelf_life', nullable: true })
  shelfLife: ShelfLife;

  @Column({ type: 'jsonb', name: 'nutrition_per_100g', nullable: true })
  nutritionPer100g: Record<string, number>;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  barcode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  brand: string;

  @Column({ type: 'text', name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  aliases: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
