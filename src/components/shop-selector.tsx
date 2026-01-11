'use client';

import { useShop } from '@/context/ShopContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ShopSelector() {
  const { shops, selectedShopId, setSelectedShopId } = useShop();

  return (
    <Select value={selectedShopId} onValueChange={setSelectedShopId}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={shops.length === 0 ? "No shops found" : "Select Shop"} />
      </SelectTrigger>
      <SelectContent>
        {shops.map((shop) => (
          <SelectItem key={shop.id} value={shop.id}>
            {shop.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
