import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1779437688397 implements MigrationInterface {
    name = 'InitSchema1779437688397'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // uuid_generate_v4() (used by the uuid primary keys below) lives in uuid-ossp.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TYPE "public"."users_type_enum" AS ENUM('customer', 'business', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "displayName" character varying NOT NULL, "phoneNumber" character varying, "type" "public"."users_type_enum" NOT NULL DEFAULT 'customer', "name" character varying, "surname" character varying, "company" character varying, "hvhh" character varying, "image" character varying, "address" jsonb, "isTopSeller" boolean NOT NULL DEFAULT false, "verified" boolean NOT NULL DEFAULT false, "verificationToken" character varying, "verifiedAt" TIMESTAMP, "passwordResetToken" character varying, "passwordResetExpiresAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_94e2000b5f7ee1f9c491f0f8a8" ON "users" ("type") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TYPE "public"."products_unit_enum" AS ENUM('kg', 'gram', 'liter', 'qnt')`);
        await queryRunner.query(`CREATE TYPE "public"."products_deliveryoption_enum" AS ENUM('Nearest', 'Next Day', 'After Next Day', 'On WeekEnd')`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "userDisplayName" character varying NOT NULL, "userPhoto" character varying, "name" character varying(255) NOT NULL, "unit" "public"."products_unit_enum" NOT NULL, "minQuantity" numeric(12,3) NOT NULL DEFAULT '0', "price" numeric(12,2) NOT NULL, "image" character varying NOT NULL, "description" text NOT NULL, "avgReview" numeric(3,2) NOT NULL DEFAULT '0', "numberReview" integer NOT NULL DEFAULT '0', "category" character varying(100) NOT NULL, "subCategory" character varying(120) NOT NULL, "productCategory" character varying(140), "availability" character varying(32) NOT NULL DEFAULT 'unlimited', "deliveryOption" "public"."products_deliveryoption_enum" NOT NULL, "approved" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_63fcb3d8806a6efd53dbc67430" ON "products" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_1efd59fd70f18d1f97d0247501" ON "products" ("avgReview") `);
        await queryRunner.query(`CREATE INDEX "IDX_62e458ba8467ba3c6246c47b93" ON "products" ("approved") `);
        await queryRunner.query(`CREATE INDEX "IDX_9e64a98845975f58aea17a22db" ON "products" ("productCategory") `);
        await queryRunner.query(`CREATE INDEX "IDX_cab13b3a21a939b139da80eaa9" ON "products" ("subCategory") `);
        await queryRunner.query(`CREATE INDEX "IDX_c3932231d2385ac248d0888d95" ON "products" ("category") `);
        await queryRunner.query(`CREATE INDEX "IDX_99d90c2a483d79f3b627fb1d5e" ON "products" ("userId") `);
        await queryRunner.query(`CREATE TABLE "product_categories" ("id" character varying(140) NOT NULL, "subCategoryId" character varying(120) NOT NULL, "name" character varying(100) NOT NULL, "description" text, "isActive" boolean NOT NULL DEFAULT true, "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7069dac60d88408eca56fdc9e0c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_07910e95f7b581a71ae41dda06" ON "product_categories" ("subCategoryId") `);
        await queryRunner.query(`CREATE TABLE "sub_categories" ("id" character varying(120) NOT NULL, "categoryId" character varying(100) NOT NULL, "name" character varying(100) NOT NULL, "description" text, "image" character varying, "isActive" boolean NOT NULL DEFAULT true, "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f319b046685c0e07287e76c5ab1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dfa3adf1b46e582626b295d025" ON "sub_categories" ("categoryId") `);
        await queryRunner.query(`CREATE TABLE "categories" ("id" character varying(100) NOT NULL, "name" character varying(100) NOT NULL, "description" text, "icon" character varying, "image" character varying, "isActive" boolean NOT NULL DEFAULT true, "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."order_products_status_enum" AS ENUM('pending', 'processing', 'delivered', 'seen')`);
        await queryRunner.query(`CREATE TABLE "order_products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "productId" uuid NOT NULL, "vendorId" uuid NOT NULL, "name" character varying NOT NULL, "unit" character varying(32) NOT NULL, "price" numeric(12,2) NOT NULL, "image" character varying NOT NULL, "description" text NOT NULL, "quantity" numeric(12,3) NOT NULL, "status" "public"."order_products_status_enum" NOT NULL DEFAULT 'pending', "comment" text, "reviewRef" uuid, CONSTRAINT "PK_3e59f094c2dc3310d585216a813" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6a69fd94a872298cb4e0694d2f" ON "order_products" ("vendorId") `);
        await queryRunner.query(`CREATE INDEX "IDX_27ca18f2453639a1cafb7404ec" ON "order_products" ("productId") `);
        await queryRunner.query(`CREATE INDEX "IDX_28b66449cf7cd76444378ad4e9" ON "order_products" ("orderId") `);
        await queryRunner.query(`CREATE TYPE "public"."order_status_history_status_enum" AS ENUM('pending', 'processing', 'delivered', 'seen')`);
        await queryRunner.query(`CREATE TABLE "order_status_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "userId" uuid NOT NULL, "status" "public"."order_status_history_status_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e6c66d853f155531985fc4f6ec8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_689db3835e5550e68d26ca3267" ON "order_status_history" ("orderId") `);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'processing', 'delivered', 'seen')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "userPhone" character varying NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending', "total" numeric(12,2) NOT NULL, "address" jsonb NOT NULL, "vendorIds" uuid array NOT NULL DEFAULT '{}'::uuid[], "productIds" uuid array NOT NULL DEFAULT '{}'::uuid[], "paidAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1f4b9818a08b822a31493fdee9" ON "orders" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_151b79a83ba240b0cb31b2302d" ON "orders" ("userId") `);
        await queryRunner.query(`CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "orderId" uuid NOT NULL, "userId" uuid NOT NULL, "userName" character varying NOT NULL, "userPhoto" character varying, "stars" smallint NOT NULL, "comment" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7ed5659e7139fc8bc039198cc1" ON "reviews" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_53a68dc905777554b7f702791f" ON "reviews" ("orderId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a6b3c434392f5d10ec17104366" ON "reviews" ("productId") `);
        await queryRunner.query(`CREATE TYPE "public"."notifications_status_enum" AS ENUM('pending', 'processing', 'delivered', 'seen')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "orderId" uuid NOT NULL, "productIds" uuid array NOT NULL DEFAULT '{}'::uuid[], "status" "public"."notifications_status_enum" NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fe1b8ba550e73f84ff228401aa" ON "notifications" ("orderId") `);
        await queryRunner.query(`CREATE INDEX "IDX_21e65af2f4f242d4c85a92aff4" ON "notifications" ("userId", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "product_categories" ADD CONSTRAINT "FK_07910e95f7b581a71ae41dda060" FOREIGN KEY ("subCategoryId") REFERENCES "sub_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sub_categories" ADD CONSTRAINT "FK_dfa3adf1b46e582626b295d0257" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_products" ADD CONSTRAINT "FK_28b66449cf7cd76444378ad4e92" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_status_history" ADD CONSTRAINT "FK_689db3835e5550e68d26ca32676" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_status_history" DROP CONSTRAINT "FK_689db3835e5550e68d26ca32676"`);
        await queryRunner.query(`ALTER TABLE "order_products" DROP CONSTRAINT "FK_28b66449cf7cd76444378ad4e92"`);
        await queryRunner.query(`ALTER TABLE "sub_categories" DROP CONSTRAINT "FK_dfa3adf1b46e582626b295d0257"`);
        await queryRunner.query(`ALTER TABLE "product_categories" DROP CONSTRAINT "FK_07910e95f7b581a71ae41dda060"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_21e65af2f4f242d4c85a92aff4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fe1b8ba550e73f84ff228401aa"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a6b3c434392f5d10ec17104366"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_53a68dc905777554b7f702791f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7ed5659e7139fc8bc039198cc1"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_151b79a83ba240b0cb31b2302d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1f4b9818a08b822a31493fdee9"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_689db3835e5550e68d26ca3267"`);
        await queryRunner.query(`DROP TABLE "order_status_history"`);
        await queryRunner.query(`DROP TYPE "public"."order_status_history_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_28b66449cf7cd76444378ad4e9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_27ca18f2453639a1cafb7404ec"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6a69fd94a872298cb4e0694d2f"`);
        await queryRunner.query(`DROP TABLE "order_products"`);
        await queryRunner.query(`DROP TYPE "public"."order_products_status_enum"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dfa3adf1b46e582626b295d025"`);
        await queryRunner.query(`DROP TABLE "sub_categories"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_07910e95f7b581a71ae41dda06"`);
        await queryRunner.query(`DROP TABLE "product_categories"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_99d90c2a483d79f3b627fb1d5e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c3932231d2385ac248d0888d95"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cab13b3a21a939b139da80eaa9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9e64a98845975f58aea17a22db"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_62e458ba8467ba3c6246c47b93"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1efd59fd70f18d1f97d0247501"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_63fcb3d8806a6efd53dbc67430"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TYPE "public"."products_deliveryoption_enum"`);
        await queryRunner.query(`DROP TYPE "public"."products_unit_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_94e2000b5f7ee1f9c491f0f8a8"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_type_enum"`);
    }

}
