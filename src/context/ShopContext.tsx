'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Location } from '@prisma/client';
import { getLocations } from '@/lib/actions';

interface ShopContextType {
  selectedShopId: string;
  setSelectedShopId: (id: string) => void;
  shops: Location[];
  selectedShop: Location | undefined;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [shops, setShops] = useState<Location[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('');

  useEffect(() => {
    async function fetchShops() {
      const allLocations = await getLocations();
      const shopLocations = allLocations.filter(
        (loc) => loc.name.toLowerCase().includes('shop') || loc.name.toLowerCase().includes('mart')
      );
      setShops(shopLocations);
      // Only set initial shop if not already set (prevents reset on re-renders)
      if (shopLocations.length > 0 && !selectedShopId) {
        setSelectedShopId(shopLocations[0].id);
      }
    }
    fetchShops();
  }, []);

  const selectedShop = shops.find((s) => s.id === selectedShopId);

  return (
    <ShopContext.Provider value={{ selectedShopId, setSelectedShopId, shops, selectedShop }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
