// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const locations = [
  { name: 'Pharmacy Shop', description: 'Pharmacy retail location' },
  { name: 'SuperMart', description: 'Supermarket retail location' },
  { name: 'Warehouse', description: 'Central warehouse for stock distribution' },
];

const products = [
  { sku: 'LAPTOP-001', name: 'ProBook Laptop 15"', cost: 800.00, price: 1299.99, uom: 'pcs' },
  { sku: 'MOUSE-002', name: 'Wireless Mouse', cost: 10.00, price: 25.50, uom: 'pcs' },
  { sku: 'KEY-003', name: 'Mechanical Keyboard', cost: 40.00, price: 75.00, uom: 'pcs' },
  { sku: 'MON-004', name: '4K Monitor 27"', cost: 200.00, price: 350.00, uom: 'pcs' },
  { sku: 'CABLE-005', name: 'HDMI Cable 2m', cost: 5.00, price: 15.00, uom: 'pcs' },
];

async function main() {
  console.log('Start seeding...');

  // Create locations
  for (const loc of locations) {
    await prisma.location.upsert({ 
      where: { name: loc.name }, 
      update: {}, 
      create: loc 
    });
  }

  // Create products
  for (const prod of products) {
    await prisma.product.upsert({ 
      where: { sku: prod.sku }, 
      update: {
        cost: prod.cost,
        price: prod.price,
        uom: prod.uom
      }, 
      create: prod 
    });
  }

  // Use findUniqueOrThrow - available and preferred in Prisma 6 for seeds
  const warehouse = await prisma.location.findUniqueOrThrow({ where: { name: 'Warehouse' } });
  const allProducts = await prisma.product.findMany();

  // Seed stock levels
  for (const product of allProducts) {
    // Warehouse stock: 200 units each as requested
    await prisma.stockLevel.upsert({
      where: { productId_locationId: { productId: product.id, locationId: warehouse.id } },
      update: { quantity: 200 },
      create: { productId: product.id, locationId: warehouse.id, quantity: 200 },
    });
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
