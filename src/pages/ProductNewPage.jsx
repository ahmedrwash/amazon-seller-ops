import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SourceLinkImportModal from '@/components/SourceLinkImportModal';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, ArrowRight, Save, Import } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/hooks/useAuth';

const ProductNewPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");
  const [showImportModal, setShowImportModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    sku: '',
    description: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImportSuccess = (job) => {
    if (job?.extracted_data) {
      setFormData({
        name: job.extracted_data.title || '',
        brand: job.extracted_data.brand || '',
        category: job.extracted_data.category || '',
        sku: job.extracted_data.asin || job.extracted_data.sku || '',
        description: job.extracted_data.description || ''
      });
      setActiveTab("manual");
      toast({
        title: "Data Pre-filled",
        description: "Form populated with imported product data. Please review and save.",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Map form data to database columns
      const productPayload = {
        product_name: formData.name,
        brand: formData.brand,
        main_category: formData.category,
        notes: formData.description,
        created_by: user.id,
        status: 'Active' // Default status
        // Note: SKU is not in the basic products table schema provided, 
        // typically it would go to a variants table or custom field.
        // For now we omit SKU from the DB insert to avoid errors, 
        // or put it in notes if needed.
      };

      const { data, error } = await supabase
        .from('products')
        .insert(productPayload)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Product Created",
        description: "Product has been successfully created.",
      });

      navigate(`/products/${data.id}`);
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 pb-20">
      <Helmet>
        <title>New Product - Amazon US Product Selector</title>
      </Helmet>
      
      <div className="max-w-4xl mx-auto space-y-8">
        <Header />
        
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Create New Product</h2>
          <p className="text-slate-400">Add a new product to your catalog manually or import from a marketplace.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="manual" className="data-[state=active]:bg-[hsl(var(--terracotta))] data-[state=active]:text-white">
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="import" className="data-[state=active]:bg-[hsl(var(--terracotta))] data-[state=active]:text-white">
              Import from Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <Card className="bg-slate-900 border-slate-800 text-slate-100">
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
                <CardDescription className="text-slate-400">
                  Enter the basic information for your new product.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name <span className="text-red-500">*</span></Label>
                      <Input 
                        id="name" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleInputChange} 
                        placeholder="e.g. Wireless Noise Cancelling Headphones"
                        className="bg-slate-950 border-slate-800"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="brand">Brand</Label>
                      <Input 
                        id="brand" 
                        name="brand" 
                        value={formData.brand} 
                        onChange={handleInputChange} 
                        placeholder="e.g. Sony"
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input 
                        id="category" 
                        name="category" 
                        value={formData.category} 
                        onChange={handleInputChange} 
                        placeholder="e.g. Electronics"
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU / ASIN</Label>
                      <Input 
                        id="sku" 
                        name="sku" 
                        value={formData.sku} 
                        onChange={handleInputChange} 
                        placeholder="e.g. B08H5..."
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      value={formData.description} 
                      onChange={handleInputChange} 
                      placeholder="Product main features and description..."
                      className="bg-slate-950 border-slate-800 min-h-[120px]"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white min-w-[150px]"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Create Product
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import">
            <Card className="bg-slate-900 border-slate-800 text-slate-100">
              <CardHeader>
                <CardTitle>Import from Marketplace</CardTitle>
                <CardDescription className="text-slate-400">
                  Automatically extract product details from a supported marketplace URL.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
                <div className="p-4 rounded-full bg-slate-800/50 border border-slate-700">
                  <Import className="w-12 h-12 text-[hsl(var(--terracotta))]" />
                </div>
                <div className="text-center max-w-md space-y-2">
                  <h3 className="text-lg font-medium text-white">Supported Sources</h3>
                  <p className="text-slate-400">
                    We support importing from Amazon, Alibaba, AliExpress, and Temu. 
                    Paste the product link to get started.
                  </p>
                </div>
                <Button 
                  onClick={() => setShowImportModal(true)}
                  size="lg"
                  className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Enter Product URL
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <SourceLinkImportModal 
          open={showImportModal} 
          onOpenChange={setShowImportModal}
          productId={null}
          onSuccess={handleImportSuccess}
        />
      </div>
    </div>
  );
};

export default ProductNewPage;