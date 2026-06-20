import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import { supabase } from '@/lib/customSupabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Eye, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProductImportQueuePage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const fetchJobs = async () => {
    try {
      let query = supabase
        .from('product_import_jobs')
        .select('*, products(product_name)')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (sourceFilter !== 'all') {
        query = query.eq('source', sourceFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [statusFilter, sourceFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft': return <Badge variant="outline" className="text-blue-400 border-blue-800">Draft</Badge>;
      case 'Applied': return <Badge className="bg-green-600">Applied</Badge>;
      case 'Error': return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 pb-20">
      <Helmet><title>Import Queue - Amazon Seller Operation</title></Helmet>
      
      <div className="max-w-7xl mx-auto space-y-6">
        <Header />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-white">Import Queue</h1>
                <p className="text-slate-400 mt-1">Monitor and manage product data imports from external sources.</p>
            </div>
            
            <div className="flex gap-3 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px] h-9 bg-slate-950 border-slate-800">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Applied">Applied</SelectItem>
                        <SelectItem value="Error">Error</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-[140px] h-9 bg-slate-950 border-slate-800">
                        <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="Amazon">Amazon</SelectItem>
                        <SelectItem value="Alibaba">Alibaba</SelectItem>
                        <SelectItem value="Temu">Temu</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            {loading && jobs.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" /> Loading queue...
                </div>
            ) : (
                <Table>
                    <TableHeader className="bg-slate-950">
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                                    No import jobs found. Start an import from a Product page.
                                </TableCell>
                            </TableRow>
                        ) : (
                            jobs.map((job) => (
                                <TableRow key={job.id} className="hover:bg-slate-800/30">
                                    <TableCell className="font-medium text-slate-200">
                                        {job.products?.product_name || 'Unknown Product'}
                                        <div className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">
                                            {job.source_url}
                                        </div>
                                    </TableCell>
                                    <TableCell>{job.source}</TableCell>
                                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                                    <TableCell className="text-slate-400 text-sm">
                                        {new Date(job.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link to={`/product-imports/${job.id}`}>
                                            <Button size="sm" variant="ghost" className="hover:bg-slate-800 hover:text-white">
                                                <Eye className="w-4 h-4 mr-2" /> Review
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProductImportQueuePage;