import 'reflect-metadata';
import { DataSource, EntityManager, In, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

import { Users, UserType } from '../users/entities/user.entity';
import {
  DeliveryOption,
  Product,
  Unit,
} from '../products/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderProduct } from '../orders/entities/order-product.entity';
import { OrderStatusHistory } from '../orders/entities/order-status-history.entity';
import { OrderStatus } from '../orders/order-status.enum';
import { Review } from '../reviews/entities/review.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Advertisement } from '../ads/entities/advertisement.entity';

dotenv.config();

// Every seeded account uses this domain, so a re-run can find and replace
// exactly the rows it created and leave real data alone.
const EMAIL_DOMAIN = '@test.tnakan.local';
const PASSWORD = 'Test1234!';

const img = (seed: string) => `https://picsum.photos/seed/${seed}/600/400`;

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'homemade',
  entities: [
    Users,
    Product,
    Order,
    OrderProduct,
    OrderStatusHistory,
    Review,
    Notification,
    Advertisement,
  ],
});

type UserSeed = Partial<Users> & { key: string };

const usersData: UserSeed[] = [
  {
    key: 'admin',
    type: UserType.ADMIN,
    displayName: 'Admin',
    name: 'Ani',
    surname: 'Admin',
  },
  {
    key: 'farm',
    type: UserType.BUSINESS,
    displayName: 'Ararat Farm',
    name: 'Armen',
    surname: 'Petrosyan',
    company: 'Ararat Farm LLC',
    hvhh: '01234567',
    phoneNumber: '+37491000001',
    isTopSeller: true,
    image: img('ararat-farm'),
    address: { city: 'Artashat', region: 'Ararat', country: 'Armenia' },
  },
  {
    key: 'bakery',
    type: UserType.BUSINESS,
    displayName: 'Grandma Bakery',
    name: 'Lusine',
    surname: 'Hakobyan',
    company: 'Grandma Bakery',
    hvhh: '07654321',
    phoneNumber: '+37491000002',
    image: img('grandma-bakery'),
    address: {
      city: 'Yerevan',
      street: 'Abovyan',
      house: '12',
      country: 'Armenia',
    },
  },
  {
    key: 'alice',
    type: UserType.CUSTOMER,
    displayName: 'Alice',
    name: 'Alice',
    surname: 'Sargsyan',
    phoneNumber: '+37493000001',
    address: {
      city: 'Yerevan',
      street: 'Tumanyan',
      house: '5',
      zip: '0001',
      country: 'Armenia',
    },
  },
  {
    key: 'bob',
    type: UserType.CUSTOMER,
    displayName: 'Bob',
    name: 'Bob',
    surname: 'Grigoryan',
    phoneNumber: '+37493000002',
    address: {
      city: 'Gyumri',
      street: 'Rustaveli',
      house: '20',
      zip: '3101',
      country: 'Armenia',
    },
  },
];

type ProductSeed = Partial<Product> & { key: string; vendor: string };

// Category ids match src/seeds/category-seed.ts.
const productsData: ProductSeed[] = [
  {
    key: 'apples',
    vendor: 'farm',
    name: 'Golden Apples',
    unit: Unit.kg,
    minQuantity: 1,
    price: 600,
    description: 'Sweet golden apples from the Ararat valley.',
    category: 'groceries',
    subCategory: 'fruits',
    productCategory: 'apples',
    availability: '200',
    deliveryOption: DeliveryOption.nextDay,
  },
  {
    key: 'tomatoes',
    vendor: 'farm',
    name: 'Greenhouse Tomatoes',
    unit: Unit.kg,
    minQuantity: 0.5,
    price: 900,
    description: 'Ripe tomatoes, picked the day before delivery.',
    category: 'groceries',
    subCategory: 'vegetables',
    productCategory: 'tomatoes',
    availability: 'unlimited',
    deliveryOption: DeliveryOption.nearest,
  },
  {
    key: 'eggs',
    vendor: 'farm',
    name: 'Free-range Eggs',
    unit: Unit.quantity,
    minQuantity: 10,
    price: 90,
    description: 'Eggs from free-range village hens.',
    category: 'groceries',
    subCategory: 'eggs',
    productCategory: 'chicken-eggs',
    availability: '500',
    deliveryOption: DeliveryOption.nextDay,
  },
  {
    key: 'cheese',
    vendor: 'farm',
    name: 'Lori Cheese',
    unit: Unit.kg,
    minQuantity: 0.5,
    price: 3200,
    description: 'Traditional brined cheese.',
    category: 'dairy',
    subCategory: 'cheese',
    productCategory: 'feta',
    availability: '40',
    deliveryOption: DeliveryOption.afterNextDay,
  },
  {
    key: 'matsun',
    vendor: 'farm',
    name: 'Homemade Matsun',
    unit: Unit.liter,
    minQuantity: 1,
    price: 700,
    description: 'Fermented milk made from fresh cow milk.',
    category: 'dairy',
    subCategory: 'yogurt',
    productCategory: 'plain-yogurt',
    availability: 'unlimited',
    deliveryOption: DeliveryOption.nearest,
  },
  {
    key: 'lavash',
    vendor: 'bakery',
    name: 'Lavash',
    unit: Unit.quantity,
    minQuantity: 1,
    price: 250,
    description: 'Thin flatbread baked in a tonir.',
    category: 'bakery',
    subCategory: 'bread',
    productCategory: 'white-bread',
    availability: 'unlimited',
    deliveryOption: DeliveryOption.nearest,
  },
  {
    key: 'gata',
    vendor: 'bakery',
    name: 'Gata',
    unit: Unit.quantity,
    minQuantity: 1,
    price: 1500,
    description: 'Sweet pastry with a buttery filling.',
    category: 'bakery',
    subCategory: 'pastries',
    productCategory: 'croissants',
    availability: '30',
    deliveryOption: DeliveryOption.nextDay,
  },
  {
    key: 'cake',
    vendor: 'bakery',
    name: 'Honey Cake',
    unit: Unit.quantity,
    minQuantity: 1,
    price: 9000,
    description: 'Layered honey cake, made to order.',
    category: 'bakery',
    subCategory: 'cakes',
    productCategory: 'birthday-cakes',
    availability: '5',
    deliveryOption: DeliveryOption.weekEnd,
  },
  {
    // Left unapproved so the admin moderation queue has something in it.
    key: 'cookies',
    vendor: 'bakery',
    name: 'Walnut Cookies',
    unit: Unit.gram,
    minQuantity: 250,
    price: 4,
    description: 'Crunchy cookies with Armenian walnuts.',
    category: 'snacks',
    subCategory: 'cookies-biscuits',
    productCategory: 'oatmeal-cookies',
    availability: 'unlimited',
    deliveryOption: DeliveryOption.nextDay,
    approved: false,
  },
];

type OrderSeed = {
  buyer: string;
  status: OrderStatus;
  daysAgo: number;
  items: { product: string; quantity: number }[];
  reviews?: { product: string; stars: number; comment: string }[];
};

const ordersData: OrderSeed[] = [
  {
    buyer: 'alice',
    status: OrderStatus.delivered,
    daysAgo: 14,
    items: [
      { product: 'apples', quantity: 3 },
      { product: 'lavash', quantity: 4 },
    ],
    reviews: [
      { product: 'apples', stars: 5, comment: 'Very sweet and fresh.' },
      { product: 'lavash', stars: 4, comment: 'Good, a bit dry next day.' },
    ],
  },
  {
    buyer: 'bob',
    status: OrderStatus.delivered,
    daysAgo: 10,
    items: [
      { product: 'apples', quantity: 2 },
      { product: 'cheese', quantity: 1 },
      { product: 'cake', quantity: 1 },
    ],
    reviews: [
      { product: 'apples', stars: 4, comment: 'Nice apples.' },
      { product: 'cake', stars: 5, comment: 'Best honey cake in town!' },
    ],
  },
  {
    buyer: 'alice',
    status: OrderStatus.processing,
    daysAgo: 2,
    items: [
      { product: 'eggs', quantity: 20 },
      { product: 'matsun', quantity: 2 },
    ],
  },
  {
    buyer: 'bob',
    status: OrderStatus.pending,
    daysAgo: 0,
    items: [
      { product: 'tomatoes', quantity: 1.5 },
      { product: 'gata', quantity: 2 },
    ],
  },
];

// Status path an order walks through to reach `status`.
const STATUS_FLOW = [
  OrderStatus.pending,
  OrderStatus.processing,
  OrderStatus.delivered,
];

async function wipe(em: EntityManager): Promise<void> {
  const old = await em.find(Users, {
    where: { email: Like(`%${EMAIL_DOMAIN}`) },
    select: { id: true },
  });
  if (!old.length) return;
  const ids = old.map((u) => u.id);

  const orders = await em.find(Order, {
    where: { userId: In(ids) },
    select: { id: true },
  });
  const orderIds = orders.map((o) => o.id);
  if (orderIds.length) {
    await em.delete(Review, { orderId: In(orderIds) });
    await em.delete(Notification, { orderId: In(orderIds) });
    // order_products and order_status_history cascade.
    await em.delete(Order, { id: In(orderIds) });
  }
  await em.delete(Advertisement, { userId: In(ids) });
  await em.delete(Product, { userId: In(ids) });
  await em.delete(Users, { id: In(ids) });
  console.log(`Removed previous test data (${ids.length} users).`);
}

async function seed(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed test data with NODE_ENV=production');
  }

  await AppDataSource.initialize();
  const opts = AppDataSource.options as { host?: string; database?: string };
  console.log(`Seeding test data into ${opts.host}/${opts.database}…`);

  await AppDataSource.transaction(async (em) => {
    await wipe(em);

    const password = await bcrypt.hash(PASSWORD, 10);
    const users = new Map<string, Users>();
    for (const { key, ...u } of usersData) {
      const saved = await em.save(
        em.create(Users, {
          ...u,
          email: `${key}${EMAIL_DOMAIN}`,
          password,
          verified: true,
          verifiedAt: new Date(),
        }),
      );
      users.set(key, saved);
    }

    const products = new Map<string, Product>();
    for (const { key, vendor, ...p } of productsData) {
      const owner = users.get(vendor)!;
      const saved = await em.save(
        em.create(Product, {
          approved: true,
          ...p,
          userId: owner.id,
          userDisplayName: owner.displayName,
          userPhoto: owner.image ?? null,
          image: img(key),
        }),
      );
      products.set(key, saved);
    }

    for (const o of ordersData) {
      const buyer = users.get(o.buyer)!;
      const lines = o.items.map((i) => ({
        product: products.get(i.product)!,
        quantity: i.quantity,
      }));
      const createdAt = new Date(Date.now() - o.daysAgo * 86_400_000);

      const order = await em.save(
        em.create(Order, {
          userId: buyer.id,
          userPhone: buyer.phoneNumber ?? '',
          address: buyer.address ?? {},
          status: o.status,
          total: lines.reduce((s, l) => s + l.product.price * l.quantity, 0),
          vendorIds: [...new Set(lines.map((l) => l.product.userId))],
          productIds: lines.map((l) => l.product.id),
          paidAt: createdAt,
          createdAt,
        }),
      );

      const orderProducts = await em.save(
        lines.map((l) =>
          em.create(OrderProduct, {
            orderId: order.id,
            productId: l.product.id,
            vendorId: l.product.userId,
            name: l.product.name,
            unit: l.product.unit,
            price: l.product.price,
            image: l.product.image,
            description: l.product.description,
            quantity: l.quantity,
            status: o.status,
          }),
        ),
      );

      const steps = STATUS_FLOW.slice(0, STATUS_FLOW.indexOf(o.status) + 1);
      await em.save(
        steps.map((status, i) =>
          em.create(OrderStatusHistory, {
            orderId: order.id,
            userId: i === 0 ? buyer.id : order.vendorIds[0],
            status,
            createdAt: new Date(createdAt.getTime() + i * 86_400_000),
          }),
        ),
      );

      for (const vendorId of order.vendorIds) {
        await em.save(
          em.create(Notification, {
            userId: vendorId,
            orderId: order.id,
            productIds: lines
              .filter((l) => l.product.userId === vendorId)
              .map((l) => l.product.id),
            status:
              o.status === OrderStatus.pending ? o.status : OrderStatus.seen,
            createdAt,
          }),
        );
      }

      for (const r of o.reviews ?? []) {
        const product = products.get(r.product)!;
        const review = await em.save(
          em.create(Review, {
            productId: product.id,
            orderId: order.id,
            userId: buyer.id,
            userName: buyer.displayName,
            userPhoto: buyer.image ?? null,
            stars: r.stars,
            comment: r.comment,
          }),
        );
        const line = orderProducts.find((op) => op.productId === product.id)!;
        await em.update(
          OrderProduct,
          { id: line.id },
          { reviewRef: review.id },
        );
      }
    }

    // Same aggregate ProductsService.recomputeReviewAggregates maintains.
    await em.query(
      `UPDATE products p
          SET "avgReview" = agg.avg, "numberReview" = agg.cnt
         FROM (SELECT "productId", ROUND(AVG(stars)::numeric, 2) AS avg, COUNT(*) AS cnt
                 FROM reviews GROUP BY "productId") agg
        WHERE p.id = agg."productId" AND p.id = ANY($1)`,
      [[...products.values()].map((p) => p.id)],
    );

    await em.save([
      em.create(Advertisement, {
        userId: users.get('farm')!.id,
        image: img('ad-harvest'),
        headline: 'Autumn harvest is here',
        subheadline: 'Fresh apples and vegetables straight from the farm',
        cta: 'Shop now',
        link: '/products?category=groceries',
        approved: true,
      }),
      em.create(Advertisement, {
        userId: users.get('bakery')!.id,
        image: img('ad-cakes'),
        headline: 'Order a cake for the weekend',
        subheadline: 'Honey cake baked to order',
        cta: 'Order',
        link: '/products?category=bakery',
        approved: true,
      }),
      em.create(Advertisement, {
        userId: users.get('bakery')!.id,
        image: img('ad-cookies'),
        headline: 'New: walnut cookies',
        subheadline: null,
        cta: null,
        link: null,
        approved: false,
      }),
    ]);
  });

  console.log(`\nDone. All accounts use password "${PASSWORD}":`);
  for (const u of usersData) {
    console.log(`  ${(u.key + EMAIL_DOMAIN).padEnd(32)} ${u.type}`);
  }
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
