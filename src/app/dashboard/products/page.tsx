'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Product } from '@prisma/client';
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/lib/actions';
import { Plus, ArrowLeftRight, PackagePlus } from 'lucide-react';
import { ShopSelector } from '@/components/shop-selector';
import { useShop } from '@/context/ShopContext';
import { ReceiveInventoryForm } from '@/components/inventory/receive-inventory-form';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const { selectedShopId } = useShop();
  const [formData, setFormData] = useState({ name: '', sku: '', cost: '', price: '', uom: 'Unit' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const generateSKU = () => {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SKU-${random}`;
  };

  const fetchProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isEditing) {
        await updateProduct(isEditing, {
          name: formData.name,
          sku: formData.sku,
          cost: parseFloat(formData.cost),
          price: parseFloat(formData.price),
          uom: formData.uom,
        });
      } else {
        await createProduct({
          name: formData.name,
          sku: formData.sku,
          cost: parseFloat(formData.cost),
          price: parseFloat(formData.price),
          uom: formData.uom,
        });
      }
      resetForm();
      setIsOpen(false);
      await fetchProducts();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', sku: '', cost: '', price: '', uom: 'Unit' });
    setIsEditing(null);
  };

  const handleEdit = (product: any) => {
    setIsEditing(product.id);
    setFormData({
      name: product.name,
      sku: product.sku,
      cost: product.cost?.toString() || '0',
      price: product.price?.toString() || '0',
      uom: product.uom,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id);
      await fetchProducts();
    }
  };

  const openNewProductModal = () => {
    resetForm();
    setFormData(prev => ({ ...prev, sku: generateSKU() }));
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex-1 space-y-1">
            <CardTitle>Product Management</CardTitle>
            <p className="text-sm text-muted-foreground">Manage your product catalog and inventory</p>
          </div>
          
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border">
              <label className="text-sm font-bold whitespace-nowrap text-primary">Select shop</label>
              <ShopSelector />
            </div>
          </div>

          <div className="flex-1 flex justify-end gap-2">
            <Button variant="outline" onClick={() => alert('Transfer modal coming soon')}>
              <ArrowLeftRight className="mr-2 h-4 w-4" /> Transfer
            </Button>

            <Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
              <DialogTrigger asChild>
                <Button disabled={!selectedShopId}>
                  <PackagePlus className="mr-2 h-4 w-4" /> Receive Stock
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Receive Inventory</DialogTitle>
                </DialogHeader>
                <ReceiveInventoryForm 
                  locationId={selectedShopId} 
                  onSuccess={() => {
                    setIsReceiveOpen(false);
                    fetchProducts();
                  }}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={isOpen} onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) resetForm();
            }}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium">Name</label>
                    <Input
                      className="col-span-3"
                      placeholder="Product Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium">SKU</label>
                    <div className="col-span-3 flex gap-2">
                      <Input
                        placeholder="SKU"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        required
                      />
                      {!isEditing && (
                        <Button type="button" variant="outline" size="sm" onClick={() => setFormData({ ...formData, sku: generateSKU() })}>
                          Gen
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium">MoU</label>
                    <Input
                      className="col-span-3"
                      placeholder="pcs/kg"
                      value={formData.uom}
                      onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium">Cost</label>
                    <Input
                      className="col-span-3"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium">Price</label>
                    <Input
                      className="col-span-3"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isLoading}>
                      {isEditing ? 'Update Product' : 'Create Product'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>MoU</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No products found. Add your first product to get started.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.sku}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.warehouseQuantity}</TableCell>
                    <TableCell>{product.uom}</TableCell>
                    <TableCell>${Number(product.cost).toFixed(2)}</TableCell>
                    <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
