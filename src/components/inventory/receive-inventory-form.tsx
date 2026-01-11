'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Product } from '@prisma/client';
import { getProductBySku, receiveInventory } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

interface ReceiveInventoryFormProps {
  locationId: string;
  onSuccess?: () => void;
}

export function ReceiveInventoryForm({ locationId, onSuccess }: ReceiveInventoryFormProps) {
  const router = useRouter();
  const [skuInput, setSkuInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (skuInput) {
        setIsSearching(true);
        try {
          const product = await getProductBySku(skuInput);
          setFoundProduct(product);
        } catch (error) {
          console.error('Error fetching product:', error);
          setFoundProduct(null);
        } finally {
          setIsSearching(false);
        }
      } else {
        setFoundProduct(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [skuInput]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundProduct || !quantityInput) return;

    setIsLoading(true);
    try {
      const quantityToAdd = parseInt(quantityInput);
      if (isNaN(quantityToAdd) || quantityToAdd <= 0) {
        alert('Please enter a valid quantity.');
        return;
      }

      await receiveInventory({
        productId: foundProduct.id,
        locationId: locationId,
        quantityToAdd: quantityToAdd,
      });

      alert('Inventory received successfully!');
      setSkuInput('');
      setQuantityInput('');
      setFoundProduct(null);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to receive inventory.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Receive Inventory</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <div className="relative">
              <Input
                id="sku"
                placeholder="Enter product SKU..."
                value={skuInput}
                onChange={(e) => setSkuInput(e.target.value)}
                required
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {foundProduct && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Product Name:</span>
                <span className="text-sm">{foundProduct.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">MoU:</span>
                <span className="text-sm">{foundProduct.uom}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Price:</span>
                <span className="text-sm">${Number(foundProduct.price).toFixed(2)}</span>
              </div>
            </div>
          )}

          {skuInput && !isSearching && !foundProduct && (
            <p className="text-sm text-destructive font-medium">No product found with this SKU.</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Add</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="0"
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              required
              disabled={!foundProduct}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={!foundProduct || !quantityInput || isLoading || isSearching}
            >
              {isLoading ? 'Processing...' : 'Receive Inventory'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Return
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
