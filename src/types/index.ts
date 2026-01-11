import { Product, StockLevel } from '@prisma/client';

export interface ProductWithStrings extends Omit<Product, 'cost' | 'price'> {
  cost: string;
  price: string;
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
