// src/lib/actions.ts
'use server';
import { prisma } from './prisma';
import { Product, Location, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { revalidatePath } from 'next/cache';
import { CartItem } from '@/types';

// --- GETTERS ---
export async function getProducts() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' }
  });
  
  const transformedProducts = products.map((product) => ({
    ...product,
    cost: product.cost.toString(),
    price: product.price.toString(),
  }));

  return transformedProducts;
}


export async function getLocationByName(name: string): Promise<Location | null> {
  return await prisma.location.findUnique({ where: { name } });
}

export async function getLocations(): Promise<Location[]> {
  return await prisma.location.findMany({ orderBy: { name: 'asc' } });
}

export async function getStockForLocation(locationId: string) {
  const stock = await prisma.stockLevel.findMany({
    where: { locationId },
    include: { product: true },
  });

  return stock.map(item => ({
    ...item,
    product: {
      ...item.product,
      cost: item.product.cost.toString(),
      price: item.product.price.toString(),
    }
  }));
}

export async function getLocationById(id: string): Promise<Location | null> {
  return await prisma.location.findUnique({ where: { id } });
}

export async function getProductBySku(sku: string): Promise<Product | null> {
  return await prisma.product.findUnique({ where: { sku } });
}

export async function receiveInventory(data: { productId: string; locationId: string; quantityToAdd: number }) {
  try {
    const stockLevel = await prisma.stockLevel.upsert({
      where: {
        productId_locationId: {
          productId: data.productId,
          locationId: data.locationId,
        },
      },
      update: {
        quantity: { increment: data.quantityToAdd },
      },
      create: {
        productId: data.productId,
        locationId: data.locationId,
        quantity: data.quantityToAdd,
      },
    });

    revalidatePath('/dashboard/products');
    revalidatePath('/dashboard/warehouse');
    revalidatePath('/dashboard/shop');
    revalidatePath(`/dashboard/inventory/receive/${data.locationId}`);
    
    return { success: true, stockLevel };
  } catch (error: any) {
    console.error('Failed to receive inventory:', error);
    throw new Error(error.message || 'Failed to receive inventory.');
  }
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

export async function createProduct(data: { name: string; sku: string; cost: number | string | Decimal; price: number | string | Decimal; uom: string; initialStock?: number }) {
  const cost = new Decimal(data.cost.toString());
  const price = new Decimal(data.price.toString());
  const { initialStock, ...productData } = data;

  const product = await prisma.$transaction(async (tx) => {
    const newProduct = await tx.product.create({
      data: { ...productData, cost, price }
    });

    if (initialStock && initialStock > 0) {
      const warehouse = await tx.location.findUnique({ where: { name: 'Warehouse' } });
      if (warehouse) {
        await tx.stockLevel.create({
          data: {
            productId: newProduct.id,
            locationId: warehouse.id,
            quantity: initialStock
          }
        });
      }
    }
    return newProduct;
  });

  revalidatePath('/dashboard/products');
  revalidatePath('/dashboard/warehouse');
  return product;
}

export async function updateProduct(id: string, data: { name?: string; sku?: string; cost?: number | string | Decimal; price?: number | string | Decimal; uom?: string }) {
  const { cost, price, ...rest } = data;
  const updateData: Prisma.ProductUpdateInput = { ...rest };
  
  if (cost !== undefined) {
    updateData.cost = new Decimal(cost.toString());
  }
  if (price !== undefined) {
    updateData.price = new Decimal(price.toString());
  }

  const product = await prisma.product.update({
    where: { id },
    data: updateData
  });
  revalidatePath('/dashboard/products');
  return product;
}

export async function deleteProduct(id: string) {
  const product = await prisma.product.delete({ where: { id } });
  revalidatePath('/dashboard/products');
  return product;
}

export async function createExpense(description: string, amount: number | string | Decimal) {
  const expense = await prisma.expense.create({
    data: {
      description,
      amount: new Decimal(amount.toString())
    }
  });
  revalidatePath('/dashboard/accounting');
  return expense;
}

// --- CORE LOGIC ---

// ... your other actions

export async function addStockToWarehouse(productId: string, quantityToAdd: number) {
  // 1. Find the "Warehouse" location
  const warehouse = await prisma.location.findUnique({
    where: { name: 'Warehouse' },
  });

  if (!warehouse) {
    throw new Error('Warehouse location not found. Please create a location named "Warehouse".');
  }

  // 2. Use upsert to either update existing inventory or create a new record
  await prisma.inventory.upsert({
    where: {
      productId_locationId: {
        productId: productId,
        locationId: warehouse.id,
      },
    },
    update: {
      quantity: {
        increment: quantityToAdd, // This is the magic! It adds to the existing value.
      },
    },
    create: {
      productId: productId,
      locationId: warehouse.id,
      quantity: quantityToAdd,
    },
  });

  // 3. Revalidate the products page to show the new quantity
  revalidatePath('/dashboard/products');
}

// src/lib/actions.ts

// ... your other actions

export async function getProductsWithWarehouseQuantity() {
  // 1. Find the warehouse ID
  const warehouse = await prisma.location.findUnique({
    where: { name: 'Warehouse' },
  });

  if (!warehouse) {
    // If no warehouse, return products without quantity info
    const products = await prisma.product.findMany({ orderBy: { name: 'asc' } });
    return products.map(product => ({
      ...product,
      cost: product.cost.toString(),
      price: product.price.toString(),
      warehouseQuantity: 0
    }));
  }

  // 2. Fetch all products and include their inventory specific to the warehouse
  const products = await prisma.product.findMany({
    include: {
      StockLevels: {
        where: {
          locationId: warehouse.id,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  // 3. Transform the data to be easier to use on the frontend
  const transformedProducts = products.map((product) => ({
    ...product,
    cost: product.cost.toString(),
    price: product.price.toString(),
    warehouseQuantity: product.StockLevels.length > 0 ? product.StockLevels[0].quantity : 0,
  }));

  return transformedProducts;
}


export async function createSaleWithItems(cartItems: CartItem[], locationId: string) {
  // Use Decimal for total amount calculation
  const totalAmount = cartItems.reduce(
    (sum, item) => sum.add(new Decimal(item.price.toString()).mul(item.quantity)),
    new Decimal(0)
  );

  try {
    await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({ 
        data: { totalAmount } 
      });

      for (const item of cartItems) {
        // Create sale item record
        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            productId: item.id,
            locationId: locationId,
            quantity: item.quantity,
            priceAtSale: new Decimal(item.price.toString()),
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

    revalidatePath('/dashboard/pos');
    revalidatePath('/dashboard/shop');
    revalidatePath('/dashboard/accounting');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error: any) {
    console.error('Transaction failed:', error);
    throw new Error(error.message || 'Failed to process sale.');
  }
}
