import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShoppingLists1772100000000 implements MigrationInterface {
  name = 'AddShoppingLists1772100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "shopping_lists" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "meal_plan_id" uuid NOT NULL,
        "items" jsonb NOT NULL DEFAULT '[]',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_shopping_lists" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_shopping_lists_meal_plan_id" UNIQUE ("meal_plan_id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_shopping_lists_user_id" ON "shopping_lists" ("user_id")`,
    );

    await queryRunner.query(`
      ALTER TABLE "shopping_lists"
        ADD CONSTRAINT "FK_shopping_lists_user_id"
        FOREIGN KEY ("user_id") REFERENCES "users"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "shopping_lists"
        ADD CONSTRAINT "FK_shopping_lists_meal_plan_id"
        FOREIGN KEY ("meal_plan_id") REFERENCES "meal_plans"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "shopping_lists" DROP CONSTRAINT "FK_shopping_lists_meal_plan_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shopping_lists" DROP CONSTRAINT "FK_shopping_lists_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_shopping_lists_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "shopping_lists"`);
  }
}
