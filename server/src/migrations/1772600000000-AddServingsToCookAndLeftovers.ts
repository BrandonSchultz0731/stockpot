import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServingsToCookAndLeftovers1772600000000
  implements MigrationInterface
{
  name = 'AddServingsToCookAndLeftovers1772600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "meal_plan_entries"
        ADD COLUMN "servings_to_cook" integer,
        ADD COLUMN "leftover_source_entry_id" uuid
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_meal_plan_entries_leftover_source" ON "meal_plan_entries" ("leftover_source_entry_id")`,
    );

    await queryRunner.query(`
      ALTER TABLE "meal_plan_entries"
        ADD CONSTRAINT "FK_meal_plan_entries_leftover_source"
        FOREIGN KEY ("leftover_source_entry_id") REFERENCES "meal_plan_entries"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "meal_plan_entries" DROP CONSTRAINT "FK_meal_plan_entries_leftover_source"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_meal_plan_entries_leftover_source"`,
    );
    await queryRunner.query(`
      ALTER TABLE "meal_plan_entries"
        DROP COLUMN "leftover_source_entry_id",
        DROP COLUMN "servings_to_cook"
    `);
  }
}
