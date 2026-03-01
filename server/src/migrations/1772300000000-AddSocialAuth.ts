import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSocialAuth1772300000000 implements MigrationInterface {
  name = 'AddSocialAuth1772300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "auth_provider" varchar(20) NOT NULL DEFAULT 'email'
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "provider_user_id" varchar(255)
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "password_hash" DROP NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_provider_provider_user_id"
        ON "users" ("auth_provider", "provider_user_id")
        WHERE "provider_user_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_users_provider_provider_user_id"`,
    );

    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "password_hash" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN "provider_user_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN "auth_provider"
    `);
  }
}
