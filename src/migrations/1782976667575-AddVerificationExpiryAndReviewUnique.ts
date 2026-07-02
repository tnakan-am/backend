import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVerificationExpiryAndReviewUnique1782976667575
  implements MigrationInterface
{
  name = 'AddVerificationExpiryAndReviewUnique1782976667575';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verificationTokenExpiresAt" TIMESTAMP`,
    );
    // Collapse any pre-existing duplicate reviews (keep the earliest per order
    // line) so the unique index below can be created on live data.
    await queryRunner.query(
      `DELETE FROM "reviews" a
       USING "reviews" b
       WHERE a."orderId" = b."orderId"
         AND a."productId" = b."productId"
         AND (a."createdAt" > b."createdAt"
              OR (a."createdAt" = b."createdAt" AND a."id" > b."id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_reviews_order_product" ON "reviews" ("orderId", "productId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."UQ_reviews_order_product"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "verificationTokenExpiresAt"`,
    );
  }
}
