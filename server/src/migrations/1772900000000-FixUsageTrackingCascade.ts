import { MigrationInterface, QueryRunner } from "typeorm";

export class FixUsageTrackingCascade1772900000000 implements MigrationInterface {
    name = 'FixUsageTrackingCascade1772900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usage_tracking" DROP CONSTRAINT "FK_97e15b4afbc1ebaad4f12080878"`);
        await queryRunner.query(`ALTER TABLE "usage_tracking" ADD CONSTRAINT "FK_97e15b4afbc1ebaad4f12080878" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usage_tracking" DROP CONSTRAINT "FK_97e15b4afbc1ebaad4f12080878"`);
        await queryRunner.query(`ALTER TABLE "usage_tracking" ADD CONSTRAINT "FK_97e15b4afbc1ebaad4f12080878" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
