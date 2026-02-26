import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMealPlansAndEntries1772000000000
  implements MigrationInterface
{
  name = 'AddMealPlansAndEntries1772000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "meal_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "week_start_date" date NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'draft',
        "source" character varying(20) NOT NULL DEFAULT 'ai',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_meal_plans" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_meal_plans_user_week" UNIQUE ("user_id", "week_start_date")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_meal_plans_user_id" ON "meal_plans" ("user_id")`,
    );

    await queryRunner.query(`
      ALTER TABLE "meal_plans"
        ADD CONSTRAINT "FK_meal_plans_user_id"
        FOREIGN KEY ("user_id") REFERENCES "users"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "meal_plan_entries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "meal_plan_id" uuid NOT NULL,
        "recipe_id" uuid NOT NULL,
        "day_of_week" integer NOT NULL,
        "meal_type" character varying(20) NOT NULL,
        "servings" integer NOT NULL DEFAULT 1,
        "is_locked" boolean NOT NULL DEFAULT false,
        "is_cooked" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_meal_plan_entries" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_meal_plan_entries_plan_day" ON "meal_plan_entries" ("meal_plan_id", "day_of_week")`,
    );

    await queryRunner.query(`
      ALTER TABLE "meal_plan_entries"
        ADD CONSTRAINT "FK_meal_plan_entries_meal_plan_id"
        FOREIGN KEY ("meal_plan_id") REFERENCES "meal_plans"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "meal_plan_entries"
        ADD CONSTRAINT "FK_meal_plan_entries_recipe_id"
        FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "meal_plan_entries" DROP CONSTRAINT "FK_meal_plan_entries_recipe_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_plan_entries" DROP CONSTRAINT "FK_meal_plan_entries_meal_plan_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_meal_plan_entries_plan_day"`,
    );
    await queryRunner.query(`DROP TABLE "meal_plan_entries"`);

    await queryRunner.query(
      `ALTER TABLE "meal_plans" DROP CONSTRAINT "FK_meal_plans_user_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_meal_plans_user_id"`);
    await queryRunner.query(`DROP TABLE "meal_plans"`);
  }
}
