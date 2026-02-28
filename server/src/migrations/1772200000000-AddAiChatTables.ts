import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiChatTables1772200000000 implements MigrationInterface {
  name = 'AddAiChatTables1772200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "title" varchar(500),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversations" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_conversations_user_id" ON "conversations" ("user_id")`,
    );

    await queryRunner.query(`
      ALTER TABLE "conversations"
        ADD CONSTRAINT "FK_conversations_user_id"
        FOREIGN KEY ("user_id") REFERENCES "users"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "conversation_id" uuid NOT NULL,
        "role" varchar(20) NOT NULL,
        "content" text NOT NULL,
        "tool_calls" jsonb,
        "rich_blocks" jsonb,
        "token_count" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_messages" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_chat_messages_conversation_id" ON "chat_messages" ("conversation_id")`,
    );

    await queryRunner.query(`
      ALTER TABLE "chat_messages"
        ADD CONSTRAINT "FK_chat_messages_conversation_id"
        FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_chat_messages_conversation_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_chat_messages_conversation_id"`,
    );
    await queryRunner.query(`DROP TABLE "chat_messages"`);
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_conversations_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_conversations_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "conversations"`);
  }
}
