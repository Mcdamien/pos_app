// src/app/dashboard/_components/inventory-page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStockForLocation } from "@/lib/actions";

interface InventoryPageProps {
  locationName: string;
}

export default async function InventoryPage({ locationName }: InventoryPageProps) {
  const inventory = await getStockForLocation(locationName);

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
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.productId}>
                <TableCell className="font-medium">{item.product.sku}</TableCell>
                <TableCell>{item.product.name}</TableCell>
                <TableCell>${item.product.price.toFixed(2)}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}