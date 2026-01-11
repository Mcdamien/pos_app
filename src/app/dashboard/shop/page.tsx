'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StockLevel, Product, Location } from '@prisma/client';
import { getLocations, getStockForLocation } from '@/lib/actions';
import { ReceiveInventoryForm } from '@/components/inventory/receive-inventory-form';
import { PackagePlus } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { ShopSelector } from '@/components/shop-selector';

export default function ShopPage() {
  const { selectedShopId, shops: locations } = useShop();
  const [inventory, setInventory] = useState<(StockLevel & { product: Product })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

  const refreshInventory = async () => {
    if (selectedShopId) {
      setIsLoading(true);
      const stock = await getStockForLocation(selectedShopId);
      setInventory(stock);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshInventory();
  }, [selectedShopId]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex-1 space-y-1">
            <CardTitle>Shop Inventory</CardTitle>
            <p className="text-sm text-muted-foreground">
              Current Location: {locations.find(l => l.id === selectedShopId)?.name || 'None selected'}
            </p>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border">
              <label className="text-sm font-bold whitespace-nowrap text-primary">Select shop</label>
              <ShopSelector />
            </div>
          </div>

          <div className="flex-1 flex justify-end">
            <Dialog open={isReceiveModalOpen} onOpenChange={setIsReceiveModalOpen}>
              <DialogTrigger asChild>
                <Button disabled={!selectedShopId}>
                  <PackagePlus className="mr-2 h-4 w-4" /> Receive Stock
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Receive Inventory for {locations.find(l => l.id === selectedShopId)?.name}</DialogTitle>
              </DialogHeader>
              <ReceiveInventoryForm 
                locationId={selectedShopId} 
                onSuccess={() => {
                  setIsReceiveModalOpen(false);
                  refreshInventory();
                }} 
              />
            </DialogContent>
          </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading inventory...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>MoU</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No inventory found for this location.
                    </TableCell>
                  </TableRow>
                ) : (
                  inventory.map((item: StockLevel & { product: Product }) => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium">{item.product.sku}</TableCell>
                      <TableCell>{item.product.name}</TableCell>
                      <TableCell>${Number(item.product.cost).toFixed(2)}</TableCell>
                      <TableCell>${Number(item.product.price).toFixed(2)}</TableCell>
                      <TableCell>{item.product.uom}</TableCell>
                      <TableCell className={`text-right font-semibold ${item.quantity < 10 ? 'text-red-500' : ''}`}>
                        {item.quantity}
                        {item.quantity < 10 && <span className="ml-2 text-[10px] uppercase">Low</span>}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
