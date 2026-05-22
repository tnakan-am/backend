import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'homemade',
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
      // Dev: synchronize entities directly for fast iteration.
      // Prod: synchronize off, schema is created/updated by migrations only.
      synchronize: process.env.NODE_ENV !== 'production',
      migrationsRun: process.env.NODE_ENV === 'production',
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
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
