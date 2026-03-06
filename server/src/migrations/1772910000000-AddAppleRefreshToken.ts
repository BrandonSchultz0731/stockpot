import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAppleRefreshToken1772910000000 implements MigrationInterface {
    name = 'AddAppleRefreshToken1772910000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "apple_refresh_token" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "apple_refresh_token"`);
    }
}
