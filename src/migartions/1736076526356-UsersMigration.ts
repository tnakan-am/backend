import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class UsersMigration1736076526356 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        // Create custom enum type
        await queryRunner.query(`
            CREATE TYPE user_type_enum AS ENUM ('buyer', 'seller', 'admin');
        `);

        // Create users table
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
                        isUnique: true,
                    },
                    {
                        name: "phone",
                        type: "varchar",
                    },
                    {
                        name: "type",
                        type: "user_type_enum",
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
                    },
                ],
            }),
            true,
        );

        // Create indexes
        await queryRunner.createIndex(
            "users",
            new TableIndex({
                name: "IDX_USERS_NAME",
                columnNames: ["name"],
            }),
        );

        await queryRunner.createIndex(
            "users",
            new TableIndex({
                name: "IDX_USERS_EMAIL",
                columnNames: ["email"],
                isUnique: true,
            }),
        );

        // Create trigger for updated_at
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';

            CREATE TRIGGER update_users_updated_at
                BEFORE UPDATE ON users
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        // Drop trigger first
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS update_users_updated_at ON users;
            DROP FUNCTION IF EXISTS update_updated_at_column();
        `);

        // Drop table
        await queryRunner.dropTable("users");

        // Drop enum type
        await queryRunner.query(`
            DROP TYPE IF EXISTS user_type_enum;
        `);
    }
}
