import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import * as Joi from 'joi';

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
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'staging', 'production')
          .default('development'),
        PORT: Joi.number().default(3000),

        DATABASE_URL: Joi.string().uri().optional(),
        DB_HOST: Joi.string().when('DATABASE_URL', {
          is: Joi.exist(),
          then: Joi.optional(),
          otherwise: Joi.required(),
        }),
        DB_PORT: Joi.number().when('DATABASE_URL', {
          is: Joi.exist(),
          then: Joi.optional(),
          otherwise: Joi.required(),
        }),
        DB_USERNAME: Joi.string().when('DATABASE_URL', {
          is: Joi.exist(),
          then: Joi.optional(),
          otherwise: Joi.required(),
        }),
        DB_PASSWORD: Joi.string().when('DATABASE_URL', {
          is: Joi.exist(),
          then: Joi.optional(),
          otherwise: Joi.required(),
        }),
        DB_NAME: Joi.string().when('DATABASE_URL', {
          is: Joi.exist(),
          then: Joi.optional(),
          otherwise: Joi.required(),
        }),
        DB_SSL: Joi.string().valid('true', 'false').default('false'),

        JWT_SECRET: Joi.string().min(32).required(),

        CORS_ORIGIN: Joi.string().required(),
        FRONTEND_URL: Joi.string().uri().required(),

        SMTP_HOST: Joi.string().required(),
        SMTP_PORT: Joi.number().required(),
        SMTP_USER: Joi.string().allow('').required(),
        SMTP_PASS: Joi.string().allow('').required(),
        SMTP_FROM: Joi.string().required(),

        UPLOADS_DIR: Joi.string().default('uploads'),
        UPLOADS_PUBLIC_URL: Joi.string().uri().required(),
      }),
      validationOptions: { abortEarly: false },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...(process.env.DATABASE_URL
        ? { url: process.env.DATABASE_URL }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT, 10) || 5432,
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_NAME || 'homemade',
          }),
      ssl:
        process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
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
      synchronize: false,
      migrationsRun: true,
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
