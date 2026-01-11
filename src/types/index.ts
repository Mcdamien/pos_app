import { Product, StockLevel } from '@prisma/client';

export interface ProductWithStrings {
  id: string;
  name: string;
  sku: string;
  cost: string;
  price: string;
  uom: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductWithInventory extends ProductWithStrings {
  warehouseQuantity: number;
}

export interface StockLevelWithProduct extends StockLevel {
  product: ProductWithStrings;
}

export interface CartItem extends ProductWithStrings {
  quantity: number;
}
