import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1622299665807 implements MigrationInterface {
  name = 'createUsersTable1622299665807';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE TYPE \"users_role_enum\" AS ENUM('USER', 'ADMIN')",
    );
    await queryRunner.query(`
      CREATE TABLE "users"
      (
        "id"         uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP         NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP         NOT NULL DEFAULT now(),
        "first_name" character varying,
        "last_name"  character varying,
        "nick_name"  character varying,
        "role"       "users_role_enum" NOT NULL DEFAULT 'USER',
        "email"      character varying,
        "password"   character varying,
        "phone"      character varying,
        "avatar"     character varying,
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "UQ_3o7izc6tfo92ou74sgcz9mgr7v0" UNIQUE ("nick_name"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(`
      CREATE TABLE "email_verification"
      (
        "id"         uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP         NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP         NOT NULL DEFAULT now(),
        "email"      character varying,
        "token"      character varying,
        "timestamp"  TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_t0ozuvek9sd0pl2srl1mx57sgb5" UNIQUE ("email"),
        CONSTRAINT "PK_vgqquj0ko66okllljf4fi6zo2k1" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(`
      CREATE TABLE "reset_password"
      (
        "id"         uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP         NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP         NOT NULL DEFAULT now(),
        "email"      character varying,
        "token"      character varying,
        "timestamp"  TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_kkmfcxtxtdyd530ydy9d6kdatyw" UNIQUE ("email"),
        CONSTRAINT "PK_s0q4sb1i8gmm5msqe66rvvra9pc" PRIMARY KEY ("id")
      )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "users"');
    await queryRunner.query('DROP TABLE "email_verify"');
    await queryRunner.query('DROP TABLE "reset_password"');
    await queryRunner.query('DROP TYPE "users_role_enum"');
  }
}
