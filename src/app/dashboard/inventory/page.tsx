'use client';

import { InventoryView } from '@/components/inventory-view';

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
      </div>
      <InventoryView />
    </div>
  );
}
