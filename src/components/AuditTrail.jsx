import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, History } from 'lucide-react';
import { format } from 'date-fns';

export default function AuditTrail({ tableName, recordId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!recordId) return;
      setLoading(true);
      try {
        // 1. Fetch audit logs without the join (removed user:user_id(...))
        const { data: logsData, error: logsError } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('table_name', tableName)
          .eq('record_id', recordId)
          .order('created_at', { ascending: false });

        if (logsError) throw logsError;

        if (!logsData || logsData.length === 0) {
          setLogs([]);
          return;
        }

        // 2. Extract unique user IDs to fetch profiles separately
        const userIds = [...new Set(logsData.map(log => log.user_id).filter(Boolean))];

        // 3. Fetch user profiles if there are any user IDs
        let userMap = {};
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', userIds);
          
          if (!profilesError && profilesData) {
            userMap = profilesData.reduce((acc, profile) => {
              acc[profile.id] = profile;
              return acc;
            }, {});
          }
        }

        // 4. Merge logs with user data
        const enrichedLogs = logsData.map(log => ({
          ...log,
          user: userMap[log.user_id] || null
        }));

        setLogs(enrichedLogs);
      } catch (err) {
        console.error("Fetch audit logs error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [tableName, recordId]);

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'bg-green-900/20 text-green-400 border-green-800';
      case 'UPDATE': return 'bg-blue-900/20 text-blue-400 border-blue-800';
      case 'DELETE': return 'bg-red-900/20 text-red-400 border-red-800';
      default: return 'bg-slate-800 text-slate-400';
    }
  };

  const renderChanges = (changes) => {
    if (!changes) return <span className="text-slate-600 italic">No detailed changes</span>;
    
    // Handle potential stringified JSON
    const changesObj = typeof changes === 'string' ? JSON.parse(changes) : changes;

    return (
      <div className="text-xs space-y-1">
        {Object.entries(changesObj).map(([key, val]) => (
          <div key={key} className="flex gap-2">
            <span className="font-semibold text-slate-400">{key}:</span>
            <span className="line-through text-red-900/70">{String(val?.from ?? '')}</span>
            <span className="text-green-500/90">→ {String(val?.to ?? '')}</span>
          </div>
        ))}
      </div>
    );
  };

  const handleExport = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Changes'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        log.created_at,
        log.user?.email || 'Unknown',
        log.action,
        JSON.stringify(log.changes || {}).replace(/,/g, ';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_${tableName}_${recordId}.csv`;
    a.click();
  };

  if (loading) return <div className="p-4 text-center text-slate-500">Loading history...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-slate-400" />
          Audit Trail
        </h3>
        {logs.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExport} className="h-8">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        )}
      </div>

      <div className="rounded-md border border-slate-700 bg-slate-900/50">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300 w-[180px]">Timestamp</TableHead>
              <TableHead className="text-slate-300 w-[150px]">User</TableHead>
              <TableHead className="text-slate-300 w-[100px]">Action</TableHead>
              <TableHead className="text-slate-300">Changes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                  No history recorded for this item.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="border-slate-700 hover:bg-slate-800/50">
                  <TableCell className="text-xs text-slate-400">
                    {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-sm text-slate-300">
                    {log.user?.full_name || log.user?.email || 'System'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getActionColor(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {renderChanges(log.changes)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}