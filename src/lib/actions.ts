// src/lib/actions.ts
'use server';
import { prisma } from '@/lib/prisma';
import { Product, Location } from '@prisma/client';

// --- GETTERS ---
export async function getProducts(): Promise<Product[]> {
  return await prisma.product.findMany({ orderBy: { name: 'asc' } });
}

export async function getLocationByName(name: string): Promise<Location | null> {
  return await prisma.location.findUnique({ where: { name } });
}

export async function getStockForLocation(locationName: string) {
  const location = await prisma.location.findUnique({ where: { name: locationName } });
  if (!location) return [];
  
  return await prisma.stockLevel.findMany({
    where: { locationId: location.id },
    include: { product: true },
  });
}

export async function getSales() {
  return await prisma.sale.findMany({
    orderBy: { createdAt: 'desc' },
    include: { 
      SaleItems: { 
        include: { product: { select: { name: true } } } 
      } 
    },
  });
}

export async function getExpenses() {
  return await prisma.expense.findMany({ orderBy: { createdAt: 'desc' } });
}

// --- CORE LOGIC ---
// Define CartItem type for the action file
interface CartItem extends Product {
  quantity: number;
}

export async function createSaleWithItems(cartItems: CartItem[], locationId: string) {
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  try {
    await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({ data: { totalAmount } });

      for (const item of cartItems) {
        // Create sale item record
        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            productId: item.id,
            locationId: locationId, // IMPORTANT: Link to the shop location
            quantity: item.quantity,
            priceAtSale: item.price,
          },
        });

        // Decrement stock from the specific location
        const stockLevel = await tx.stockLevel.findUnique({
          where: { productId_locationId: { productId: item.id, locationId: locationId } },
        });

        if (!stockLevel || stockLevel.quantity < item.quantity) {
          throw new Error(`Insufficient stock for product: ${item.name}`);
        }

        await tx.stockLevel.update({
          where: { productId_locationId: { productId: item.id, locationId: locationId } },
          data: { quantity: { decrement: item.quantity } },
        });
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Transaction failed:', error);
    throw new Error(error.message || 'Failed to process sale.');
  }
}