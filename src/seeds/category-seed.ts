import { DataSource } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { SubCategory } from '../categories/entities/sub-category.entity';
import { ProductCategory } from '../categories/entities/product-category.entity';
import { Product } from '../products/entities/product.entity';
import { Users } from '../users/entities/user.entity';
import { Address } from '../addresses/entities/address.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '852456AA',
  database: process.env.DB_NAME || 'homemade',
  entities: [Category, SubCategory, ProductCategory, Product, Users, Address],
  synchronize: false,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('🌱 Starting category seeding...');

  const categoryRepo = AppDataSource.getRepository(Category);
  const subCategoryRepo = AppDataSource.getRepository(SubCategory);
  const productCategoryRepo = AppDataSource.getRepository(ProductCategory);

  // Clear existing data (optional - comment out if you want to keep existing data)
  await productCategoryRepo.delete({});
  await subCategoryRepo.delete({});
  await categoryRepo.delete({});

  // Categories data structure
  const categoriesData = [
    {
      name: 'Groceries',
      slug: 'groceries',
      description: 'Fresh produce, meat, and everyday essentials',
      sortOrder: 1,
      subCategories: [
        {
          name: 'Fruits',
          slug: 'fruits',
          description: 'Fresh and seasonal fruits',
          productCategories: [
            { name: 'Apples', slug: 'apples' },
            { name: 'Bananas', slug: 'bananas' },
            { name: 'Oranges', slug: 'oranges' },
            { name: 'Berries', slug: 'berries' },
            { name: 'Grapes', slug: 'grapes' },
            { name: 'Melons', slug: 'melons' },
            { name: 'Tropical Fruits', slug: 'tropical-fruits' },
            { name: 'Stone Fruits', slug: 'stone-fruits' },
            { name: 'Citrus Fruits', slug: 'citrus-fruits' },
          ],
        },
        {
          name: 'Vegetables',
          slug: 'vegetables',
          description: 'Fresh vegetables and greens',
          productCategories: [
            { name: 'Tomatoes', slug: 'tomatoes' },
            { name: 'Potatoes', slug: 'potatoes' },
            { name: 'Onions', slug: 'onions' },
            { name: 'Carrots', slug: 'carrots' },
            { name: 'Lettuce & Greens', slug: 'lettuce-greens' },
            { name: 'Peppers', slug: 'peppers' },
            { name: 'Cucumbers', slug: 'cucumbers' },
            { name: 'Broccoli & Cauliflower', slug: 'broccoli-cauliflower' },
            { name: 'Root Vegetables', slug: 'root-vegetables' },
            { name: 'Herbs', slug: 'herbs' },
          ],
        },
        {
          name: 'Meat',
          slug: 'meat',
          description: 'Fresh meat and poultry',
          productCategories: [
            { name: 'Chicken', slug: 'chicken' },
            { name: 'Beef', slug: 'beef' },
            { name: 'Pork', slug: 'pork' },
            { name: 'Lamb', slug: 'lamb' },
            { name: 'Turkey', slug: 'turkey' },
            { name: 'Duck', slug: 'duck' },
            { name: 'Veal', slug: 'veal' },
            { name: 'Ground Meat', slug: 'ground-meat' },
            { name: 'Sausages', slug: 'sausages' },
          ],
        },
        {
          name: 'Seafood',
          slug: 'seafood',
          description: 'Fresh fish and seafood',
          productCategories: [
            { name: 'Fresh Fish', slug: 'fresh-fish' },
            { name: 'Shrimp', slug: 'shrimp' },
            { name: 'Salmon', slug: 'salmon' },
            { name: 'Tuna', slug: 'tuna' },
            { name: 'Crab', slug: 'crab' },
            { name: 'Lobster', slug: 'lobster' },
            { name: 'Shellfish', slug: 'shellfish' },
            { name: 'Frozen Seafood', slug: 'frozen-seafood' },
          ],
        },
        {
          name: 'Eggs',
          slug: 'eggs',
          description: 'Fresh eggs',
          productCategories: [
            { name: 'Chicken Eggs', slug: 'chicken-eggs' },
            { name: 'Quail Eggs', slug: 'quail-eggs' },
            { name: 'Duck Eggs', slug: 'duck-eggs' },
            { name: 'Organic Eggs', slug: 'organic-eggs' },
          ],
        },
      ],
    },
    {
      name: 'Drinks',
      slug: 'drinks',
      description: 'Beverages and drinks',
      sortOrder: 2,
      subCategories: [
        {
          name: 'Non-Alcoholic Drinks',
          slug: 'non-alcoholic-drinks',
          description: 'Soft drinks and beverages',
          productCategories: [
            { name: 'Water', slug: 'water' },
            { name: 'Sparkling Water', slug: 'sparkling-water' },
            { name: 'Juice', slug: 'juice' },
            { name: 'Soda', slug: 'soda' },
            { name: 'Energy Drinks', slug: 'energy-drinks' },
            { name: 'Sports Drinks', slug: 'sports-drinks' },
            { name: 'Iced Tea', slug: 'iced-tea' },
            { name: 'Lemonade', slug: 'lemonade' },
            { name: 'Coconut Water', slug: 'coconut-water' },
          ],
        },
        {
          name: 'Alcoholic Drinks',
          slug: 'alcoholic-drinks',
          description: 'Beer, wine, and spirits',
          productCategories: [
            { name: 'Beer', slug: 'beer' },
            { name: 'Wine', slug: 'wine' },
            { name: 'Red Wine', slug: 'red-wine' },
            { name: 'White Wine', slug: 'white-wine' },
            { name: 'Vodka', slug: 'vodka' },
            { name: 'Whiskey', slug: 'whiskey' },
            { name: 'Rum', slug: 'rum' },
            { name: 'Gin', slug: 'gin' },
            { name: 'Tequila', slug: 'tequila' },
            { name: 'Champagne', slug: 'champagne' },
            { name: 'Cocktail Mixers', slug: 'cocktail-mixers' },
          ],
        },
        {
          name: 'Hot Beverages',
          slug: 'hot-beverages',
          description: 'Coffee, tea, and hot drinks',
          productCategories: [
            { name: 'Coffee', slug: 'coffee' },
            { name: 'Tea', slug: 'tea' },
            { name: 'Green Tea', slug: 'green-tea' },
            { name: 'Black Tea', slug: 'black-tea' },
            { name: 'Herbal Tea', slug: 'herbal-tea' },
            { name: 'Hot Chocolate', slug: 'hot-chocolate' },
            { name: 'Coffee Beans', slug: 'coffee-beans' },
            { name: 'Instant Coffee', slug: 'instant-coffee' },
          ],
        },
      ],
    },
    {
      name: 'Semi-Finished Products',
      slug: 'semi-finished',
      description: 'Ready-to-cook and frozen foods',
      sortOrder: 3,
      subCategories: [
        {
          name: 'Frozen Foods',
          slug: 'frozen-foods',
          description: 'Frozen meals and ingredients',
          productCategories: [
            { name: 'Frozen Pizza', slug: 'frozen-pizza' },
            { name: 'Frozen Vegetables', slug: 'frozen-vegetables' },
            { name: 'Frozen Fruits', slug: 'frozen-fruits' },
            { name: 'Ice Cream', slug: 'ice-cream' },
            { name: 'Frozen Meals', slug: 'frozen-meals' },
            { name: 'Frozen Fries', slug: 'frozen-fries' },
            { name: 'Frozen Nuggets', slug: 'frozen-nuggets' },
            { name: 'Frozen Burgers', slug: 'frozen-burgers' },
          ],
        },
        {
          name: 'Ready-to-Cook',
          slug: 'ready-to-cook',
          description: 'Pre-prepared ingredients',
          productCategories: [
            { name: 'Marinated Meat', slug: 'marinated-meat' },
            { name: 'Pre-cut Vegetables', slug: 'pre-cut-vegetables' },
            { name: 'Meal Kits', slug: 'meal-kits' },
            { name: 'Pasta Sauces', slug: 'pasta-sauces' },
            { name: 'Soup Mixes', slug: 'soup-mixes' },
            { name: 'Salad Kits', slug: 'salad-kits' },
            { name: 'Stir-fry Mixes', slug: 'stir-fry-mixes' },
          ],
        },
        {
          name: 'Instant Foods',
          slug: 'instant-foods',
          description: 'Quick preparation foods',
          productCategories: [
            { name: 'Instant Noodles', slug: 'instant-noodles' },
            { name: 'Instant Soup', slug: 'instant-soup' },
            { name: 'Instant Rice', slug: 'instant-rice' },
            { name: 'Instant Oatmeal', slug: 'instant-oatmeal' },
            { name: 'Instant Mashed Potatoes', slug: 'instant-mashed-potatoes' },
          ],
        },
      ],
    },
    {
      name: 'Dairy Products',
      slug: 'dairy',
      description: 'Milk, cheese, and dairy items',
      sortOrder: 4,
      subCategories: [
        {
          name: 'Milk',
          slug: 'milk',
          description: 'Fresh milk products',
          productCategories: [
            { name: 'Whole Milk', slug: 'whole-milk' },
            { name: 'Low-fat Milk', slug: 'low-fat-milk' },
            { name: 'Lactose-free Milk', slug: 'lactose-free-milk' },
            { name: 'Chocolate Milk', slug: 'chocolate-milk' },
            { name: 'Plant-based Milk', slug: 'plant-based-milk' },
            { name: 'Almond Milk', slug: 'almond-milk' },
            { name: 'Soy Milk', slug: 'soy-milk' },
            { name: 'Oat Milk', slug: 'oat-milk' },
          ],
        },
        {
          name: 'Cheese',
          slug: 'cheese',
          description: 'Various types of cheese',
          productCategories: [
            { name: 'Cheddar', slug: 'cheddar' },
            { name: 'Mozzarella', slug: 'mozzarella' },
            { name: 'Parmesan', slug: 'parmesan' },
            { name: 'Swiss Cheese', slug: 'swiss-cheese' },
            { name: 'Cream Cheese', slug: 'cream-cheese' },
            { name: 'Feta', slug: 'feta' },
            { name: 'Goat Cheese', slug: 'goat-cheese' },
            { name: 'Blue Cheese', slug: 'blue-cheese' },
            { name: 'Cottage Cheese', slug: 'cottage-cheese' },
          ],
        },
        {
          name: 'Yogurt',
          slug: 'yogurt',
          description: 'Yogurt and fermented products',
          productCategories: [
            { name: 'Plain Yogurt', slug: 'plain-yogurt' },
            { name: 'Greek Yogurt', slug: 'greek-yogurt' },
            { name: 'Flavored Yogurt', slug: 'flavored-yogurt' },
            { name: 'Yogurt Drinks', slug: 'yogurt-drinks' },
            { name: 'Kefir', slug: 'kefir' },
            { name: 'Probiotic Yogurt', slug: 'probiotic-yogurt' },
          ],
        },
        {
          name: 'Butter & Cream',
          slug: 'butter-cream',
          description: 'Butter and cream products',
          productCategories: [
            { name: 'Butter', slug: 'butter' },
            { name: 'Margarine', slug: 'margarine' },
            { name: 'Heavy Cream', slug: 'heavy-cream' },
            { name: 'Sour Cream', slug: 'sour-cream' },
            { name: 'Whipped Cream', slug: 'whipped-cream' },
            { name: 'Half & Half', slug: 'half-and-half' },
          ],
        },
      ],
    },
    {
      name: 'Bakery',
      slug: 'bakery',
      description: 'Fresh bread and baked goods',
      sortOrder: 5,
      subCategories: [
        {
          name: 'Bread',
          slug: 'bread',
          description: 'Fresh bread varieties',
          productCategories: [
            { name: 'White Bread', slug: 'white-bread' },
            { name: 'Whole Wheat Bread', slug: 'whole-wheat-bread' },
            { name: 'Sourdough', slug: 'sourdough' },
            { name: 'Rye Bread', slug: 'rye-bread' },
            { name: 'Baguettes', slug: 'baguettes' },
            { name: 'Rolls', slug: 'rolls' },
            { name: 'Pita Bread', slug: 'pita-bread' },
            { name: 'Bagels', slug: 'bagels' },
            { name: 'English Muffins', slug: 'english-muffins' },
          ],
        },
        {
          name: 'Pastries',
          slug: 'pastries',
          description: 'Sweet baked goods',
          productCategories: [
            { name: 'Croissants', slug: 'croissants' },
            { name: 'Donuts', slug: 'donuts' },
            { name: 'Muffins', slug: 'muffins' },
            { name: 'Danish Pastries', slug: 'danish-pastries' },
            { name: 'Cinnamon Rolls', slug: 'cinnamon-rolls' },
            { name: 'Scones', slug: 'scones' },
          ],
        },
        {
          name: 'Cakes',
          slug: 'cakes',
          description: 'Cakes and desserts',
          productCategories: [
            { name: 'Birthday Cakes', slug: 'birthday-cakes' },
            { name: 'Cheesecake', slug: 'cheesecake' },
            { name: 'Chocolate Cake', slug: 'chocolate-cake' },
            { name: 'Fruit Cakes', slug: 'fruit-cakes' },
            { name: 'Cupcakes', slug: 'cupcakes' },
            { name: 'Pound Cake', slug: 'pound-cake' },
          ],
        },
      ],
    },
    {
      name: 'Snacks',
      slug: 'snacks',
      description: 'Chips, cookies, and snack foods',
      sortOrder: 6,
      subCategories: [
        {
          name: 'Chips & Crisps',
          slug: 'chips-crisps',
          description: 'Savory snacks',
          productCategories: [
            { name: 'Potato Chips', slug: 'potato-chips' },
            { name: 'Tortilla Chips', slug: 'tortilla-chips' },
            { name: 'Corn Chips', slug: 'corn-chips' },
            { name: 'Pretzels', slug: 'pretzels' },
            { name: 'Popcorn', slug: 'popcorn' },
            { name: 'Rice Cakes', slug: 'rice-cakes' },
            { name: 'Crackers', slug: 'crackers' },
          ],
        },
        {
          name: 'Cookies & Biscuits',
          slug: 'cookies-biscuits',
          description: 'Sweet baked snacks',
          productCategories: [
            { name: 'Chocolate Chip Cookies', slug: 'chocolate-chip-cookies' },
            { name: 'Oatmeal Cookies', slug: 'oatmeal-cookies' },
            { name: 'Sugar Cookies', slug: 'sugar-cookies' },
            { name: 'Sandwich Cookies', slug: 'sandwich-cookies' },
            { name: 'Wafers', slug: 'wafers' },
            { name: 'Graham Crackers', slug: 'graham-crackers' },
          ],
        },
        {
          name: 'Candy & Chocolate',
          slug: 'candy-chocolate',
          description: 'Sweets and confectionery',
          productCategories: [
            { name: 'Chocolate Bars', slug: 'chocolate-bars' },
            { name: 'Dark Chocolate', slug: 'dark-chocolate' },
            { name: 'Milk Chocolate', slug: 'milk-chocolate' },
            { name: 'Gummy Candy', slug: 'gummy-candy' },
            { name: 'Hard Candy', slug: 'hard-candy' },
            { name: 'Lollipops', slug: 'lollipops' },
            { name: 'Chewing Gum', slug: 'chewing-gum' },
            { name: 'Mints', slug: 'mints' },
          ],
        },
        {
          name: 'Nuts & Seeds',
          slug: 'nuts-seeds',
          description: 'Healthy snack options',
          productCategories: [
            { name: 'Almonds', slug: 'almonds' },
            { name: 'Cashews', slug: 'cashews' },
            { name: 'Peanuts', slug: 'peanuts' },
            { name: 'Walnuts', slug: 'walnuts' },
            { name: 'Pistachios', slug: 'pistachios' },
            { name: 'Sunflower Seeds', slug: 'sunflower-seeds' },
            { name: 'Trail Mix', slug: 'trail-mix' },
            { name: 'Mixed Nuts', slug: 'mixed-nuts' },
          ],
        },
      ],
    },
    {
      name: 'Pantry',
      slug: 'pantry',
      description: 'Cooking essentials and dry goods',
      sortOrder: 7,
      subCategories: [
        {
          name: 'Grains & Pasta',
          slug: 'grains-pasta',
          description: 'Rice, pasta, and grains',
          productCategories: [
            { name: 'White Rice', slug: 'white-rice' },
            { name: 'Brown Rice', slug: 'brown-rice' },
            { name: 'Basmati Rice', slug: 'basmati-rice' },
            { name: 'Spaghetti', slug: 'spaghetti' },
            { name: 'Penne', slug: 'penne' },
            { name: 'Macaroni', slug: 'macaroni' },
            { name: 'Quinoa', slug: 'quinoa' },
            { name: 'Oats', slug: 'oats' },
            { name: 'Flour', slug: 'flour' },
          ],
        },
        {
          name: 'Oils & Vinegars',
          slug: 'oils-vinegars',
          description: 'Cooking oils and vinegars',
          productCategories: [
            { name: 'Olive Oil', slug: 'olive-oil' },
            { name: 'Vegetable Oil', slug: 'vegetable-oil' },
            { name: 'Coconut Oil', slug: 'coconut-oil' },
            { name: 'Sunflower Oil', slug: 'sunflower-oil' },
            { name: 'Balsamic Vinegar', slug: 'balsamic-vinegar' },
            { name: 'Apple Cider Vinegar', slug: 'apple-cider-vinegar' },
            { name: 'White Vinegar', slug: 'white-vinegar' },
          ],
        },
        {
          name: 'Spices & Seasonings',
          slug: 'spices-seasonings',
          description: 'Herbs and spices',
          productCategories: [
            { name: 'Salt', slug: 'salt' },
            { name: 'Black Pepper', slug: 'black-pepper' },
            { name: 'Garlic Powder', slug: 'garlic-powder' },
            { name: 'Paprika', slug: 'paprika' },
            { name: 'Cumin', slug: 'cumin' },
            { name: 'Oregano', slug: 'oregano' },
            { name: 'Basil', slug: 'basil' },
            { name: 'Cinnamon', slug: 'cinnamon' },
            { name: 'Curry Powder', slug: 'curry-powder' },
          ],
        },
        {
          name: 'Canned Goods',
          slug: 'canned-goods',
          description: 'Canned and jarred items',
          productCategories: [
            { name: 'Canned Tomatoes', slug: 'canned-tomatoes' },
            { name: 'Canned Beans', slug: 'canned-beans' },
            { name: 'Canned Corn', slug: 'canned-corn' },
            { name: 'Canned Tuna', slug: 'canned-tuna' },
            { name: 'Canned Soup', slug: 'canned-soup' },
            { name: 'Tomato Sauce', slug: 'tomato-sauce' },
            { name: 'Pickles', slug: 'pickles' },
            { name: 'Olives', slug: 'olives' },
          ],
        },
      ],
    },
  ];

  // Insert categories with their subcategories and product categories
  for (const categoryData of categoriesData) {
    // Create main category
    const category = await categoryRepo.save({
      name: categoryData.name,
      slug: categoryData.slug,
      description: categoryData.description,
      sortOrder: categoryData.sortOrder,
      isActive: true,
    });
    console.log(`✅ Created category: ${category.name}`);

    // Create subcategories
    for (const subCatData of categoryData.subCategories) {
      const subCategory = await subCategoryRepo.save({
        categoryId: category.id,
        name: subCatData.name,
        slug: subCatData.slug,
        description: subCatData.description,
        isActive: true,
      });
      console.log(`  ✅ Created subcategory: ${subCategory.name}`);

      // Create product categories
      for (const prodCatData of subCatData.productCategories) {
        const productCategory = await productCategoryRepo.save({
          subCategoryId: subCategory.id,
          name: prodCatData.name,
          slug: prodCatData.slug,
          isActive: true,
        });
        console.log(`    ✅ Created product category: ${productCategory.name}`);
      }
    }
  }

  console.log('🎉 Seeding completed successfully!');
  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});