import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { 
    Activity, 
    AlertTriangle, 
    CheckCircle2, 
    Copy, 
    Database, 
    Globe, 
    HelpCircle, 
    LayoutDashboard, 
    Mail, 
    Play, 
    RefreshCw, 
    Server, 
    Settings, 
    XCircle 
} from 'lucide-react';

import WebhookLogsViewer from '@/components/WebhookLogsViewer';
import EmailForwardingSetupGuide from '@/components/EmailForwardingSetupGuide';
import { useWebhookTest } from '@/hooks/useWebhookTest';
import { useEmailIntakeTableStatus } from '@/hooks/useEmailIntakeTableStatus';

const TEST_PAYLOAD_TEMPLATE = JSON.stringify({
  "subject": "Test Email from Diagnostics",
  "from": "test-sender@example.com",
  "to": "admin@framelens.com",
  "text": "This is a test email sent from the diagnostics dashboard to verify webhook connectivity.",
  "html": "<p>This is a test email sent from the <strong>diagnostics dashboard</strong> to verify webhook connectivity.</p>",
  "message_id": `test-${Date.now()}`
}, null, 2);

const EmailSyncDiagnosticsPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [projectUrl, setProjectUrl] = useState('');
  const [testPayload, setTestPayload] = useState(TEST_PAYLOAD_TEMPLATE);
  
  // Custom Hooks
  const { runTest, testing, result: testResult } = useWebhookTest();
  const { 
     exists: tableExists, 
     count: emailCount, 
     recent: recentEmails, 
     loading: tableLoading, 
     rlsStatus,
     refresh: refreshTable 
  } = useEmailIntakeTableStatus();

  useEffect(() => {
    // Construct Webhook URL
    // Since we don't have direct access to Supabase object to get URL easily in all envs without secrets,
    // we use the client URL if available or fallback to a placeholder pattern.
    // In Vite, import.meta.env.VITE_SUPABASE_URL is usually available.
    const url = import.meta.env.VITE_SUPABASE_URL || 'https://[YOUR_PROJECT_ID].supabase.co';
    setProjectUrl(`${url}/functions/v1/inbound-email-webhook`);
  }, []);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(projectUrl);
    toast({ title: "Copied", description: "Webhook URL copied to clipboard" });
  };

  const handleManualTest = async () => {
    try {
        const payload = JSON.parse(testPayload);
        const res = await runTest(payload);
        if (res.success) {
            toast({ title: "Test Sent", description: "Webhook invoked successfully" });
            setTimeout(refreshTable, 2000); // Check table after a moment
        } else {
            toast({ title: "Test Failed", description: res.error.message, variant: "destructive" });
        }
    } catch (e) {
        toast({ title: "Invalid JSON", description: "Please check your test payload syntax.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 pb-20">
      <Helmet><title>Email Sync Diagnostics - Amazon Seller Operation</title></Helmet>
      
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Activity className="w-8 h-8 text-[hsl(var(--terracotta))]" />
                    Email Sync Diagnostics
                </h1>
                <p className="text-slate-400 mt-1"> troubleshoot and verify your email ingestion pipeline</p>
            </div>
            <div className="flex gap-3">
                 <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => window.location.reload()}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh Page
                 </Button>
            </div>
        </div>

        {/* Critical Alert */}
        <Alert className="bg-amber-500/10 border-amber-500/50 text-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-amber-400 font-bold">Most Likely Issue: Forwarding Not Configured</AlertTitle>
            <AlertDescription className="mt-2 text-amber-200/80">
                If emails are not appearing in your system, the root cause is typically that 
                <strong> Hostinger Email Forwarding</strong> is not yet pointing to your Webhook URL.
                <div className="mt-3">
                    <Button size="sm" variant="secondary" className="bg-amber-900/40 text-amber-100 hover:bg-amber-900/60 border border-amber-700" onClick={() => setActiveTab('setup')}>
                        View Setup Instructions
                    </Button>
                </div>
            </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-slate-900 border border-slate-800">
                <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800">Overview</TabsTrigger>
                <TabsTrigger value="webhook" className="data-[state=active]:bg-slate-800">Webhook & Logs</TabsTrigger>
                <TabsTrigger value="database" className="data-[state=active]:bg-slate-800">Database Status</TabsTrigger>
                <TabsTrigger value="setup" className="data-[state=active]:bg-slate-800">Setup Guide</TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Status Card 1: Configuration */}
                    <Card className="bg-slate-900 border-slate-800 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <CardHeader>
                            <CardTitle className="text-slate-200 flex items-center gap-2 text-lg">
                                <Globe className="w-5 h-5 text-blue-500" />
                                Webhook Config
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Your Webhook URL</label>
                                    <div className="flex items-center gap-2 mt-1 bg-slate-950 p-2 rounded border border-slate-800">
                                        <code className="text-xs text-blue-400 truncate flex-1 block">
                                            {projectUrl}
                                        </code>
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCopyUrl}>
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                    Pending verification in Hostinger
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Card 2: Database */}
                    <Card className="bg-slate-900 border-slate-800 shadow-lg relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-1 h-full ${tableExists ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <CardHeader>
                            <CardTitle className="text-slate-200 flex items-center gap-2 text-lg">
                                <Database className={`w-5 h-5 ${tableExists ? 'text-green-500' : 'text-red-500'}`} />
                                Email Storage
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-400">Table Status</span>
                                    {tableLoading ? (
                                        <span className="text-xs text-slate-500">Checking...</span>
                                    ) : tableExists ? (
                                        <Badge variant="outline" className="text-green-400 border-green-900 bg-green-900/10">Active</Badge>
                                    ) : (
                                        <Badge variant="destructive">Missing</Badge>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-400">Total Emails</span>
                                    <span className="text-2xl font-bold text-white">{emailCount}</span>
                                </div>
                                {rlsStatus === 'blocked' && (
                                    <div className="text-xs text-red-400 bg-red-900/10 p-2 rounded border border-red-900/20">
                                        RLS Policy blocking access. Check table permissions.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Card 3: Recent Activity */}
                    <Card className="bg-slate-900 border-slate-800 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                        <CardHeader>
                            <CardTitle className="text-slate-200 flex items-center gap-2 text-lg">
                                <Activity className="w-5 h-5 text-purple-500" />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentEmails.length > 0 ? (
                                    <div className="space-y-2">
                                        {recentEmails.slice(0, 3).map(email => (
                                            <div key={email.id} className="text-xs p-2 bg-slate-950 rounded border border-slate-800 truncate">
                                                <span className="text-purple-400 block">{email.from_address}</span>
                                                <span className="text-slate-500">{new Date(email.created_at).toLocaleDateString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-slate-500 text-sm">
                                        No emails processed yet.
                                        <br/>
                                        <Button variant="link" className="text-purple-400 p-0 h-auto" onClick={() => setActiveTab('webhook')}>Run a test</Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <WebhookLogsViewer />
                     <div className="space-y-6">
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white text-lg">Troubleshooting Steps</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-3 items-start">
                                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                    <div>
                                        <p className="text-sm text-slate-300 font-medium">Verify Hostinger Setup</p>
                                        <p className="text-xs text-slate-500">Ensure the forwarding rule is active and pointing to the exact URL.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                                    <div>
                                        <p className="text-sm text-slate-300 font-medium">Test Webhook Manually</p>
                                        <p className="text-xs text-slate-500">Use the "Webhook & Logs" tab to send a fake payload and verify the system accepts it.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                                    <div>
                                        <p className="text-sm text-slate-300 font-medium">Check RLS Policies</p>
                                        <p className="text-xs text-slate-500">If logs show success but dashboard is empty, check RLS policies on 'email_intake' table.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                     </div>
                </div>
            </TabsContent>

            {/* WEBHOOK TAB */}
            <TabsContent value="webhook" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-white">Manual Webhook Test</CardTitle>
                            <CardDescription>Simulate an incoming email by sending a JSON payload directly to the Edge Function.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea 
                                value={testPayload}
                                onChange={(e) => setTestPayload(e.target.value)}
                                className="font-mono text-xs bg-slate-950 border-slate-800 h-[300px]"
                            />
                            <div className="flex justify-end gap-2">
                                <Button onClick={() => setTestPayload(TEST_PAYLOAD_TEMPLATE)} variant="ghost" size="sm">Reset Template</Button>
                                <Button onClick={handleManualTest} disabled={testing} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
                                    {testing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                                    Send Test Payload
                                </Button>
                            </div>
                        </CardContent>
                        {testResult && (
                            <CardFooter className="bg-slate-950 border-t border-slate-800 p-4">
                                <div className={`w-full text-sm p-3 rounded border ${testResult.success ? 'bg-green-900/20 border-green-900 text-green-400' : 'bg-red-900/20 border-red-900 text-red-400'}`}>
                                    <div className="font-bold flex items-center gap-2 mb-1">
                                        {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        {testResult.success ? 'Success' : 'Failed'}
                                    </div>
                                    <p>{testResult.message}</p>
                                    {testResult.data && <pre className="mt-2 text-xs opacity-70 overflow-x-auto">{JSON.stringify(testResult.data, null, 2)}</pre>}
                                </div>
                            </CardFooter>
                        )}
                    </Card>

                    <div className="space-y-6">
                        <WebhookLogsViewer />
                    </div>
                </div>
            </TabsContent>

            {/* DATABASE TAB */}
            <TabsContent value="database" className="space-y-6">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white">Database Inspection: email_intake</CardTitle>
                        <CardDescription>Direct view of the ingestion table.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {tableLoading ? (
                            <div className="py-12 text-center text-slate-500">Checking database...</div>
                        ) : !tableExists ? (
                            <Alert variant="destructive">
                                <AlertTitle>Table Missing</AlertTitle>
                                <AlertDescription>The 'email_intake' table does not exist. Please run the database migration.</AlertDescription>
                            </Alert>
                        ) : (
                            <div className="rounded-md border border-slate-800">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
                                        <tr>
                                            <th className="p-3">ID</th>
                                            <th className="p-3">Subject</th>
                                            <th className="p-3">From</th>
                                            <th className="p-3">Received</th>
                                            <th className="p-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {recentEmails.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-slate-500">No records found.</td>
                                            </tr>
                                        ) : (
                                            recentEmails.map(email => (
                                                <tr key={email.id} className="hover:bg-slate-800/30">
                                                    <td className="p-3 font-mono text-slate-500 truncate max-w-[100px]">{email.id}</td>
                                                    <td className="p-3 text-slate-300">{email.subject}</td>
                                                    <td className="p-3 text-slate-400">{email.from_address}</td>
                                                    <td className="p-3 text-slate-500">{new Date(email.created_at).toLocaleString()}</td>
                                                    <td className="p-3">
                                                        <Badge variant="outline" className="text-xs bg-slate-800 border-slate-700 text-slate-300">
                                                            {email.status || 'unknown'}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* SETUP GUIDE TAB */}
            <TabsContent value="setup">
                <EmailForwardingSetupGuide webhookUrl={projectUrl} />
            </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default EmailSyncDiagnosticsPage;