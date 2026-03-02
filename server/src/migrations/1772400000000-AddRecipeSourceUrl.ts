import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecipeSourceUrl1772400000000 implements MigrationInterface {
  name = 'AddRecipeSourceUrl1772400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "recipes"
        ADD COLUMN "source_url" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "recipes"
        DROP COLUMN "source_url"
    `);
  }
}
