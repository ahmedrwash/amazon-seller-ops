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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SourceLinkImportModal from '@/components/SourceLinkImportModal';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, ArrowRight, Save, Import, AlertCircle, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/hooks/useAuth';

export function CreateProductPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState("manual");
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importedJob, setImportedJob] = useState(null);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    product_name: '',
    brand: '',
    main_category: '',
    sub_category: '',
    notes: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImportSuccess = (result) => {
    const extracted = result.extracted || {};
    
    // Map extracted data to form fields
    setFormData({
      product_name: extracted.title || '',
      brand: extracted.brand || '',
      main_category: extracted.category || '',
      sub_category: extracted.sub_category || '',
      notes: extracted.description || ''
    });
    
    // Store job details for linking later
    if (result.job_id) {
      setImportedJob(result);
    }
    
    // Switch to manual tab to review/edit data
    setActiveTab("manual");
    
    toast({
      title: "Data Extracted",
      description: "Please review the imported details below before saving.",
    });
  };

  const handleReset = () => {
    setFormData({
      product_name: '',
      brand: '',
      main_category: '',
      sub_category: '',
      notes: ''
    });
    setImportedJob(null);
    setError(null);
    toast({
      title: "Form Reset",
      description: "All fields have been cleared."
    });
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!formData.product_name) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Create Product
      const productPayload = {
        ...formData,
        created_by: user.id,
        status: 'Active',
        owner_id: user.id
      };

      const { data: product, error: createError } = await supabase
        .from('products')
        .insert(productPayload)
        .select()
        .single();

      if (createError) throw createError;

      // 2. If we have an import job, link it to the new product
      if (importedJob && importedJob.job_id) {
        // We need to insert the job into DB if it doesn't exist, 
        // OR update it if the edge function already created a record (Edge function in this mock didn't insert to DB, just returned ID)
        
        // For this implementation, we will create a new import job record linking to the product
        // since our mock edge function didn't actually write to the database
        const { error: jobError } = await supabase
          .from('product_import_jobs')
          .insert({
            id: importedJob.job_id,
            product_id: product.id,
            source: importedJob.source || 'Import',
            source_url: importedJob.source_url || 'https://example.com', // Fallback as we didn't store URL in state
            status: 'completed',
            extracted_data: importedJob.extracted,
            created_by: user.id
          });
          
        if (jobError) {
          console.warn("Failed to save import job record, but product was created", jobError);
          // Don't block success flow for this
        }
      }

      toast({
        title: "Product Created",
        description: "Product has been successfully added to your catalog.",
      });

      navigate(`/products/${product.id}`);

    } catch (err) {
      console.error('Error creating product:', err);
      setError(err.message || "Failed to create product");
      toast({
        title: "Creation Failed",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 pb-20">
      <Helmet>
        <title>Create New Product - Amazon US Product Selector</title>
      </Helmet>
      
      <div className="max-w-4xl mx-auto space-y-8">
        <Header />
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Create New Product</h2>
            <p className="text-slate-400">Add a new product to your catalog manually or import from a marketplace.</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/products')} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Cancel
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>Product Details</CardTitle>
                  <CardDescription className="text-slate-400">
                    Enter the basic information for your new product.
                  </CardDescription>
                </div>
                {importedJob && (
                  <Button variant="ghost" size="sm" onClick={handleReset} className="text-slate-400 hover:text-white">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Form
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateProduct} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="product_name">Product Name <span className="text-red-500">*</span></Label>
                      <Input 
                        id="product_name" 
                        name="product_name" 
                        value={formData.product_name} 
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
                      <Label htmlFor="main_category">Main Category</Label>
                      <Input 
                        id="main_category" 
                        name="main_category" 
                        value={formData.main_category} 
                        onChange={handleInputChange} 
                        placeholder="e.g. Electronics"
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sub_category">Sub Category</Label>
                      <Input 
                        id="sub_category" 
                        name="sub_category" 
                        value={formData.sub_category} 
                        onChange={handleInputChange} 
                        placeholder="e.g. Audio"
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Description / Notes</Label>
                    <Textarea 
                      id="notes" 
                      name="notes" 
                      value={formData.notes} 
                      onChange={handleInputChange} 
                      placeholder="Product features, description, or internal notes..."
                      className="bg-slate-950 border-slate-800 min-h-[120px]"
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-800">
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
}

export default CreateProductPage;