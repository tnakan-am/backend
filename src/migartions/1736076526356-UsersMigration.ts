import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class QuestionRefactoringTIMESTAMP implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
          new Table({
              name: "users",
              columns: [
                  {
                      name: "id",
                      type: "serial",
                      isPrimary: true,
                  },
                  {
                      name: "name",
                      type: "varchar",
                  },
                  {
                      name: "email",
                      type: "varchar",
                  },
                  {
                      name: "phone",
                      type: "int",
                  },
                  {
                      name: "type",
                      type: "enum",
                      enum: ["buyer", "seller", "admin"],
                  },
                  {
                      name: "verified_at",
                      type: "timestamp",
                      isNullable: true,
                  },
                  {
                      name: "created_at",
                      type: "timestamp",
                      default: "now()",
                  },
                  {
                      name: "updated_at",
                      type: "timestamp",
                      default: "now()",
                      onUpdate: "CURRENT_TIMESTAMP",
                  },
              ],
          }),
          true,

        );

        await queryRunner.createIndex(
          "users",
          new TableIndex({
              name: "IDX_USERS_NAME",
              columnNames: ["name"],
          }),
        );
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("users");
    }
}
