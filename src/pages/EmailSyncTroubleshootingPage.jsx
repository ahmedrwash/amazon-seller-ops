import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clipboard, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { runEmailDiagnostics } from '@/utils/emailSyncDiagnostics';

const EmailSyncTroubleshootingPage = () => {
  const { toast } = useToast();
  const [report, setReport] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const handleRunDiagnostics = async () => {
    setLoading(true);
    const result = await runEmailDiagnostics();
    setReport(result);
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "SQL copied to clipboard." });
  };

  const sqlQueries = [
    {
      title: "Check Email Intake Table",
      sql: `SELECT count(*) FROM email_intake;`
    },
    {
      title: "Check Active Credentials",
      sql: `SELECT id, email_address, is_active, last_tested_at, test_status FROM email_credentials;`
    },
    {
      title: "Reset Failed Credentials",
      sql: `UPDATE email_credentials SET test_status = NULL, test_error = NULL WHERE test_status = 'Failed';`
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <Helmet><title>Email Sync Troubleshooting</title></Helmet>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Email Sync Troubleshooting</h1>
          <p className="text-slate-400">Diagnose and fix issues with email ingestion and processing.</p>
        </div>
        <Button onClick={handleRunDiagnostics} disabled={loading} className="bg-[hsl(var(--terracotta))]">
          {loading ? 'Running...' : 'Run Diagnostics'}
        </Button>
      </div>

      {report && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              Diagnostic Report
              <Badge className={report.status === 'healthy' ? 'bg-green-600' : 'bg-red-600'}>
                {report.status}
              </Badge>
            </CardTitle>
            <CardDescription>Generated at {new Date(report.timestamp).toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Critical Errors</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {report.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.checks.map((check, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-300">{check.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{check.details}</span>
                    {check.status === 'passed' ? 
                      <CheckCircle className="w-5 h-5 text-green-500" /> : 
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    }
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="common-issues">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="common-issues">Common Issues</TabsTrigger>
          <TabsTrigger value="manual-check">Manual SQL Checks</TabsTrigger>
          <TabsTrigger value="webhook">Webhook Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="common-issues" className="space-y-4 mt-6">
           <Card className="bg-slate-900 border-slate-800">
             <CardHeader><CardTitle className="text-white">IMAP Connection Failing</CardTitle></CardHeader>
             <CardContent className="text-slate-300 space-y-2">
               <p><strong>Symptom:</strong> Test status shows "Failed" or diagnostic reports connection errors.</p>
               <p><strong>Fix:</strong></p>
               <ul className="list-disc pl-5">
                 <li>Verify Hostname (e.g., `imap.gmail.com` vs `pop.gmail.com`).</li>
                 <li>Check Port (993 is standard for SSL/TLS).</li>
                 <li><strong>App Passwords:</strong> If using Gmail or Outlook with 2FA, you MUST use an App Password.</li>
                 <li>Check firewall settings if hosting your own mail server.</li>
               </ul>
             </CardContent>
           </Card>

           <Card className="bg-slate-900 border-slate-800">
             <CardHeader><CardTitle className="text-white">Emails Not Appearing</CardTitle></CardHeader>
             <CardContent className="text-slate-300 space-y-2">
               <p><strong>Symptom:</strong> Credentials are active, but `Total Emails` is 0.</p>
               <p><strong>Fix:</strong></p>
               <ul className="list-disc pl-5">
                 <li>Ensure the `email_intake` table exists (Run Migration).</li>
                 <li>Check if emails are in the `INBOX` folder (Archive/Spam are not polled).</li>
                 <li>If using Polling: It runs every 10-60 minutes. Click "Run Sync Now" on dashboard.</li>
                 <li>If using Webhook: Verify the forwarding rule in your email provider sent a verification email.</li>
               </ul>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="manual-check" className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
           {sqlQueries.map((q, i) => (
             <Card key={i} className="bg-slate-950 border-slate-800">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-medium text-slate-400">{q.title}</CardTitle>
               </CardHeader>
               <CardContent>
                 <code className="block bg-black p-3 rounded text-green-400 text-xs font-mono mb-3">
                   {q.sql}
                 </code>
                 <Button variant="outline" size="sm" onClick={() => copyToClipboard(q.sql)}>
                   <Clipboard className="w-3 h-3 mr-2" /> Copy SQL
                 </Button>
               </CardContent>
             </Card>
           ))}
        </TabsContent>
        
        <TabsContent value="webhook" className="space-y-4 mt-6">
           <Card className="bg-slate-900 border-slate-800">
              <CardHeader><CardTitle className="text-white">Webhook Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                 <Alert>
                    <HelpCircle className="h-4 w-4" />
                    <AlertTitle>Why Webhooks?</AlertTitle>
                    <AlertDescription>
                       Webhooks are more reliable than polling. They push emails to Supabase instantly.
                    </AlertDescription>
                 </Alert>
                 
                 <div className="space-y-2">
                    <h4 className="text-white font-medium">Your Webhook URL</h4>
                    <code className="block bg-slate-950 p-3 rounded text-slate-300 text-sm break-all border border-slate-800">
                       https://[YOUR_PROJECT_REF].supabase.co/functions/v1/inbound-email-webhook
                    </code>
                 </div>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailSyncTroubleshootingPage;