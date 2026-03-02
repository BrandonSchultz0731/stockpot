import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateUsageTrackingToJsonb1772500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the new JSONB column
    await queryRunner.query(
      `ALTER TABLE "usage_tracking" ADD "feature_counts" jsonb NOT NULL DEFAULT '{}'`,
    );

    // Migrate existing counter data into feature_counts
    await queryRunner.query(`
      UPDATE "usage_tracking"
      SET "feature_counts" = jsonb_build_object(
        'receipt-scan', "receipt_scans",
        'meal-plan', "meal_plans_generated",
        'recipe-generation', "recipes_generated",
        'ai-chat', "ai_chat_messages"
      )
      WHERE "receipt_scans" > 0
         OR "meal_plans_generated" > 0
         OR "recipes_generated" > 0
         OR "ai_chat_messages" > 0
    `);

    // Drop old columns
    await queryRunner.query(
      `ALTER TABLE "usage_tracking" DROP COLUMN "receipt_scans"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usage_tracking" DROP COLUMN "meal_plans_generated"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usage_tracking" DROP COLUMN "recipes_generated"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usage_tracking" DROP COLUMN "ai_chat_messages"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usage_tracking" DROP COLUMN "substitution_requests"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add old columns
    await queryRunner.query(
      `ALTER TABLE "usage_tracking" ADD "receipt_scans" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "usage_tracking" ADD "meal_plans_generated" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "usage_tracking" ADD "recipes_generated" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "usage_tracking" ADD "ai_chat_messages" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "usage_tracking" ADD "substitution_requests" integer NOT NULL DEFAULT 0`,
    );

    // Migrate data back from feature_counts
    await queryRunner.query(`
      UPDATE "usage_tracking"
      SET
        "receipt_scans" = COALESCE(("feature_counts"->>'receipt-scan')::int, 0),
        "meal_plans_generated" = COALESCE(("feature_counts"->>'meal-plan')::int, 0),
        "recipes_generated" = COALESCE(("feature_counts"->>'recipe-generation')::int, 0),
        "ai_chat_messages" = COALESCE(("feature_counts"->>'ai-chat')::int, 0)
    `);

    // Drop the JSONB column
    await queryRunner.query(
      `ALTER TABLE "usage_tracking" DROP COLUMN "feature_counts"`,
    );
  }
}
