import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRole1773100000000 implements MigrationInterface {
  name = 'AddUserRole1773100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "role" varchar(20) NOT NULL DEFAULT 'customer'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN "role"
    `);
  }
}
