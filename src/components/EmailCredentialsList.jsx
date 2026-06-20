import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Activity, RefreshCw, Mail } from 'lucide-react';
import { useConfirm } from '@/context/ConfirmContext';
import { formatDistanceToNow } from 'date-fns';
import { useEmailTest } from '@/hooks/useEmailTest';

const EmailCredentialsList = ({ credentials, loading, onEdit, onDelete, onToggleStatus, onRefresh }) => {
  const { confirm } = useConfirm();
  const { testIMAPConnection, testing } = useEmailTest();
  const [testingId, setTestingId] = useState(null);

  const handleDelete = async (id) => {
    if (await confirm({ title: "Delete Credential", description: "Are you sure? This will stop email imports for this account." })) {
      onDelete(id);
    }
  };

  const handleTest = async (cred) => {
    setTestingId(cred.id);
    // Pass the credential object directly. 
    // The hook will extract imap_server, imap_port, imap_username, imap_password, and id.
    // If password is missing (masked), the Edge Function will use the ID to fetch it.
    await testIMAPConnection(cred);
    setTestingId(null);
    onRefresh(); // Refresh to show new status
  };

  if (loading && credentials.length === 0) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading credentials...</div>;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-slate-900">
            <TableHead>Email Address</TableHead>
            <TableHead>IMAP Server</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Tested</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {credentials.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                 No email accounts configured. Add one to start importing emails.
              </TableCell>
            </TableRow>
          ) : (
            credentials.map((cred) => (
              <TableRow key={cred.id} className="hover:bg-slate-800/50">
                <TableCell className="font-medium text-white flex items-center gap-2">
                   <Mail className="w-4 h-4 text-slate-400" />
                   {cred.email_address}
                </TableCell>
                <TableCell className="text-slate-400">{cred.imap_server}:{cred.imap_port}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch 
                       checked={cred.is_active} 
                       onCheckedChange={() => onToggleStatus(cred.id, cred.is_active)}
                    />
                    <span className="text-xs text-slate-500">{cred.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-300">
                       {cred.last_tested_at ? formatDistanceToNow(new Date(cred.last_tested_at), { addSuffix: true }) : 'Never'}
                    </span>
                    {cred.test_status && (
                       <Badge variant="outline" className={`w-fit mt-1 text-[10px] px-1 py-0 ${cred.test_status === 'Success' ? 'border-green-800 text-green-500' : 'border-red-800 text-red-500'}`}>
                          {cred.test_status}
                       </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                   <div className="flex justify-end gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleTest(cred)}
                        disabled={testing && testingId === cred.id}
                        title="Test Connection"
                      >
                         <Activity className={`w-4 h-4 ${testingId === cred.id ? 'animate-spin text-[hsl(var(--terracotta))]' : 'text-slate-400'}`} />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => onEdit(cred)}>
                         <Edit className="w-4 h-4 text-slate-400" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(cred.id)} className="text-red-500 hover:text-red-400">
                         <Trash2 className="w-4 h-4" />
                      </Button>
                   </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default EmailCredentialsList;