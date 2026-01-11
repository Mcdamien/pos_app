'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getLocations, getStockForLocation } from '@/lib/actions';
import { Location, Product } from '@prisma/client';
import { Loader2 } from 'lucide-react';
import { StockLevelWithProduct } from '@/types';

export function InventoryView() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [inventory, setInventory] = useState<StockLevelWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchLocations() {
      const data = await getLocations();
      setLocations(data);
    }
    fetchLocations();
  }, []);

  useEffect(() => {
    async function fetchInventory() {
      if (!selectedLocationId) {
        setInventory([]);
        return;
      }
      setIsLoading(true);
      try {
        const data = await getStockForLocation(selectedLocationId);
        // Cast to StockLevelWithProduct since we know we included 'product'
        setInventory(data as unknown as StockLevelWithProduct[]);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInventory();
  }, [selectedLocationId]);

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="flex flex-col items-center space-y-4">
        <CardTitle className="text-2xl font-bold">Inventory Search</CardTitle>
        <div className="w-full max-w-xs">
          <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a shop location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !selectedLocationId ? (
          <div className="text-center py-12 text-muted-foreground">
            Please select a location to view its inventory.
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No inventory found for this location.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>MoU</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => (
                <TableRow key={item.productId}>
                  <TableCell className="font-mono">{item.product.sku}</TableCell>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell>{item.product.uom}</TableCell>
                  <TableCell className="font-bold">{item.quantity}</TableCell>
                  <TableCell>${Number(item.product.cost).toFixed(2)}</TableCell>
                  <TableCell>${Number(item.product.price).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
