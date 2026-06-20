import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, Save, CheckCircle2, AlertTriangle, FileImage } from 'lucide-react';

const ProductImportReviewPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [job, setJob] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    category: '',
    description: '',
    price: ''
  });

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const { data, error } = await supabase
        .from('product_import_jobs')
        .select('*')
        .eq('id', jobId)
        .single();
        
      if (error) throw error;
      setJob(data);

      // Pre-fill form
      const extract = data.extracted_data || {};
      setFormData({
        title: extract.title || '',
        brand: extract.brand || '',
        category: extract.main_category || '',
        description: extract.description || '',
        price: extract.price || ''
      });

      // Fetch assets
      const { data: assetsData } = await supabase
        .from('product_import_assets')
        .select('*')
        .eq('job_id', jobId);
      
      setAssets(assetsData || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not load import job.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!job) return;
    setApplying(true);

    try {
        const { data, error } = await supabase.functions.invoke('apply-product-import', {
            body: {
                job_id: job.id,
                mapped_fields: formData,
                user_id: user.id
            }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        toast({ title: "Success", description: "Product updated with imported data." });
        
        // Refresh job status
        fetchJob();

    } catch (err) {
        toast({ title: "Apply Failed", description: err.message, variant: "destructive" });
    } finally {
        setApplying(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />Loading review...</div>;
  if (!job) return <div className="p-8 text-center text-slate-400">Job not found.</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 pb-20">
      <Helmet><title>Review Import - Amazon Seller Operation</title></Helmet>
      
      <div className="max-w-5xl mx-auto space-y-6">
        <Header />
        
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
               <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                   <ArrowLeft className="w-5 h-5" />
               </Button>
               <div>
                   <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                       Import Review
                       <Badge variant="outline" className="text-slate-300">{job.source}</Badge>
                   </h1>
                   <p className="text-slate-400 text-sm">Job ID: {job.id}</p>
               </div>
           </div>
           
           <div className="flex items-center gap-3">
               <Badge className={`
                  ${job.status === 'Applied' ? 'bg-green-600' : 
                    job.status === 'Draft' ? 'bg-blue-600' : 'bg-slate-600'}
               `}>
                   {job.status}
               </Badge>
               {job.status === 'Draft' && (
                   <Button onClick={handleApply} disabled={applying} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
                       {applying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                       Apply Changes
                   </Button>
               )}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
                <Tabs defaultValue="data">
                    <TabsList className="bg-slate-900 border border-slate-800">
                        <TabsTrigger value="data">Extracted Data</TabsTrigger>
                        <TabsTrigger value="assets">Images ({assets.length})</TabsTrigger>
                        <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                    </TabsList>

                    <TabsContent value="data" className="space-y-4 mt-4">
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-lg">Review & Edit Fields</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Product Title</Label>
                                        <Input 
                                            value={formData.title} 
                                            onChange={e => setFormData({...formData, title: e.target.value})}
                                            className="bg-slate-950 border-slate-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Brand</Label>
                                        <Input 
                                            value={formData.brand} 
                                            onChange={e => setFormData({...formData, brand: e.target.value})}
                                            className="bg-slate-950 border-slate-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Input 
                                            value={formData.category} 
                                            onChange={e => setFormData({...formData, category: e.target.value})}
                                            className="bg-slate-950 border-slate-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Price (Ref)</Label>
                                        <Input 
                                            value={formData.price} 
                                            onChange={e => setFormData({...formData, price: e.target.value})}
                                            className="bg-slate-950 border-slate-800"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea 
                                        value={formData.description} 
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                        className="bg-slate-950 border-slate-800 h-32"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="assets" className="mt-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {assets.map(asset => (
                                <Card key={asset.id} className="bg-slate-900 border-slate-800 overflow-hidden">
                                    <div className="aspect-square bg-slate-950 relative flex items-center justify-center">
                                        {asset.file_url ? (
                                            <img src={asset.file_url} alt="Imported asset" className="object-cover w-full h-full" />
                                        ) : (
                                            <FileImage className="w-12 h-12 text-slate-700" />
                                        )}
                                    </div>
                                    <div className="p-2 text-xs text-slate-400 truncate border-t border-slate-800">
                                        {asset.file_name}
                                    </div>
                                </Card>
                            ))}
                            {assets.length === 0 && <div className="col-span-3 text-center py-8 text-slate-500">No images found.</div>}
                        </div>
                    </TabsContent>

                    <TabsContent value="raw" className="mt-4">
                        <Card className="bg-slate-900 border-slate-800">
                            <CardContent className="p-4">
                                <pre className="text-xs text-slate-400 font-mono overflow-auto max-h-[400px]">
                                    {JSON.stringify(job.extracted_data, null, 2)}
                                </pre>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <div className="space-y-6">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader><CardTitle className="text-base">Source Info</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div>
                            <span className="text-slate-500 block text-xs uppercase mb-1">Source URL</span>
                            <a href={job.source_url} target="_blank" rel="noreferrer" className="text-blue-400 break-all hover:underline block truncate">
                                {job.source_url}
                            </a>
                        </div>
                        <div>
                            <span className="text-slate-500 block text-xs uppercase mb-1">Imported At</span>
                            <span className="text-slate-200">{new Date(job.created_at).toLocaleString()}</span>
                        </div>
                         <div>
                            <span className="text-slate-500 block text-xs uppercase mb-1">Confidence</span>
                            <span className="text-slate-200">High (Mock)</span>
                        </div>
                    </CardContent>
                </Card>

                {job.status === 'Applied' && (
                    <div className="p-4 bg-green-900/10 border border-green-900/30 rounded text-green-400 text-sm flex gap-2">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <div>
                            <strong>Applied Successfully</strong>
                            <p className="opacity-80 mt-1">
                                Data was merged into the product record on {new Date(job.applied_at).toLocaleDateString()}.
                            </p>
                        </div>
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
};

export default ProductImportReviewPage;