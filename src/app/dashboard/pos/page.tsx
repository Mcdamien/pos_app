// src/app/dashboard/pos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Product, Location } from '@prisma/client';
import { getProducts, getLocationByName, createSaleWithItems } from '@/lib/actions';

interface CartItem extends Product {
  quantity: number;
}

export default function POSTerminalPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [shopLocation, setShopLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const productList = await getProducts();
      const location = await getLocationByName('Downtown Shop');
      setProducts(productList);
      setShopLocation(location);
    };
    fetchData();
  }, []);

  const addToCart = (product: Product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);
      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== productId));
  };
  
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
  };

  const handleCheckout = async () => {
    if (!shopLocation || cart.length === 0) {
      alert('Cannot process sale. Location not loaded or cart is empty.');
      return;
    }
    setIsLoading(true);
    try {
      await createSaleWithItems(cart, shopLocation.id);
      alert('Sale successful!');
      setCart([]);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-gray-100 p-4 gap-4">
      {/* Product List */}
      <div className="w-2/3 bg-white rounded-lg shadow-md p-4 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => addToCart(product)}>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">{product.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xl font-semibold text-green-600">${product.price.toFixed(2)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="w-1/3 bg-white rounded-lg shadow-md p-4 flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Current Sale</h2>
        <div className="flex-grow overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">Your cart is empty.</p>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                    <Button size="sm" variant="destructive" onClick={() => removeFromCart(item.id)}>X</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between text-xl font-bold mb-4">
            <span>Total:</span>
            <span>${calculateTotal()}</span>
          </div>
          <Button onClick={handleCheckout} className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Process Sale'}
          </Button>
        </div>
      </div>
    </div>
  );
}