import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Activity, Server, AlertCircle, Mail, Clock } from 'lucide-react';
import { useEmailSyncStatus } from '@/hooks/useEmailSyncStatus';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const EmailSyncDashboard = () => {
  const { 
    loading, 
    error, 
    active_credentials_count, 
    total_emails, 
    last_email_time, 
    last_sync_time, 
    refresh 
  } = useEmailSyncStatus();
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleManualSync = () => {
    toast({ title: "Sync Initiated", description: "Triggering IMAP poll..." });
    // In real app, call edge function here
    // supabase.functions.invoke('poll-imap-emails')
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Active Accounts */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">Active Accounts</CardTitle>
          <Server className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{active_credentials_count}</div>
          <p className="text-xs text-slate-500">monitored inboxes</p>
        </CardContent>
      </Card>

      {/* Total Emails */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">Total Emails</CardTitle>
          <Mail className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{total_emails}</div>
          <p className="text-xs text-slate-500">processed to date</p>
        </CardContent>
      </Card>

      {/* Last Sync */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">Last Sync Attempt</CardTitle>
          <RefreshCw className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-white truncate">{formatDate(last_sync_time)}</div>
          <p className="text-xs text-slate-500 flex items-center gap-1">
             Status: {loading ? 'Checking...' : <Badge variant="outline" className="text-green-500 border-green-900 bg-green-900/10 h-4 px-1">Active</Badge>}
          </p>
        </CardContent>
      </Card>

      {/* Last Received */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">Last Email Received</CardTitle>
          <Clock className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-white truncate">{formatDate(last_email_time)}</div>
          <p className="text-xs text-slate-500">via webhook/imap</p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4 flex gap-2">
         <Button onClick={refresh} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
         </Button>
         <Button onClick={() => navigate('/email-sync-troubleshooting')} variant="secondary" size="sm" className="gap-2">
            <Activity className="w-4 h-4" />
            Troubleshoot
         </Button>
         <Button onClick={handleManualSync} size="sm" className="ml-auto bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
            Run Sync Now
         </Button>
      </div>

      {error && (
        <div className="col-span-4 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2 text-red-400">
           <AlertCircle className="w-5 h-5" />
           <span>System Error: {error}</span>
        </div>
      )}
    </div>
  );
};

export default EmailSyncDashboard;