import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { useEmailTest } from '@/hooks/useEmailTest';
import { validateCredentialData } from '@/utils/emailCredentialsUtils';
import { runEmailDiagnostics } from '@/utils/emailSyncDiagnostics';
import { Loader2, CheckCircle, AlertTriangle, ShieldCheck, ClipboardList, BookOpen } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const EmailCredentialsForm = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    email_address: '',
    imap_server: '',
    imap_port: '993',
    imap_username: '',
    imap_password: '',
    smtp_server: '',
    smtp_port: '587',
    smtp_username: '',
    smtp_password: '',
    ...initialData
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isRunningDiag, setIsRunningDiag] = useState(false);
  const { testing, testIMAPConnection } = useEmailTest();
  const [testResult, setTestResult] = useState(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        imap_password: '',
        smtp_password: ''
      }));
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleTest = async () => {
    if (!formData.imap_server || !formData.imap_username) {
       setErrors(prev => ({ ...prev, form: "Please fill IMAP server and username to test." }));
       return;
    }
    
    if (!initialData && !formData.imap_password) {
        setErrors(prev => ({ ...prev, imap_password: "Password is required for testing" }));
        return;
    }

    const result = await testIMAPConnection({
       ...formData,
       id: initialData?.id
    });
    setTestResult(result);
  };

  const handleSubmit = async () => {
    const validation = validateCredentialData(formData);
    if (initialData && !formData.imap_password) {
       delete validation.errors.imap_password;
       if (Object.keys(validation.errors).length === 0) validation.isValid = true;
    }

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  const handleDiagnostic = async () => {
    setIsRunningDiag(true);
    try {
      const report = await runEmailDiagnostics();
      if (report.status === 'healthy') {
        toast({ title: "System Healthy", description: "All checks passed." });
      } else {
        toast({ 
          title: "Issues Found", 
          description: `Found ${report.errors.length} errors. Check console or troubleshooting page.`, 
          variant: "destructive" 
        });
        console.table(report.errors);
      }
    } catch (e) {
      toast({ title: "Diagnostic Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsRunningDiag(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* IMAP Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[hsl(var(--terracotta))]" /> Incoming Mail (IMAP)
            </h3>
            <div className="flex gap-2">
                <Button size="xs" variant="outline" onClick={handleDiagnostic} disabled={isRunningDiag}>
                    {isRunningDiag ? <Loader2 className="w-3 h-3 animate-spin" /> : <ClipboardList className="w-3 h-3" />}
                    <span className="ml-1">Diagnose</span>
                </Button>
                <Button size="xs" variant="outline" onClick={() => navigate('/email-sync-troubleshooting')}>
                    <BookOpen className="w-3 h-3" />
                    <span className="ml-1">Help</span>
                </Button>
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
              <Label className="text-xs">Email Address</Label>
              <Input 
                value={formData.email_address} 
                onChange={e => handleChange('email_address', e.target.value)}
                placeholder="invoices@company.com"
                className={errors.email_address ? "border-red-500" : ""}
              />
              {errors.email_address && <p className="text-xs text-red-500">{errors.email_address}</p>}
           </div>
           <div className="space-y-2">
              <Label className="text-xs">IMAP Server</Label>
              <Input 
                value={formData.imap_server} 
                onChange={e => handleChange('imap_server', e.target.value)}
                placeholder="imap.hostinger.com"
                className={errors.imap_server ? "border-red-500" : ""}
              />
           </div>
           <div className="space-y-2">
              <Label className="text-xs">IMAP Username</Label>
              <Input 
                value={formData.imap_username} 
                onChange={e => handleChange('imap_username', e.target.value)}
              />
           </div>
           <div className="space-y-2">
              <Label className="text-xs">IMAP Port</Label>
              <Input 
                type="number" 
                value={formData.imap_port} 
                onChange={e => handleChange('imap_port', e.target.value)}
              />
           </div>
           <div className="col-span-2 space-y-2">
              <Label className="text-xs">IMAP Password {initialData && "(Leave blank to keep unchanged)"}</Label>
              <Input 
                type="password" 
                value={formData.imap_password} 
                onChange={e => handleChange('imap_password', e.target.value)}
                className={errors.imap_password ? "border-red-500" : ""}
              />
           </div>
        </div>
      </div>

      {/* Test Result Banner */}
      {testResult && (
         <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${testResult.success ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
            {testResult.success ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {testResult.message || testResult.error}
         </div>
      )}

      {errors.form && <p className="text-sm text-red-500">{errors.form}</p>}

      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="secondary" type="button" onClick={handleTest} disabled={testing}>
          {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Test Connection"}
        </Button>
        <div className="flex-1"></div>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSaving || testing} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save Credentials"}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default EmailCredentialsForm;