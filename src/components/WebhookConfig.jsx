import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useWebhookConfig } from '@/hooks/useWebhookConfig';
import { Copy, Eye, EyeOff, RefreshCw, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

const WebhookConfig = () => {
  const { config, stats, loading, regenerateSecret, testWebhook } = useWebhookConfig();
  const [showSecret, setShowSecret] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(config.url);
    toast({ title: "Copied", description: "Webhook URL copied to clipboard" });
  };

  const handleRegenerate = async () => {
    if (confirm("Are you sure? This will invalidate the old secret.")) {
       const newSecret = await regenerateSecret();
       if (newSecret) toast({ title: "Success", description: "Secret regenerated" });
       else toast({ title: "Error", description: "Failed to regenerate secret", variant: "destructive" });
    }
  };

  const handleTest = async () => {
    const res = await testWebhook();
    if (res.success) toast({ title: "Test Sent", description: "Test payload sent to webhook." });
    else toast({ title: "Test Failed", description: res.error?.message || "Unknown error", variant: "destructive" });
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex justify-between items-start">
           <div>
              <CardTitle className="text-white">Webhook Configuration</CardTitle>
              <CardDescription>Configure your inbound email stream settings.</CardDescription>
           </div>
           <Badge variant="outline" className={
              stats.health === 'healthy' ? 'border-green-500 text-green-500' : 
              stats.health === 'new' ? 'border-blue-500 text-blue-500' : 'border-amber-500 text-amber-500'
           }>
              <Activity className="w-3 h-3 mr-1" /> {stats.health.toUpperCase()}
           </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-slate-300">Webhook URL</Label>
          <div className="flex gap-2">
            <Input value={config.url} readOnly className="bg-slate-800 border-slate-700 font-mono text-xs text-slate-300" />
            <Button variant="outline" size="icon" onClick={handleCopy} className="border-slate-700 hover:bg-slate-800">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
           <Label className="text-slate-300">Webhook Secret</Label>
           <div className="flex gap-2">
              <Input 
                type={showSecret ? "text" : "password"} 
                value={config.secret} 
                readOnly 
                className="bg-slate-800 border-slate-700 font-mono text-xs text-slate-300" 
              />
              <Button variant="outline" size="icon" onClick={() => setShowSecret(!showSecret)} className="border-slate-700 hover:bg-slate-800">
                 {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={handleRegenerate} className="border-slate-700 hover:bg-slate-800 text-amber-500">
                 <RefreshCw className="w-4 h-4" />
              </Button>
           </div>
           <p className="text-xs text-slate-500">Use this secret to validate payloads or pass as ?secret=... query param.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
           <div>
              <Label className="text-xs text-slate-500">Last Received</Label>
              <p className="text-sm font-medium text-white">
                 {config.lastSync ? formatDistanceToNow(new Date(config.lastSync), { addSuffix: true }) : 'Never'}
              </p>
           </div>
           <div>
              <Label className="text-xs text-slate-500">Emails (24h)</Label>
              <p className="text-sm font-medium text-white">{stats.count24h}</p>
           </div>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-900/50 border-t border-slate-800 p-4">
         <Button variant="secondary" className="w-full" onClick={handleTest} disabled={loading}>
            {loading ? 'Testing...' : 'Send Test Event'}
         </Button>
      </CardFooter>
    </Card>
  );
};

export default WebhookConfig;