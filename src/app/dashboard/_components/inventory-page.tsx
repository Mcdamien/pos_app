// src/app/dashboard/_components/inventory-page.tsx

import { StockLevel } from "@prisma/client"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStockForLocation } from "@/lib/actions";
import { StockLevelWithProduct } from "@/types";

interface InventoryPageProps {
  locationId: string;
  locationName: string;
}

export default async function InventoryPage({ locationId, locationName }: InventoryPageProps) {
  const inventory: StockLevelWithProduct[] = await getStockForLocation(locationId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{locationName} Inventory</CardTitle>
      </CardHeader>
      <CardContent>
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
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No stock found for this location. Please ensure the database is seeded.
                </TableCell>
              </TableRow>
            ) : (
              inventory.map((item: StockLevelWithProduct) => (
                <TableRow key={item.productId}>
                  <TableCell className="font-medium">{item.product.sku}</TableCell>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell>${Number(item.product.cost).toFixed(2)}</TableCell>
                  <TableCell>${Number(item.product.price).toFixed(2)}</TableCell>
                  <TableCell>{item.product.uom}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
