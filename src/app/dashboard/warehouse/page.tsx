import InventoryPage from "../_components/inventory-page";
import { prisma } from "@/lib/prisma";

export default async function WarehousePage() {
  const warehouse = await prisma.location.findUnique({ where: { name: 'Warehouse' } });
  
  if (!warehouse) {
    return <div>Warehouse location not found. Please seed the database.</div>;
  }

  return <InventoryPage locationId={warehouse.id} locationName={warehouse.name} />;
}
