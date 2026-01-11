// src/app/dashboard/pos/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Product, Location, StockLevel } from '@prisma/client';
import { getProducts, getLocations, createSaleWithItems, getStockForLocation } from '@/lib/actions';
import { CartItem } from '@/types';
import { ShoppingCart, Minus, Plus, X } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { ShopSelector } from '@/components/shop-selector';

export default function POSTerminalPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const { selectedShopId: selectedLocationId, shops: locations } = useShop();
  const [stockLevels, setStockLevels] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const productList = await getProducts();
      setProducts(productList);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedLocationId) {
      const fetchStock = async () => {
        const stock = await getStockForLocation(selectedLocationId);
        const levels: Record<string, number> = {};
        stock.forEach((s: StockLevel) => {
          levels[s.productId] = s.quantity;
        });
        setStockLevels(levels);
      };
      fetchStock();
    }
  }, [selectedLocationId]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const addToCart = (product: Product) => {
    const available = stockLevels[product.id] || 0;
    const inCart = cart.find(item => item.id === product.id)?.quantity || 0;

    if (inCart >= available) {
      alert('Cannot add more. Insufficient stock.');
      return;
    }

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

    const available = stockLevels[productId] || 0;
    if (newQuantity > available) {
      alert('Cannot increase quantity. Insufficient stock.');
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + Number(item.price) * item.quantity, 0).toFixed(2);
  };

  const handleCheckout = async () => {
    if (!selectedLocationId || cart.length === 0) {
      alert('Cannot process sale. Sale location not selected or cart is empty.');
      return;
    }
    setIsLoading(true);
    try {
      await createSaleWithItems(cart, selectedLocationId);
      alert('Sale successful!');
      setCart([]);
      
      // Refresh stock levels after sale
      const stock = await getStockForLocation(selectedLocationId);
      const levels: Record<string, number> = {};
      stock.forEach((s: StockLevel) => {
        levels[s.productId] = s.quantity;
      });
      setStockLevels(levels);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cartContent = (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-2 hidden lg:block text-center">Current Sale</h2>
      
      <div className="flex-grow overflow-y-auto min-h-0">
        {cart.length === 0 ? (
          <p className="text-gray-500 text-center mt-10">Your cart is empty.</p>
        ) : (
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-2 border rounded bg-card">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="font-medium truncate text-sm sm:text-base">{item.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">${Number(item.price).toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <Button size="icon" variant="outline" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                    <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <span className="w-5 sm:w-8 text-center text-xs sm:text-sm">{item.quantity}</span>
                  <Button size="icon" variant="outline" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => removeFromCart(item.id)}>
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="border-t pt-4 mt-4 bg-background">
        <div className="flex justify-between text-lg sm:text-xl font-bold mb-4">
          <span>Total:</span>
          <span>${calculateTotal()}</span>
        </div>
        <Button onClick={handleCheckout} className="w-full" size="lg" disabled={isLoading || !selectedLocationId}>
          {isLoading ? 'Processing...' : 'Process Sale'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-full lg:h-[calc(100vh-140px)] bg-muted/20 p-2 sm:p-4 gap-4 overflow-hidden">
      {/* Product List */}
      <Card className="w-full lg:w-2/3 flex flex-col min-h-0">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 gap-4">
          <div className="flex-1">
            <CardTitle>Products</CardTitle>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border">
              <label className="text-sm font-bold whitespace-nowrap text-primary">Select shop</label>
              <ShopSelector />
            </div>
          </div>

          <div className="flex-1 flex justify-end">
            <Input 
              className="w-full sm:max-w-xs" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto pr-2 pb-20 lg:pb-0">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {filteredProducts.map((product) => {
              const stock = stockLevels[product.id] || 0;
              return (
                <Card 
                  key={product.id} 
                  className={`cursor-pointer hover:shadow-md transition-shadow ${stock === 0 ? 'opacity-50 grayscale' : ''}`} 
                  onClick={() => stock > 0 && addToCart(product)}
                >
                  <CardHeader className="p-2 sm:p-4">
                    <CardTitle className="text-sm sm:text-base leading-tight line-clamp-2 h-10 sm:h-12">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-4 pt-0">
                    <p className="text-base sm:text-lg font-bold text-primary">${Number(product.price).toFixed(2)}</p>
                    <p className={`text-[10px] sm:text-xs mt-1 ${stock < 5 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                      Stock: {stock}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cart - Desktop */}
      <Card className="hidden lg:flex w-1/3 flex-col min-h-0">
        <CardContent className="p-4 pt-2 h-full">
          {cartContent}
        </CardContent>
      </Card>

      {/* Cart - Mobile Trigger */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="h-14 w-14 rounded-full shadow-2xl scale-110">
              <div className="relative">
                <ShoppingCart className="h-6 w-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-3 -right-3 bg-destructive text-destructive-foreground text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-background">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </div>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] sm:h-[70vh] px-4">
            <SheetHeader className="text-left mb-4">
              <SheetTitle>Current Sale</SheetTitle>
              <SheetDescription>
                Review items and process the sale.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-hidden h-full">
              {cartContent}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
