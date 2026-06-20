import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function TestDataStatusPanel({ status, progress, results, error, timestamp, onClear }) {
  if (status === 'idle' && !timestamp) return null;

  return (
    <Card className="bg-slate-900 border-slate-700 shadow-lg mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          {status === 'seeding' && <Loader2 className="animate-spin text-[hsl(var(--terracotta))] w-5 h-5" />}
          {status === 'deleting' && <Loader2 className="animate-spin text-red-400 w-5 h-5" />}
          {status === 'idle' && <CheckCircle2 className="text-slate-400 w-5 h-5" />}
          Operation Status
        </CardTitle>
        {timestamp && (
          <Badge variant="outline" className="text-slate-400 border-slate-700 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {timestamp.toLocaleTimeString()}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {status !== 'idle' && (
           <div className="mb-4">
             <div className="text-sm text-slate-400 mb-1 flex justify-between">
               <span>Progress</span>
               <span>{progress}</span>
             </div>
             <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-[hsl(var(--terracotta))] animate-pulse w-full origin-left"></div>
             </div>
           </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-200 text-sm flex items-start gap-2">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {results && Object.keys(results).length > 0 && (
          <ScrollArea className="h-[200px] w-full rounded border border-slate-800 bg-slate-950/50 p-4">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(results).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-xs font-mono text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                  <Badge className={`${value > 0 ? 'bg-teal-900/30 text-[hsl(var(--terracotta))]' : 'bg-slate-800 text-slate-500'}`}>
                    {value}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {status === 'idle' && (
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" size="sm" onClick={onClear} className="text-slate-400 hover:text-white">
              Clear Log
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}