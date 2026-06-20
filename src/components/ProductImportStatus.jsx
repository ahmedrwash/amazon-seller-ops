import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, ArrowRight, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProductImportStatus = ({ productId, onImportClick, onImportStarted }) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLatestJob = async () => {
    try {
      const { data, error } = await supabase
        .from('product_import_jobs')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setJob(data);
    } catch (err) {
      console.error('Error fetching import job:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestJob();
    const interval = setInterval(fetchLatestJob, 5000);
    return () => clearInterval(interval);
  }, [productId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'Approved': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'Applied': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'Error': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  if (loading) return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6 flex items-center justify-center">
      <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
    </div>
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 mb-1">Product Import Status</h3>
          {!job ? (
            <p className="text-xs text-slate-400">No import jobs found for this product.</p>
          ) : (
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline" className={getStatusColor(job.status)}>
                {job.status}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <span className="font-medium text-slate-300">{job.source}</span>
                <span className="mx-1">•</span>
                <span>{new Date(job.created_at).toLocaleDateString()}</span>
              </div>
              <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                 Original Link <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
          
          {job?.status === 'Error' && (
              <div className="mt-2 text-xs text-red-400 bg-red-950/30 p-2 rounded border border-red-900/30 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  {job.error_message || 'Unknown error occurred during import.'}
              </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!job || job.status === 'Applied' || job.status === 'Error' ? (
            <Button size="sm" variant="outline" onClick={onImportClick}>
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
              Import from Link
            </Button>
          ) : (
            <Link to={`/product-imports/${job.id}`}>
              <Button size="sm" className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
                Review Data <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductImportStatus;