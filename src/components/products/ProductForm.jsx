import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts } from '@/hooks/useProducts';
import { PRODUCT_STAGES, PRIORITY_LEVELS, PRODUCT_STATUS } from '@/constants/productConstants';
import { useToast } from '@/components/ui/use-toast';

const ProductForm = ({ productId, initialData }) => {
  const navigate = useNavigate();
  const { createProduct, updateProduct, loading } = useProducts();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    product_name: '',
    brand: '',
    main_category: '',
    sub_category: '',
    notes: '',
    status: 'Active'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        product_name: initialData.product_name || '',
        brand: initialData.brand || '',
        main_category: initialData.main_category || '',
        sub_category: initialData.sub_category || '',
        notes: initialData.notes || '',
        status: initialData.status || 'Active'
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.product_name) {
      toast({ title: "Validation Error", description: "Product name is required", variant: "destructive" });
      return;
    }

    try {
      if (productId) {
        const success = await updateProduct(productId, formData);
        if (success) navigate(`/products/${productId}`);
      } else {
        const newProduct = await createProduct(formData);
        if (newProduct) navigate(`/products/${newProduct.id}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6 bg-slate-900 rounded-lg border border-slate-700">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="product_name">Product Name *</Label>
          <Input
            id="product_name"
            name="product_name"
            value={formData.product_name}
            onChange={handleChange}
            placeholder="e.g. Wireless Headphones"
            className="bg-slate-800 border-slate-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="Brand Name"
              className="bg-slate-800 border-slate-600"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(val) => handleSelectChange('status', val)}
            >
              <SelectTrigger className="bg-slate-800 border-slate-600">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_STATUS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="main_category">Main Category</Label>
            <Select
              value={formData.main_category}
              onValueChange={(val) => handleSelectChange('main_category', val)}
            >
              <SelectTrigger className="bg-slate-800 border-slate-600">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Home & Kitchen">Home & Kitchen</SelectItem>
                <SelectItem value="Beauty">Beauty</SelectItem>
                <SelectItem value="Toys">Toys</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sub_category">Sub Category</Label>
             <Input
              id="sub_category"
              name="sub_category"
              value={formData.sub_category}
              onChange={handleChange}
              placeholder="Sub Category"
              className="bg-slate-800 border-slate-600"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Product notes..."
            className="bg-slate-800 border-slate-600 min-h-[100px]"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
          {loading ? 'Saving...' : (productId ? 'Update Product' : 'Create Product')}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;