import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmojiToFoodCache1772700000000 implements MigrationInterface {
  name = 'AddEmojiToFoodCache1772700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "food_cache" ADD COLUMN "emoji" varchar(4)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "food_cache" DROP COLUMN "emoji"`,
    );
  }
}
