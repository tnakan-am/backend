import 'reflect-metadata';
import { DataSource } from 'typeorm';
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
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
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
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
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
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
});

export default AppDataSource;
