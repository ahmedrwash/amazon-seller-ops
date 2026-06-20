import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { RefreshCw, Terminal, CheckCircle2, XCircle, Copy } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient'; // Assuming we might fetch logs from a DB table if functions log there, or simulates generic log viewing

// NOTE: Supabase Edge Functions don't expose logs via client API directly unless stored in a table. 
// For this diagnostic tool, we will fetch from an 'audit_logs' or specific 'system_logs' table if available, 
// OR we will rely on the `email_intake` table's recent entries as a proxy for success logs, 
// AND potential error logs if you implemented a logging table.
//
// Since we don't have a direct 'function_logs' table in the schema provided, 
// we will simulate the "Log Viewer" by looking at the `email_intake` table for successful entries
// and `email_credentials` for connection errors, effectively creating a "Sync Activity Log".

const WebhookLogsViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Fetch recent successful intakes
      const { data: intakeLogs, error: intakeError } = await supabase
        .from('email_intake')
        .select('id, created_at, subject, status, processing_error')
        .order('created_at', { ascending: false })
        .limit(20);

      if (intakeError) throw intakeError;

      // Transform into a unified log format
      const formattedLogs = intakeLogs.map(log => ({
        id: log.id,
        timestamp: log.created_at,
        type: log.processing_error ? 'ERROR' : 'SUCCESS',
        message: log.processing_error 
          ? `Failed to process: ${log.processing_error}` 
          : `Processed email: "${log.subject?.substring(0, 30)}${log.subject?.length > 30 ? '...' : ''}"`,
        source: 'Webhook/Ingestion'
      }));

      setLogs(formattedLogs);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const copyLog = (msg) => {
    navigator.clipboard.writeText(msg);
  };

  return (
    <Card className="bg-slate-950 border-slate-800 shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-purple-400" />
            Ingestion Activity Logs
          </CardTitle>
          <CardDescription className="text-slate-400">
            Recent activity from the email ingestion pipeline
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchLogs} 
          disabled={loading}
          className="border-slate-700 hover:bg-slate-800 text-slate-300"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-slate-800 bg-slate-900/50">
          <ScrollArea className="h-[300px]">
            <div className="p-4 space-y-3">
              {logs.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  <p>No activity recorded recently.</p>
                  <p className="text-xs mt-1">Send a test email to generate logs.</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm p-2 rounded hover:bg-slate-800/50 transition-colors group">
                    <div className="mt-0.5">
                      {log.type === 'SUCCESS' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${log.type === 'SUCCESS' ? 'text-slate-200' : 'text-red-300'}`}>
                          {log.type}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-400 break-all">{log.message}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyLog(log.message)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
        {lastRefreshed && (
            <div className="text-xs text-slate-600 mt-2 text-right">
                Last updated: {lastRefreshed.toLocaleTimeString()}
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WebhookLogsViewer;