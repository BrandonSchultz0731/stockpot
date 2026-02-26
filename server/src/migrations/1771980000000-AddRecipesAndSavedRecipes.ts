import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecipesAndSavedRecipes1771980000000
  implements MigrationInterface
{
  name = 'AddRecipesAndSavedRecipes1771980000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "recipes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "title" character varying(500) NOT NULL,
        "description" text,
        "prep_time_minutes" integer,
        "cook_time_minutes" integer,
        "total_time_minutes" integer,
        "servings" integer,
        "difficulty" character varying(20),
        "cuisine" character varying(100),
        "meal_type" character varying(20),
        "source" character varying(20) NOT NULL DEFAULT 'ai',
        "image_url" text,
        "ingredients" jsonb NOT NULL,
        "steps" jsonb NOT NULL,
        "tags" jsonb,
        "dietary_flags" jsonb,
        "nutrition" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_recipes" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_recipes_user_id" ON "recipes" ("user_id")`,
    );

    await queryRunner.query(`
      ALTER TABLE "recipes"
        ADD CONSTRAINT "FK_recipes_user_id"
        FOREIGN KEY ("user_id") REFERENCES "users"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "saved_recipes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "recipe_id" uuid NOT NULL,
        "is_favorite" boolean NOT NULL DEFAULT false,
        "rating" integer,
        "custom_servings" integer,
        "notes" text,
        "saved_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_saved_recipes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_saved_recipes_user_recipe" UNIQUE ("user_id", "recipe_id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_saved_recipes_user_id" ON "saved_recipes" ("user_id")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_saved_recipes_recipe_id" ON "saved_recipes" ("recipe_id")`,
    );

    await queryRunner.query(`
      ALTER TABLE "saved_recipes"
        ADD CONSTRAINT "FK_saved_recipes_user_id"
        FOREIGN KEY ("user_id") REFERENCES "users"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "saved_recipes"
        ADD CONSTRAINT "FK_saved_recipes_recipe_id"
        FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "saved_recipes" DROP CONSTRAINT "FK_saved_recipes_recipe_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_recipes" DROP CONSTRAINT "FK_saved_recipes_user_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_saved_recipes_recipe_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_saved_recipes_user_id"`);
    await queryRunner.query(`DROP TABLE "saved_recipes"`);

    await queryRunner.query(
      `ALTER TABLE "recipes" DROP CONSTRAINT "FK_recipes_user_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_recipes_user_id"`);
    await queryRunner.query(`DROP TABLE "recipes"`);
  }
}
