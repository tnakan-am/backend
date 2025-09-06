import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Users } from './users/entities/user.entity';
import { Address } from './addresses/entities/address.entity';
import { Product } from './products/entities/product.entity';
import { Category } from './categories/entities/category.entity';
import { SubCategory } from './categories/entities/sub-category.entity';
import { ProductCategory } from './categories/entities/product-category.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '852456AA',
  database: process.env.DB_NAME || 'homemade',
  entities: [Users, Address, Product, Category, SubCategory, ProductCategory],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
});

export default AppDataSource;
