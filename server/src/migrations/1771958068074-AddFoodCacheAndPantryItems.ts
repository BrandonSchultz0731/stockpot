import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFoodCacheAndPantryItems1771958068074 implements MigrationInterface {
    name = 'AddFoodCacheAndPantryItems1771958068074'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "food_cache" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fdc_id" integer, "name" character varying(255) NOT NULL, "usda_description" character varying(500), "usda_data_type" character varying(50), "category" character varying(100), "is_perishable" boolean, "shelf_life" jsonb, "nutrition_per_100g" jsonb, "barcode" character varying(50), "brand" character varying(255), "image_url" text, "aliases" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a3c059a5418175b6b8edbc7c1fe" UNIQUE ("fdc_id"), CONSTRAINT "UQ_731f1c706d00d5d99a8d499e02f" UNIQUE ("barcode"), CONSTRAINT "PK_704ad882d96d24d713c3aad1996" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_097c5f2708e684b663c68059e3" ON "food_cache" ("name") `);
        await queryRunner.query(`CREATE TABLE "pantry_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "food_cache_id" uuid NOT NULL, "display_name" character varying(255) NOT NULL, "quantity" numeric(10,2) NOT NULL, "unit" character varying(50) NOT NULL, "storage_location" character varying(50), "expiration_date" date, "expiry_is_estimated" boolean NOT NULL DEFAULT true, "opened" boolean NOT NULL DEFAULT false, "notes" text, "added_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bb63c18ae1bc99152edd69c4a61" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ec53d8efe916b7c27605c88514" ON "pantry_items" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "pantry_items" ADD CONSTRAINT "FK_ec53d8efe916b7c27605c885148" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pantry_items" ADD CONSTRAINT "FK_ba0b7d852cc1763f693846f74ef" FOREIGN KEY ("food_cache_id") REFERENCES "food_cache"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pantry_items" DROP CONSTRAINT "FK_ba0b7d852cc1763f693846f74ef"`);
        await queryRunner.query(`ALTER TABLE "pantry_items" DROP CONSTRAINT "FK_ec53d8efe916b7c27605c885148"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ec53d8efe916b7c27605c88514"`);
        await queryRunner.query(`DROP TABLE "pantry_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_097c5f2708e684b663c68059e3"`);
        await queryRunner.query(`DROP TABLE "food_cache"`);
    }

}
