import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillNotificationPrefs1772800000000
  implements MigrationInterface
{
  name = 'BackfillNotificationPrefs1772800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "users"
       SET "notification_prefs" = '{"expiringItems":true,"mealReminders":true,"mealPlanNudge":true,"mealReminderTime":"17:00"}'::jsonb
       WHERE "notification_prefs" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op: we can't distinguish which users had NULL before
  }
}
