import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useEmailIntake } from '@/hooks/useEmailIntake';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EMAIL_STATUS } from '@/constants/emailIntakeConstants';
import { formatEmailDate } from '@/utils/emailIntakeUtils';
import { Paperclip, Search, Mail, ArrowRight, RefreshCw, DownloadCloud } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

const EmailIntakeInboxPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [reviewerFilter, setReviewerFilter] = useState('all');
  const [isImporting, setIsImporting] = useState(false);
  const [lastImport, setLastImport] = useState(null);
  
  const { emails, loading, getInboxEmails, syncEmails } = useEmailIntake();

  useEffect(() => {
    fetchData();
  }, [filterStatus, reviewerFilter]); 

  const fetchData = () => {
    const status = filterStatus === 'all' ? [] : [filterStatus];
    getInboxEmails({ status, search, reviewer: reviewerFilter === 'all' ? null : reviewerFilter });
  };

  const handleSearch = (e) => {
      e.preventDefault();
      fetchData();
  };

  const handleAssignToMe = async (e, emailId) => {
    e.stopPropagation();
    await supabase.from('inbound_emails').update({ assigned_reviewer: user.id }).eq('id', emailId);
    fetchData();
  };

  const handleSync = async () => {
    setIsImporting(true);
    toast({ title: "Syncing...", description: "Checking for new emails via IMAP..." });
    
    const res = await syncEmails();
    
    setIsImporting(false);
    setLastImport(new Date());

    if (res.success) {
       toast({ 
         title: "Sync Complete", 
         description: `Found ${res.count} new emails.`,
         className: "bg-green-600 border-green-700 text-white"
       });
       if (res.count > 0) fetchData();
    } else {
       // Check for specific error message about credentials
       const isConfigError = res.message?.includes('IMAP configuration missing') || res.message?.includes('credentials');
       
       toast({ 
         title: "Sync Failed", 
         description: res.message || "Connection error", 
         variant: "destructive",
         action: isConfigError ? (
           <Button variant="outline" size="sm" onClick={() => navigate('/email-intake/settings')} className="ml-2 border-white text-white hover:bg-white/20">
             Configure
           </Button>
         ) : undefined
       });
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col p-6">
       <Helmet>
         <title>Email Intake - Amazon Seller Operation</title>
       </Helmet>

       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
             <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Mail className="w-8 h-8 text-[hsl(var(--terracotta))]" /> Email Intake
             </h1>
             <p className="text-slate-400">Process inbound emails from suppliers and partners.</p>
          </div>
          <div className="flex items-center gap-3">
             {lastImport && (
                <span className="text-xs text-slate-500 hidden md:inline">
                   Synced {formatDistanceToNow(lastImport, { addSuffix: true })}
                </span>
             )}
             <Button variant="outline" onClick={handleSync} disabled={isImporting || loading} className="gap-2">
                {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                {isImporting ? 'Syncing...' : 'Sync Emails'}
             </Button>
             <Button variant="secondary" onClick={() => navigate('/email-intake/settings')}>Settings</Button>
          </div>
       </div>

       <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex flex-wrap gap-4 items-center">
          <form onSubmit={handleSearch} className="relative flex-1 min-w-[250px]">
             <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
             <Input 
                placeholder="Search subject or sender..." 
                className="pl-9 bg-slate-800 border-slate-700" 
                value={search}
                onChange={e => setSearch(e.target.value)}
             />
          </form>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
             <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700"><SelectValue placeholder="Status" /></SelectTrigger>
             <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(EMAIL_STATUS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
             </SelectContent>
          </Select>
          <Select value={reviewerFilter} onValueChange={setReviewerFilter}>
             <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700"><SelectValue placeholder="Reviewer" /></SelectTrigger>
             <SelectContent>
                <SelectItem value="all">All Emails</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value={user?.id || 'me'}>Assigned to Me</SelectItem>
             </SelectContent>
          </Select>
          <Button onClick={fetchData} variant="ghost" size="icon" className="text-slate-400 hover:text-white">
             <RefreshCw className="w-4 h-4" />
          </Button>
       </div>

       <div className="rounded-md border border-slate-800 flex-1 overflow-hidden bg-slate-900/50">
          <Table>
             <TableHeader className="bg-slate-900">
                <TableRow>
                   <TableHead>Received</TableHead>
                   <TableHead>From</TableHead>
                   <TableHead>Subject</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Reviewer</TableHead>
                   <TableHead className="w-[50px]"></TableHead>
                   <TableHead className="text-right">Actions</TableHead>
                </TableRow>
             </TableHeader>
             <TableBody>
                {loading ? (
                   <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-500 animate-pulse">Loading emails...</TableCell></TableRow>
                ) : emails.length === 0 ? (
                   <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-500">No emails found in inbox.</TableCell></TableRow>
                ) : (
                   emails.map(email => (
                      <TableRow 
                        key={email.id} 
                        className="cursor-pointer hover:bg-slate-800/50 transition-colors"
                        onClick={() => navigate(`/email-intake/${email.id}`)}
                      >
                         <TableCell className="whitespace-nowrap text-slate-300">{formatEmailDate(email.received_at)}</TableCell>
                         <TableCell className="max-w-[200px] truncate font-medium text-white" title={email.inbound_from}>{email.inbound_from}</TableCell>
                         <TableCell className="max-w-[300px] truncate text-slate-300" title={email.subject}>{email.subject}</TableCell>
                         <TableCell>
                            <Badge variant="outline" className={
                               email.status === 'Processed' ? 'border-green-500 text-green-400' : 
                               email.status === 'Rejected' ? 'border-red-500 text-red-400' : 
                               'border-slate-600 text-slate-300'
                            }>
                               {email.status}
                            </Badge>
                         </TableCell>
                         <TableCell className="text-xs text-slate-500">
                            {email.assigned_reviewer ? 'Assigned' : 'Unassigned'}
                         </TableCell>
                         <TableCell>
                            {/* In a real app, query attachments count. For now, static icon if assumed present */}
                            <Paperclip className="w-4 h-4 text-slate-600 opacity-30" /> 
                         </TableCell>
                         <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                               {!email.assigned_reviewer && (
                                  <Button size="sm" variant="ghost" onClick={(e) => handleAssignToMe(e, email.id)} className="h-7 text-xs">Assign Me</Button>
                               )}
                               <ArrowRight className="w-4 h-4 text-[hsl(var(--terracotta))]" />
                            </div>
                         </TableCell>
                      </TableRow>
                   ))
                )}
             </TableBody>
          </Table>
       </div>
    </div>
  );
};

export default EmailIntakeInboxPage;