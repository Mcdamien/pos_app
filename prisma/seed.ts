// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const locations = [
  { name: 'Main Warehouse', description: 'Primary storage facility' },
  { name: 'Downtown Shop', description: 'Main retail storefront' },
];

const products = [
  { sku: 'LAPTOP-001', name: 'ProBook Laptop 15"', price: 1299.99 },
  { sku: 'MOUSE-002', name: 'Wireless Mouse', price: 25.50 },
  { sku: 'KEY-003', name: 'Mechanical Keyboard', price: 75.00 },
  { sku: 'MON-004', name: '4K Monitor 27"', price: 350.00 },
];

async function main() {
  console.log('Start seeding...');

  // Create locations
  for (const loc of locations) {
    await prisma.location.upsert({ where: { name: loc.name }, update: {}, create: loc });
  }

  // Create products
  for (const prod of products) {
    await prisma.product.upsert({ where: { sku: prod.sku }, update: {}, create: prod });
  }

  // Get created entities to link them
  const warehouse = await prisma.location.findUnique({ where: { name: 'Main Warehouse' } });
  const shop = await prisma.location.findUnique({ where: { name: 'Downtown Shop' } });
  const allProducts = await prisma.product.findMany();

  if (warehouse && shop && allProducts.length > 0) {
    // Seed stock levels for each product at each location
    for (const product of allProducts) {
      await prisma.stockLevel.upsert({
        where: { productId_locationId: { productId: product.id, locationId: warehouse.id } },
        update: { quantity: 100 }, // Keep warehouse well-stocked
        create: { productId: product.id, locationId: warehouse.id, quantity: 100 },
      });

      await prisma.stockLevel.upsert({
        where: { productId_locationId: { productId: product.id, locationId: shop.id } },
        update: { quantity: 10 }, // Less stock in the shop
        create: { productId: product.id, locationId: shop.id, quantity: 10 },
      });
    }
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });