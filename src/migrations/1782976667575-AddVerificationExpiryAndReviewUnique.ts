import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVerificationExpiryAndReviewUnique1782976667575
  implements MigrationInterface
{
  name = 'AddVerificationExpiryAndReviewUnique1782976667575';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verificationTokenExpiresAt" TIMESTAMP`,
    );
    // Give pre-existing unverified users' in-flight tokens a fresh 24h window,
    // so verification links sent before this deploy keep working.
    await queryRunner.query(
      `UPDATE "users"
         SET "verificationTokenExpiresAt" = NOW() + INTERVAL '24 hours'
       WHERE "verificationToken" IS NOT NULL
         AND "verified" = false
         AND "verificationTokenExpiresAt" IS NULL`,
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
    // The dedup above removed rows that were baked into the denormalized
    // rating aggregates; recompute them from the surviving reviews (matches
    // ProductsService.recomputeReviewAggregates).
    await queryRunner.query(
      `UPDATE "products" p
          SET "avgReview" = agg.avg,
              "numberReview" = agg.cnt
         FROM (SELECT "productId",
                      COALESCE(AVG(stars), 0)::numeric(3,2) AS avg,
                      COUNT(*)::int AS cnt
                 FROM "reviews"
                GROUP BY "productId") agg
        WHERE p."id" = agg."productId"
          AND (p."avgReview" IS DISTINCT FROM agg.avg
               OR p."numberReview" IS DISTINCT FROM agg.cnt)`,
    );
    // Repoint any order line whose reviewRef pointed at a now-deleted duplicate
    // to the surviving review for that (orderId, productId), so the linkage the
    // "already reviewed" guard depends on is not left dangling.
    await queryRunner.query(
      `UPDATE "order_products" op
         SET "reviewRef" = r."id"
       FROM "reviews" r
       WHERE r."orderId" = op."orderId"
         AND r."productId" = op."productId"
         AND op."reviewRef" IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM "reviews" r2 WHERE r2."id" = op."reviewRef")`,
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
