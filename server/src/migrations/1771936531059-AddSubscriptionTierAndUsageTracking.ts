import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubscriptionTierAndUsageTracking1771936531059 implements MigrationInterface {
    name = 'AddSubscriptionTierAndUsageTracking1771936531059'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "usage_tracking" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "period_start" date NOT NULL, "receipt_scans" integer NOT NULL DEFAULT '0', "meal_plans_generated" integer NOT NULL DEFAULT '0', "recipes_generated" integer NOT NULL DEFAULT '0', "ai_chat_messages" integer NOT NULL DEFAULT '0', "substitution_requests" integer NOT NULL DEFAULT '0', "total_input_tokens" integer NOT NULL DEFAULT '0', "total_output_tokens" integer NOT NULL DEFAULT '0', "estimated_cost_cents" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_ec14ec84401efaa2a467de48ad0" UNIQUE ("user_id", "period_start"), CONSTRAINT "PK_2879a43395bb513204f88769aa6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD "subscription_tier" character varying(20) NOT NULL DEFAULT 'Free'`);
        await queryRunner.query(`ALTER TABLE "usage_tracking" ADD CONSTRAINT "FK_97e15b4afbc1ebaad4f12080878" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usage_tracking" DROP CONSTRAINT "FK_97e15b4afbc1ebaad4f12080878"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "subscription_tier"`);
        await queryRunner.query(`DROP TABLE "usage_tracking"`);
    }

}
