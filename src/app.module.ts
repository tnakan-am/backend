import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { Users } from './users/entities/user.entity';
import { Product } from './products/entities/product.entity';
import { Category } from './categories/entities/category.entity';
import { SubCategory } from './categories/entities/sub-category.entity';
import { ProductCategory } from './categories/entities/product-category.entity';
import { Order } from './orders/entities/order.entity';
import { OrderProduct } from './orders/entities/order-product.entity';
import { OrderStatusHistory } from './orders/entities/order-status-history.entity';
import { Review } from './reviews/entities/review.entity';
import { Notification } from './notifications/entities/notification.entity';

import { UserModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { UploadsModule } from './uploads/uploads.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      // Prefer DATABASE_URL (injected by managed hosts like Fly Postgres);
      // fall back to discrete DB_* vars for local development.
      ...(process.env.DATABASE_URL
        ? { url: process.env.DATABASE_URL }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT, 10) || 5432,
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_NAME || 'homemade',
          }),
      // Validate the DB server certificate by default; only skip validation
      // when DB_SSL_INSECURE=true (e.g. hosts with self-signed certs). Leaving
      // it off silently would allow a man-in-the-middle on the DB connection.
      ssl:
        process.env.DB_SSL === 'true'
          ? { rejectUnauthorized: process.env.DB_SSL_INSECURE !== 'true' }
          : false,
      entities: [
        Users,
        Product,
        Category,
        SubCategory,
        ProductCategory,
        Order,
        OrderProduct,
        OrderStatusHistory,
        Review,
        Notification,
      ],
      // Local dev: synchronize entities directly for fast iteration.
      // Everywhere else (test/staging/prod): schema comes from migrations only,
      // so the migration that prod runs is exercised in CI and staging first.
      synchronize: process.env.NODE_ENV === 'development',
      migrationsRun: process.env.NODE_ENV !== 'development',
      migrations: ['dist/migrations/*.js'],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), process.env.UPLOADS_DIR || 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { fallthrough: false, index: false },
    }),
    UserModule,
    AuthModule,
    EmailModule,
    ProductsModule,
    CategoriesModule,
    UploadsModule,
    OrdersModule,
    ReviewsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
