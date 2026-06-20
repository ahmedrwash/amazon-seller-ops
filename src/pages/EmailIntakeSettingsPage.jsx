import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useMappingRules } from '@/hooks/useMappingRules';
import { useEmailCredentials } from '@/hooks/useEmailCredentials';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RuleForm from '@/components/RuleForm';
import RuleTester from '@/components/RuleTester';
import WebhookConfig from '@/components/WebhookConfig';
import EmailCredentialsList from '@/components/EmailCredentialsList';
import EmailCredentialsForm from '@/components/EmailCredentialsForm';
import ManualEmailImport from '@/components/ManualEmailImport';
import { Plus, Edit, Trash2, MailPlus, AlertCircle, FileText, Globe, Activity } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useConfirm } from '@/context/ConfirmContext';
import { 
   SENDGRID_SETUP_STEPS, 
   MAILGUN_SETUP_STEPS, 
   IMAP_POLLING_STEPS 
} from '@/utils/emailProviderSetup';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link } from 'react-router-dom';

const StepList = ({ steps }) => (
   <div className="space-y-4">
      {steps.map((step, i) => (
         <div key={i} className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold border border-slate-700">
               {i + 1}
            </div>
            <div className="space-y-1">
               <h4 className="text-sm font-medium text-slate-200">{step.title}</h4>
               <p className="text-sm text-slate-400">{step.description}</p>
               {step.code && (
                  <code className="block mt-1 p-2 bg-slate-950 rounded text-xs font-mono text-green-400 border border-slate-800">
                     {step.code}
                  </code>
               )}
            </div>
         </div>
      ))}
   </div>
);

const EmailIntakeSettingsPage = () => {
  const { rules, getRules, createRule, updateRule, deleteRule } = useMappingRules();
  const { 
    getEmailCredentials, 
    createEmailCredentials, 
    updateEmailCredentials, 
    deleteEmailCredentials,
    toggleActiveStatus 
  } = useEmailCredentials();
  
  const { toast } = useToast();
  const { confirm } = useConfirm();
  
  // State for Rules
  const [editingRule, setEditingRule] = useState(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  // State for Credentials
  const [credentials, setCredentials] = useState([]);
  const [credLoading, setCredLoading] = useState(true);
  const [editingCred, setEditingCred] = useState(null);
  const [isCredModalOpen, setIsCredModalOpen] = useState(false);

  useEffect(() => {
    getRules();
    fetchCredentials();
  }, [getRules]);

  const fetchCredentials = async () => {
     try {
        const res = await getEmailCredentials();
        setCredentials(res?.data || []);
     } catch (error) {
        console.error("Failed to fetch credentials:", error);
        setCredentials([]);
     } finally {
        setCredLoading(false);
     }
  };

  // Rule Handlers
  const handleSaveRule = async (ruleData) => {
    let res;
    if (editingRule) {
       res = await updateRule(editingRule.id, ruleData);
    } else {
       res = await createRule(ruleData);
    }

    if (res.error) {
       toast({ title: "Error", description: res.error.message, variant: "destructive" });
    } else {
       toast({ title: "Success", description: "Rule saved." });
       setIsRuleModalOpen(false);
       setEditingRule(null);
    }
  };

  const handleDeleteRule = async (ruleId) => {
     if (await confirm({ title: "Delete Rule", description: "Are you sure?" })) {
        await deleteRule(ruleId);
        toast({ title: "Deleted", description: "Rule removed." });
     }
  };

  const handleToggleRule = async (rule) => {
     await updateRule(rule.id, { enabled: !rule.enabled });
  };

  // Credential Handlers
  const handleSaveCred = async (data) => {
     let res;
     if (editingCred) {
        res = await updateEmailCredentials(editingCred.id, data);
     } else {
        res = await createEmailCredentials(data);
     }

     if (!res.error) {
        setIsCredModalOpen(false);
        setEditingCred(null);
        fetchCredentials();
     }
  };

  const handleDeleteCred = async (id) => {
     const res = await deleteEmailCredentials(id);
     if (!res.error) fetchCredentials();
  };

  const handleToggleCredStatus = async (id, status) => {
     await toggleActiveStatus(id, status);
     fetchCredentials();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6 pb-20">
       <Helmet><title>Intake Settings - Amazon Seller Operation</title></Helmet>
       
       <div className="flex justify-between items-center">
          <div>
             <h1 className="text-3xl font-bold text-white">Email Intake Settings</h1>
             <p className="text-slate-400">Manage how emails are imported, parsed, and mapped to database records.</p>
          </div>
          <Link to="/email-sync-diagnostics">
             <Button variant="outline" className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800">
                <Activity className="w-4 h-4" />
                Run Diagnostics
             </Button>
          </Link>
       </div>

       <Tabs defaultValue="methods" className="space-y-6">
          <TabsList className="bg-slate-800 border border-slate-700">
             <TabsTrigger value="methods" className="data-[state=active]:bg-slate-700">Import Methods</TabsTrigger>
             <TabsTrigger value="rules" className="data-[state=active]:bg-slate-700">Mapping Rules</TabsTrigger>
             <TabsTrigger value="legacy" className="data-[state=active]:bg-slate-700">Legacy Credentials</TabsTrigger>
          </TabsList>

          {/* IMPORT METHODS TAB */}
          <TabsContent value="methods" className="space-y-6">
             <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                   <CardTitle className="text-white">Choose Your Ingestion Method</CardTitle>
                   <CardDescription>Select the best way to bring emails into the system.</CardDescription>
                </CardHeader>
                <CardContent>
                   <Tabs defaultValue="manual" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 bg-slate-950 border border-slate-800">
                         <TabsTrigger value="auto">Automatic (Forwarding)</TabsTrigger>
                         <TabsTrigger value="mailgun">Mailgun / SendGrid</TabsTrigger>
                         <TabsTrigger value="manual">Manual Import</TabsTrigger>
                      </TabsList>

                      <div className="mt-6">
                         <TabsContent value="auto" className="space-y-6">
                            <Alert className="bg-teal-900/20 border-teal-800 mb-6">
                               <Globe className="h-4 w-4 text-[hsl(var(--terracotta))]" />
                               <AlertTitle className="text-[hsl(var(--terracotta))]">Recommended Method</AlertTitle>
                               <AlertDescription className="text-[hsl(var(--terracotta))]/80">
                                  Email forwarding is the most reliable way to process incoming mail in real-time.
                               </AlertDescription>
                            </Alert>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <WebhookConfig />
                               <Card className="bg-slate-950 border-slate-800">
                                  <CardHeader>
                                     <CardTitle className="text-lg text-slate-200">Forwarding Setup</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                     <div className="text-sm text-slate-400 space-y-4">
                                        <p>1. Set up a forwarding rule in your email provider (Gmail, Outlook, Hostinger).</p>
                                        <p>2. Forward emails to your Mailgun/SendGrid inbound address.</p>
                                        <p>3. Configure the webhook URL shown on the left in your Mailgun/SendGrid settings.</p>
                                     </div>
                                  </CardContent>
                               </Card>
                            </div>
                         </TabsContent>

                         <TabsContent value="mailgun" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <Card className="bg-slate-950 border-slate-800">
                                  <CardHeader><CardTitle className="text-white">Mailgun Setup</CardTitle></CardHeader>
                                  <CardContent><StepList steps={MAILGUN_SETUP_STEPS} /></CardContent>
                               </Card>
                               <Card className="bg-slate-950 border-slate-800">
                                  <CardHeader><CardTitle className="text-white">SendGrid Setup</CardTitle></CardHeader>
                                  <CardContent><StepList steps={SENDGRID_SETUP_STEPS} /></CardContent>
                               </Card>
                            </div>
                         </TabsContent>

                         <TabsContent value="manual" className="space-y-6">
                            <ManualEmailImport />
                         </TabsContent>
                      </div>
                   </Tabs>
                </CardContent>
             </Card>
          </TabsContent>

          {/* RULES TAB */}
          <TabsContent value="rules" className="space-y-8">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Automation Rules</h2>
                <Button onClick={() => { setEditingRule(null); setIsRuleModalOpen(true); }} variant="outline">
                   <Plus className="w-4 h-4 mr-2" /> Add Rule
                </Button>
             </div>

             <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <Table>
                   <TableHeader>
                      <TableRow>
                         <TableHead>Priority</TableHead>
                         <TableHead>Name</TableHead>
                         <TableHead>Target</TableHead>
                         <TableHead>Status</TableHead>
                         <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {rules.map(rule => (
                         <TableRow key={rule.id}>
                            <TableCell>{rule.priority}</TableCell>
                            <TableCell className="font-medium text-white">{rule.name}</TableCell>
                            <TableCell>{rule.default_target?.table || '-'}</TableCell>
                            <TableCell>
                               <Switch checked={rule.enabled} onCheckedChange={() => handleToggleRule(rule)} />
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                               <Button variant="ghost" size="sm" onClick={() => { setEditingRule(rule); setIsRuleModalOpen(true); }}>
                                  <Edit className="w-4 h-4" />
                               </Button>
                               <Button variant="ghost" size="sm" onClick={() => handleDeleteRule(rule.id)} className="text-red-500">
                                  <Trash2 className="w-4 h-4" />
                               </Button>
                            </TableCell>
                         </TableRow>
                      ))}
                      {rules.length === 0 && (
                         <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No rules defined.</TableCell></TableRow>
                      )}
                   </TableBody>
                </Table>
             </div>
             <RuleTester rules={rules} />
          </TabsContent>

          {/* LEGACY CREDENTIALS TAB */}
          <TabsContent value="legacy" className="space-y-6">
             <Alert className="bg-amber-900/20 border-amber-800 mb-4">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-400">Deprecation Notice</AlertTitle>
                <AlertDescription className="text-amber-500/80">
                   IMAP Polling is less reliable than forwarding. Use only for low-volume accounts or where forwarding is impossible.
                </AlertDescription>
             </Alert>

             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Connected Accounts</h2>
                <Button onClick={() => { setEditingCred(null); setIsCredModalOpen(true); }} className="gap-2 bg-slate-700 hover:bg-slate-600">
                   <MailPlus className="w-4 h-4" /> Add Legacy IMAP
                </Button>
             </div>
             
             <EmailCredentialsList 
                credentials={credentials} 
                loading={credLoading}
                onEdit={(cred) => { setEditingCred(cred); setIsCredModalOpen(true); }}
                onDelete={handleDeleteCred}
                onToggleStatus={handleToggleCredStatus}
                onRefresh={fetchCredentials}
             />
             
             <Card className="bg-slate-900 border-slate-800 mt-6">
                <CardHeader><CardTitle className="text-white text-base">Polling Setup Guide</CardTitle></CardHeader>
                <CardContent>
                   <StepList steps={IMAP_POLLING_STEPS} />
                </CardContent>
             </Card>
          </TabsContent>
       </Tabs>

       {/* Rule Modal */}
       <Dialog open={isRuleModalOpen} onOpenChange={setIsRuleModalOpen}>
          <DialogContent className="max-w-lg bg-slate-900 border-slate-800 text-white">
             <DialogHeader>
                <DialogTitle>{editingRule ? 'Edit Rule' : 'New Automation Rule'}</DialogTitle>
             </DialogHeader>
             <RuleForm 
                rule={editingRule} 
                onSave={handleSaveRule} 
                onCancel={() => setIsRuleModalOpen(false)}
             />
          </DialogContent>
       </Dialog>

       {/* Credential Modal */}
       <Dialog open={isCredModalOpen} onOpenChange={setIsCredModalOpen}>
          <DialogContent className="max-w-xl bg-slate-900 border-slate-800 text-white">
             <DialogHeader>
                <DialogTitle>{editingCred ? 'Edit Email Account' : 'Connect New Email Account'}</DialogTitle>
             </DialogHeader>
             <EmailCredentialsForm
                initialData={editingCred}
                onSave={handleSaveCred}
                onCancel={() => setIsCredModalOpen(false)}
             />
          </DialogContent>
       </Dialog>
    </div>
  );
};

export default EmailIntakeSettingsPage;