
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { getCurrentUser } from '@/lib/auth';
import { useOpsHubData } from '@/hooks/useOpsHubData';
import { useWeeklyDataSave } from '@/hooks/useWeeklyDataSave';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2, Download, AlertCircle, RefreshCw, Plus, Package } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

import ProfitMarginTab from './ops/ProfitMarginTab';
import PPCACoSTab from './ops/PPCACoSTab';
import InventoryReorderTab from './ops/InventoryReorderTab';
import FBAFeeTab from './ops/FBAFeeTab';
import BreakEvenTab from './ops/BreakEvenTab';
import CashFlowTab from './ops/CashFlowTab';
import TariffCOGSTab from './ops/TariffCOGSTab';
import KPIsReportsTab from './ops/KPIsReportsTab';
import MilestonesTab from './ops/MilestonesTab';
import TaskManagementTab from './ops/TaskManagementTab';

export default function AmazonOpsHub() {
  const { toast } = useToast();
  
  // Auth and Access states
  const [user, setUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(true);
  
  // Data states
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [weeklyData, setWeeklyData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profit');

  // Product Creation States
  const [showCreateProductForm, setShowCreateProductForm] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductSku, setNewProductSku] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [creatingProduct, setCreatingProduct] = useState(false);

  const { loadWeeklyData, importPreviousWeekData } = useOpsHubData();
  const { saveWeeklyData, isSaving } = useWeeklyDataSave();

  const loadProducts = async () => {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (productsError) {
        console.error("Products load error:", productsError);
        setProducts([]);
        return [];
      }
      
      setProducts(productsData || []);
      return productsData || [];
    } catch (err) {
      console.error('Error loading products:', err);
      setProducts([]);
      return [];
    }
  };

  const verifyUserAccess = async () => {
    setLoadingAccess(true);
    setError(null);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated. Please log in.');
      setUser(currentUser);
      setHasAccess(true);
      const productsData = await loadProducts();
      if (productsData && productsData.length > 0) {
        setSelectedProductId(prev => prev || productsData[0].id);
      }
    } catch (err) {
      console.error('Access Verification Error:', err);
      setError(err.message || 'An error occurred during access verification.');
      setHasAccess(false);
    } finally {
      setLoadingAccess(false);
    }
  };

  useEffect(() => {
    verifyUserAccess();
  }, []); // run once on mount only

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedProductId || !hasAccess) return;
      setLoadingData(true);
      setError(null);
      try {
        const wData = await loadWeeklyData(selectedProductId, selectedWeek);
        setWeeklyData(wData || {});
      } catch (err) {
        console.error("Failed to load ops hub data:", err);
        setError("Failed to load product weekly data. Please try again.");
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [selectedProductId, selectedWeek, hasAccess, loadWeeklyData]);

  const handleSaveWeekly = async (section, updates) => {
    if (!selectedProductId) return;
    await saveWeeklyData(section, updates, selectedProductId, selectedWeek, weeklyData, (savedData) => {
      setWeeklyData(prev => ({ ...prev, ...updates, id: savedData?.id }));
    });
  };

  const handleImportPreviousWeek = async () => {
    if (selectedWeek === 1) {
      toast({ title: "Info", description: "You are already on week 1, there is no previous week.", variant: "default" });
      return;
    }
    
    setLoadingData(true);
    try {
      const saved = await importPreviousWeekData(selectedProductId, selectedWeek);
      setWeeklyData(saved || {});
      toast({ title: `Successfully imported data from Week ${selectedWeek - 1}` });
    } catch (err) {
      console.error("Error importing previous week:", err);
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setLoadingData(false);
    }
  };

  const createProduct = async () => {
    if (!newProductName.trim()) {
      toast({ title: "Validation Error", description: "Product Name is required.", variant: "destructive" });
      return;
    }

    setCreatingProduct(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) throw new Error("User not authenticated.");

      const { data, error: insertError } = await supabase
        .from('products')
        .insert({
          product_name: newProductName.trim(),
          sku: newProductSku.trim() || null,
          main_category: newProductCategory.trim() || null,
          created_by: currentUser.id,
          owner_id: currentUser.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({ title: "Success", description: "Product created successfully." });
      setNewProductName('');
      setNewProductSku('');
      setNewProductCategory('');
      setShowCreateProductForm(false);
      
      const updatedProducts = await loadProducts();
      setSelectedProductId(data.id);
    } catch (err) {
      console.error('Error creating product:', err);
      toast({ title: "Error creating product", description: err.message, variant: "destructive" });
    } finally {
      setCreatingProduct(false);
    }
  };

  const goToPreviousWeek = () => {
    if (selectedWeek > 1) setSelectedWeek(prev => prev - 1);
  };

  const goToNextWeek = () => {
    if (selectedWeek < 26) setSelectedWeek(prev => prev + 1);
  };

  const selectedProductObj = useMemo(() => 
    products.find(p => p.id === selectedProductId), 
  [products, selectedProductId]);

  const getShortProductName = (name) => {
    if (!name) return 'N/A';
    const words = name.split(' ');
    if (words.length <= 3) return name;
    return words.slice(0, 3).join(' ') + '...';
  };

  const isSavedWeek = weeklyData?.id;

  if (loadingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--parchment))]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--terracotta))] mx-auto mb-4" />
          <p className="text-sm opacity-70">Authenticating and loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess || error) {
    return (
      <div className="min-h-screen p-8 bg-[hsl(var(--parchment))]">
        <Alert variant="destructive" className="max-w-2xl mx-auto bg-white">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Error</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">{error || "Please log in to view this page."}</p>
            <Button variant="outline" onClick={verifyUserAccess} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" /> Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderCreateProductForm = () => {
    return (
      <div className="bg-white p-6 rounded-[var(--radius)] shadow-sm border border-[hsl(var(--border))] mb-6 animate-in fade-in slide-in-from-top-4">
        <h3 className="font-heading text-xl mb-4 text-[hsl(var(--cinder))]">Create New Product</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="newProductName">Product Name *</Label>
            <Input 
              id="newProductName" 
              placeholder="e.g. Modern Desk Lamp" 
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              className="text-slate-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newProductSku">SKU (Optional)</Label>
            <Input 
              id="newProductSku" 
              placeholder="e.g. MDL-001" 
              value={newProductSku}
              onChange={(e) => setNewProductSku(e.target.value)}
              className="text-slate-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newProductCategory">Category (Optional)</Label>
            <Input 
              id="newProductCategory" 
              placeholder="e.g. Home Office" 
              value={newProductCategory}
              onChange={(e) => setNewProductCategory(e.target.value)}
              className="text-slate-900"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowCreateProductForm(false)} disabled={creatingProduct}>
            Cancel
          </Button>
          <Button onClick={createProduct} disabled={creatingProduct} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta-light))] text-white">
            {creatingProduct ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Create Product
          </Button>
        </div>
      </div>
    );
  };

  const renderEmptyState = () => {
    return showCreateProductForm ? (
      renderCreateProductForm()
    ) : (
      <div className="flex flex-col items-center justify-center p-16 bg-white rounded-[var(--radius)] text-[hsl(var(--cinder))] shadow-sm border border-[hsl(var(--border))] max-w-2xl mx-auto mt-12 animate-in zoom-in-95">
        <div className="w-16 h-16 bg-[hsl(var(--stone-light))] rounded-full flex items-center justify-center mb-6">
          <Package className="w-8 h-8 text-[hsl(var(--terracotta))]" />
        </div>
        <h2 className="text-2xl font-heading mb-3">No Products Yet</h2>
        <p className="text-center opacity-70 mb-8 max-w-md">
          You haven't added any products to your workspace. Create your first product to start tracking profit, inventory, and operations data.
        </p>
        <Button 
          size="lg" 
          className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta-light))] text-white"
          onClick={() => setShowCreateProductForm(true)}
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Your First Product
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--parchment))] pb-12">
      <header className="bg-[hsl(var(--cinder))] text-[hsl(var(--parchment))] p-6 shadow-md mb-6">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl">Amazon Operations Hub</h1>
            <p className="opacity-80 font-mono-num text-sm mt-2">Comprehensive Profit, Inventory, and Launch Management System</p>
            
            {selectedProductObj && products.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-4 text-sm">
                <div><span className="opacity-60 text-xs uppercase tracking-wider block">Product</span><span className="font-medium" title={selectedProductObj.product_name}>{getShortProductName(selectedProductObj.product_name)}</span></div>
                <div><span className="opacity-60 text-xs uppercase tracking-wider block">SKU</span><span className="font-mono-num">{selectedProductObj.sku || 'N/A'}</span></div>
                <div><span className="opacity-60 text-xs uppercase tracking-wider block">Category</span><span>{selectedProductObj.main_category || 'N/A'}</span></div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-4 items-end">
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-64">
                <label className="text-xs opacity-80 block mb-1">Select Product</label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId} disabled={products.length === 0}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white h-10">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {getShortProductName(p.product_name)} {p.sku ? `(${p.sku})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <div>
                  <label className="text-xs opacity-80 block mb-1">Select Week</label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={goToPreviousWeek} disabled={selectedWeek === 1 || products.length === 0} className="h-10 w-10 bg-white/10 border-white/20 text-white hover:bg-white/20">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Select value={selectedWeek.toString()} onValueChange={(val) => setSelectedWeek(parseInt(val))} disabled={products.length === 0}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white h-10 w-32 relative">
                        <SelectValue />
                        {isSavedWeek && <CheckCircle2 className="w-3 h-3 text-[hsl(var(--green-light))] absolute left-2 top-3" />}
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(26)].map((_, i) => (
                          <SelectItem key={i+1} value={(i+1).toString()}>Week {i+1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={goToNextWeek} disabled={selectedWeek === 26 || products.length === 0} className="h-10 w-10 bg-white/10 border-white/20 text-white hover:bg-white/20">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <Button 
                  onClick={handleImportPreviousWeek} 
                  disabled={selectedWeek === 1 || isSaving || loadingData || products.length === 0}
                  className="ml-4 h-10 bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta-light))] text-white disabled:opacity-50"
                  title="Import data from previous week"
                >
                  <Download className="w-4 h-4 mr-2" />
                  📥 Import Week {selectedWeek > 1 ? selectedWeek - 1 : ''}
                </Button>

                {products.length > 0 && (
                  <Button 
                    onClick={() => setShowCreateProductForm(!showCreateProductForm)} 
                    variant="outline"
                    className="ml-2 h-10 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Product
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        {products.length > 0 && showCreateProductForm && renderCreateProductForm()}

        {products.length === 0 ? (
          renderEmptyState()
        ) : loadingData ? (
          <div className="flex justify-center p-24 bg-white rounded-[var(--radius)] shadow-sm border border-[hsl(var(--border))]">
            <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--terracotta))]" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start h-auto flex-wrap bg-transparent gap-2 mb-6 border-b border-[hsl(var(--border))] pb-2 rounded-none p-0">
              <TabsTrigger value="profit" className="data-[state=active]:bg-[hsl(var(--cinder))] data-[state=active]:text-white rounded-full">💰 Profit & Margin</TabsTrigger>
              <TabsTrigger value="ppc" className="data-[state=active]:bg-[hsl(var(--cinder))] data-[state=active]:text-white rounded-full">📢 PPC & ACoS</TabsTrigger>
              <TabsTrigger value="inventory" className="data-[state=active]:bg-[hsl(var(--cinder))] data-[state=active]:text-white rounded-full">📦 Inventory</TabsTrigger>
              <TabsTrigger value="fba" className="data-[state=active]:bg-[hsl(var(--cinder))] data-[state=active]:text-white rounded-full">🏷 FBA Fees</TabsTrigger>
              <TabsTrigger value="breakeven" className="data-[state=active]:bg-[hsl(var(--cinder))] data-[state=active]:text-white rounded-full">⚖️ Break-Even</TabsTrigger>
              <TabsTrigger value="cashflow" className="data-[state=active]:bg-[hsl(var(--cinder))] data-[state=active]:text-white rounded-full">📅 Cash Flow</TabsTrigger>
              <TabsTrigger value="tariff" className="data-[state=active]:bg-[hsl(var(--cinder))] data-[state=active]:text-white rounded-full">🌍 Tariff & COGS</TabsTrigger>
              <TabsTrigger value="kpi" className="data-[state=active]:bg-[hsl(var(--cinder))] data-[state=active]:text-white rounded-full">📋 KPIs & Reports</TabsTrigger>
              <TabsTrigger value="milestones" className="data-[state=active]:bg-[hsl(var(--cinder))] data-[state=active]:text-white rounded-full">📊 Milestones</TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-[hsl(var(--cinder))] data-[state=active]:text-white rounded-full">📝 Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="profit"><ProfitMarginTab weeklyData={weeklyData} onSaveWeekly={handleSaveWeekly} isSaving={isSaving} selectedWeek={selectedWeek} selectedProduct={selectedProductId} /></TabsContent>
            <TabsContent value="ppc"><PPCACoSTab weeklyData={weeklyData} onSaveWeekly={handleSaveWeekly} isSaving={isSaving} selectedWeek={selectedWeek} selectedProduct={selectedProductId} /></TabsContent>
            <TabsContent value="inventory"><InventoryReorderTab weeklyData={weeklyData} onSaveWeekly={handleSaveWeekly} isSaving={isSaving} selectedWeek={selectedWeek} selectedProduct={selectedProductId} /></TabsContent>
            <TabsContent value="fba"><FBAFeeTab weeklyData={weeklyData} onSaveWeekly={handleSaveWeekly} isSaving={isSaving} selectedWeek={selectedWeek} selectedProduct={selectedProductId} /></TabsContent>
            <TabsContent value="breakeven"><BreakEvenTab weeklyData={weeklyData} onSaveWeekly={handleSaveWeekly} isSaving={isSaving} selectedWeek={selectedWeek} selectedProduct={selectedProductId} /></TabsContent>
            <TabsContent value="cashflow"><CashFlowTab selectedProduct={selectedProductId} /></TabsContent>
            <TabsContent value="tariff"><TariffCOGSTab weeklyData={weeklyData} onSaveWeekly={handleSaveWeekly} isSaving={isSaving} selectedWeek={selectedWeek} selectedProduct={selectedProductId} /></TabsContent>
            <TabsContent value="kpi"><KPIsReportsTab weeklyData={weeklyData} onSaveWeekly={handleSaveWeekly} isSaving={isSaving} selectedWeek={selectedWeek} selectedProduct={selectedProductId} /></TabsContent>
            <TabsContent value="milestones"><MilestonesTab weeklyData={weeklyData} onSaveWeekly={handleSaveWeekly} isSaving={isSaving} selectedWeek={selectedWeek} selectedProduct={selectedProductId} /></TabsContent>
            <TabsContent value="tasks"><TaskManagementTab selectedProduct={selectedProductId} /></TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
