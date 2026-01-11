import { Product } from '@prisma/client';

export interface CartItem extends Product {
  quantity: number;
}
