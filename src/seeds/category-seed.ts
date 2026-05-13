import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

import { Category } from '../categories/entities/category.entity';
import { SubCategory } from '../categories/entities/sub-category.entity';
import { ProductCategory } from '../categories/entities/product-category.entity';
import { Users } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderProduct } from '../orders/entities/order-product.entity';
import { OrderStatusHistory } from '../orders/entities/order-status-history.entity';
import { Review } from '../reviews/entities/review.entity';
import { Notification } from '../notifications/entities/notification.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'homemade',
  entities: [
    Category,
    SubCategory,
    ProductCategory,
    Users,
    Product,
    Order,
    OrderProduct,
    OrderStatusHistory,
    Review,
    Notification,
  ],
  synchronize: true,
});

type ProductCategoryData = { id: string; name: string };
type SubCategoryData = {
  id: string;
  name: string;
  description?: string;
  productCategories: ProductCategoryData[];
};
type CategoryData = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  subCategories: SubCategoryData[];
};

const categoriesData: CategoryData[] = [
  {
    id: 'groceries',
    name: 'Groceries',
    description: 'Fresh produce, meat, and everyday essentials',
    sortOrder: 1,
    subCategories: [
      {
        id: 'fruits',
        name: 'Fruits',
        description: 'Fresh and seasonal fruits',
        productCategories: [
          { id: 'apples', name: 'Apples' },
          { id: 'bananas', name: 'Bananas' },
          { id: 'oranges', name: 'Oranges' },
          { id: 'berries', name: 'Berries' },
          { id: 'grapes', name: 'Grapes' },
          { id: 'melons', name: 'Melons' },
        ],
      },
      {
        id: 'vegetables',
        name: 'Vegetables',
        description: 'Fresh vegetables and greens',
        productCategories: [
          { id: 'tomatoes', name: 'Tomatoes' },
          { id: 'potatoes', name: 'Potatoes' },
          { id: 'onions', name: 'Onions' },
          { id: 'carrots', name: 'Carrots' },
          { id: 'peppers', name: 'Peppers' },
          { id: 'cucumbers', name: 'Cucumbers' },
          { id: 'herbs', name: 'Herbs' },
        ],
      },
      {
        id: 'meat',
        name: 'Meat',
        description: 'Fresh meat and poultry',
        productCategories: [
          { id: 'chicken', name: 'Chicken' },
          { id: 'beef', name: 'Beef' },
          { id: 'pork', name: 'Pork' },
          { id: 'lamb', name: 'Lamb' },
          { id: 'turkey', name: 'Turkey' },
        ],
      },
      {
        id: 'seafood',
        name: 'Seafood',
        description: 'Fresh fish and seafood',
        productCategories: [
          { id: 'fresh-fish', name: 'Fresh Fish' },
          { id: 'shrimp', name: 'Shrimp' },
          { id: 'salmon', name: 'Salmon' },
          { id: 'tuna', name: 'Tuna' },
        ],
      },
      {
        id: 'eggs',
        name: 'Eggs',
        description: 'Fresh eggs',
        productCategories: [
          { id: 'chicken-eggs', name: 'Chicken Eggs' },
          { id: 'quail-eggs', name: 'Quail Eggs' },
          { id: 'organic-eggs', name: 'Organic Eggs' },
        ],
      },
    ],
  },
  {
    id: 'drinks',
    name: 'Drinks',
    description: 'Beverages and drinks',
    sortOrder: 2,
    subCategories: [
      {
        id: 'non-alcoholic-drinks',
        name: 'Non-Alcoholic Drinks',
        description: 'Soft drinks and beverages',
        productCategories: [
          { id: 'water', name: 'Water' },
          { id: 'juice', name: 'Juice' },
          { id: 'soda', name: 'Soda' },
          { id: 'energy-drinks', name: 'Energy Drinks' },
        ],
      },
      {
        id: 'alcoholic-drinks',
        name: 'Alcoholic Drinks',
        description: 'Beer, wine, and spirits',
        productCategories: [
          { id: 'beer', name: 'Beer' },
          { id: 'wine', name: 'Wine' },
          { id: 'vodka', name: 'Vodka' },
          { id: 'whiskey', name: 'Whiskey' },
        ],
      },
      {
        id: 'hot-beverages',
        name: 'Hot Beverages',
        description: 'Coffee, tea, and hot drinks',
        productCategories: [
          { id: 'coffee', name: 'Coffee' },
          { id: 'tea', name: 'Tea' },
          { id: 'hot-chocolate', name: 'Hot Chocolate' },
        ],
      },
    ],
  },
  {
    id: 'dairy',
    name: 'Dairy Products',
    description: 'Milk, cheese, and dairy items',
    sortOrder: 3,
    subCategories: [
      {
        id: 'milk',
        name: 'Milk',
        description: 'Fresh milk products',
        productCategories: [
          { id: 'whole-milk', name: 'Whole Milk' },
          { id: 'low-fat-milk', name: 'Low-fat Milk' },
          { id: 'almond-milk', name: 'Almond Milk' },
        ],
      },
      {
        id: 'cheese',
        name: 'Cheese',
        description: 'Various types of cheese',
        productCategories: [
          { id: 'cheddar', name: 'Cheddar' },
          { id: 'mozzarella', name: 'Mozzarella' },
          { id: 'feta', name: 'Feta' },
          { id: 'parmesan', name: 'Parmesan' },
        ],
      },
      {
        id: 'yogurt',
        name: 'Yogurt',
        description: 'Yogurt and fermented products',
        productCategories: [
          { id: 'plain-yogurt', name: 'Plain Yogurt' },
          { id: 'greek-yogurt', name: 'Greek Yogurt' },
          { id: 'kefir', name: 'Kefir' },
        ],
      },
      {
        id: 'butter-cream',
        name: 'Butter & Cream',
        description: 'Butter and cream products',
        productCategories: [
          { id: 'butter', name: 'Butter' },
          { id: 'sour-cream', name: 'Sour Cream' },
          { id: 'heavy-cream', name: 'Heavy Cream' },
        ],
      },
    ],
  },
  {
    id: 'bakery',
    name: 'Bakery',
    description: 'Fresh bread and baked goods',
    sortOrder: 4,
    subCategories: [
      {
        id: 'bread',
        name: 'Bread',
        description: 'Fresh bread varieties',
        productCategories: [
          { id: 'white-bread', name: 'White Bread' },
          { id: 'whole-wheat-bread', name: 'Whole Wheat Bread' },
          { id: 'sourdough', name: 'Sourdough' },
          { id: 'baguettes', name: 'Baguettes' },
        ],
      },
      {
        id: 'pastries',
        name: 'Pastries',
        description: 'Sweet baked goods',
        productCategories: [
          { id: 'croissants', name: 'Croissants' },
          { id: 'muffins', name: 'Muffins' },
          { id: 'donuts', name: 'Donuts' },
        ],
      },
      {
        id: 'cakes',
        name: 'Cakes',
        description: 'Cakes and desserts',
        productCategories: [
          { id: 'birthday-cakes', name: 'Birthday Cakes' },
          { id: 'cheesecake', name: 'Cheesecake' },
          { id: 'cupcakes', name: 'Cupcakes' },
        ],
      },
    ],
  },
  {
    id: 'snacks',
    name: 'Snacks',
    description: 'Chips, cookies, and snack foods',
    sortOrder: 5,
    subCategories: [
      {
        id: 'chips-crisps',
        name: 'Chips & Crisps',
        description: 'Savory snacks',
        productCategories: [
          { id: 'potato-chips', name: 'Potato Chips' },
          { id: 'pretzels', name: 'Pretzels' },
          { id: 'popcorn', name: 'Popcorn' },
        ],
      },
      {
        id: 'cookies-biscuits',
        name: 'Cookies & Biscuits',
        description: 'Sweet baked snacks',
        productCategories: [
          { id: 'chocolate-chip-cookies', name: 'Chocolate Chip Cookies' },
          { id: 'oatmeal-cookies', name: 'Oatmeal Cookies' },
        ],
      },
      {
        id: 'candy-chocolate',
        name: 'Candy & Chocolate',
        description: 'Sweets and confectionery',
        productCategories: [
          { id: 'chocolate-bars', name: 'Chocolate Bars' },
          { id: 'gummy-candy', name: 'Gummy Candy' },
        ],
      },
      {
        id: 'nuts-seeds',
        name: 'Nuts & Seeds',
        description: 'Healthy snack options',
        productCategories: [
          { id: 'almonds', name: 'Almonds' },
          { id: 'cashews', name: 'Cashews' },
          { id: 'walnuts', name: 'Walnuts' },
        ],
      },
    ],
  },
  {
    id: 'pantry',
    name: 'Pantry',
    description: 'Cooking essentials and dry goods',
    sortOrder: 6,
    subCategories: [
      {
        id: 'grains-pasta',
        name: 'Grains & Pasta',
        description: 'Rice, pasta, and grains',
        productCategories: [
          { id: 'white-rice', name: 'White Rice' },
          { id: 'spaghetti', name: 'Spaghetti' },
          { id: 'penne', name: 'Penne' },
          { id: 'flour', name: 'Flour' },
        ],
      },
      {
        id: 'oils-vinegars',
        name: 'Oils & Vinegars',
        description: 'Cooking oils and vinegars',
        productCategories: [
          { id: 'olive-oil', name: 'Olive Oil' },
          { id: 'sunflower-oil', name: 'Sunflower Oil' },
          { id: 'balsamic-vinegar', name: 'Balsamic Vinegar' },
        ],
      },
      {
        id: 'spices-seasonings',
        name: 'Spices & Seasonings',
        description: 'Herbs and spices',
        productCategories: [
          { id: 'salt', name: 'Salt' },
          { id: 'black-pepper', name: 'Black Pepper' },
          { id: 'paprika', name: 'Paprika' },
          { id: 'oregano', name: 'Oregano' },
        ],
      },
      {
        id: 'canned-goods',
        name: 'Canned Goods',
        description: 'Canned and jarred items',
        productCategories: [
          { id: 'canned-tomatoes', name: 'Canned Tomatoes' },
          { id: 'canned-beans', name: 'Canned Beans' },
          { id: 'canned-tuna', name: 'Canned Tuna' },
        ],
      },
    ],
  },
];

async function seed(): Promise<void> {
  await AppDataSource.initialize();
  console.log('Starting category seeding…');

  const categoryRepo = AppDataSource.getRepository(Category);
  const subCategoryRepo = AppDataSource.getRepository(SubCategory);
  const productCategoryRepo = AppDataSource.getRepository(ProductCategory);

  // Wipe in dependency order.
  await productCategoryRepo.createQueryBuilder().delete().execute();
  await subCategoryRepo.createQueryBuilder().delete().execute();
  await categoryRepo.createQueryBuilder().delete().execute();

  for (const c of categoriesData) {
    const category = await categoryRepo.save({
      id: c.id,
      name: c.name,
      description: c.description,
      sortOrder: c.sortOrder,
      isActive: true,
    });
    console.log(`  category: ${category.name}`);

    for (const sc of c.subCategories) {
      const subCategory = await subCategoryRepo.save({
        id: sc.id,
        categoryId: category.id,
        name: sc.name,
        description: sc.description,
        isActive: true,
      });
      console.log(`    sub-category: ${subCategory.name}`);

      for (const pc of sc.productCategories) {
        await productCategoryRepo.save({
          id: pc.id,
          subCategoryId: subCategory.id,
          name: pc.name,
          isActive: true,
        });
      }
    }
  }

  console.log('Seeding complete.');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
