
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/context/AuthContext';
import { canManageUsers } from '@/lib/permissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldAlert, Edit, UserCog, User, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ROLES = [
  { name: 'admin', description: 'Full access to all system features and user management' },
  { name: 'editor', description: 'Can create and edit products and operational data' },
  { name: 'collaborator', description: 'Can edit operational data and tasks, cannot create products' },
  { name: 'viewer', description: 'Read-only access to products and operational data' },
];

export default function AdminUsersManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [roleChangeReason, setRoleChangeReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    checkAuthorizationAndLoadData();
  }, [user]);

  const checkAuthorizationAndLoadData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const authorized = await canManageUsers(user.id);
      if (!authorized) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }
      setIsAuthorized(true);
      await loadUsers();
    } catch (err) {
      setError('Failed to verify authorization or load data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('user_accounts')
      .select('id, auth_id, email, full_name, role, status, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    setUsers(data || []);
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const { error } = await supabase
        .from('user_accounts')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      toast({ title: 'Status Updated', description: 'User status has been updated successfully.' });
    } catch (err) {
      toast({ title: 'Update Failed', description: err.message, variant: 'destructive' });
    }
  };

  const openRoleModal = (u) => {
    setSelectedUser(u);
    setNewRole(u.role || 'viewer');
    setRoleChangeReason('');
    setIsRoleModalOpen(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    setIsUpdating(true);
    try {
      const { error: updateError } = await supabase
        .from('user_accounts')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', selectedUser.id);
      if (updateError) throw updateError;

      await supabase.from('user_role_history').insert({
        user_id: selectedUser.id,
        old_role: selectedUser.role,
        new_role: newRole,
        changed_by: user.id,
        reason: roleChangeReason || null,
      });

      await loadUsers();
      setIsRoleModalOpen(false);
      toast({ title: 'Role Updated', description: `${selectedUser.full_name || selectedUser.email} is now ${newRole}.` });
    } catch (err) {
      toast({ title: 'Update Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-red-50 text-red-700 border-red-200';
      case 'editor': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'collaborator': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'viewer': return 'bg-gray-50 text-gray-600 border-gray-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-50 text-green-700 border-green-200';
      case 'inactive': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'suspended': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--terracotta))]" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="p-8 max-w-3xl mx-auto min-h-[60vh]">
        <Alert variant="destructive" className="bg-white">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="text-lg font-heading">Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access user management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--parchment))] pb-12">
      <header className="bg-[hsl(var(--cinder))] text-[hsl(var(--parchment))] p-6 shadow-md mb-6">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl">User Management</h1>
            <p className="opacity-80 text-sm mt-1">Manage user roles, permissions, and account status</p>
          </div>
          <Shield className="w-8 h-8 opacity-50" />
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 md:px-6 space-y-6">
        {error && (
          <Alert variant="destructive" className="bg-white">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-white rounded-[var(--radius)] shadow-sm border border-[hsl(var(--border))] overflow-hidden">
            <div className="p-4 border-b border-[hsl(var(--border))] bg-slate-50 flex justify-between items-center">
              <h2 className="font-heading text-xl text-[hsl(var(--cinder))]">System Users</h2>
              <span className="text-sm text-slate-500">{users.length} user{users.length !== 1 ? 's' : ''}</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-[hsl(var(--cinder))]">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 opacity-50" />
                        {u.full_name || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{u.email}</TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeClass(u.role)}`}>
                        {u.role ? u.role.toUpperCase() : 'NO ROLE'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select value={u.status || 'active'} onValueChange={(val) => handleStatusChange(u.id, val)}>
                        <SelectTrigger className={`h-8 w-28 text-xs font-semibold rounded-full border ${getStatusBadgeClass(u.status || 'active')}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openRoleModal(u)}>
                        <UserCog className="w-4 h-4 mr-2" />
                        Change Role
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-5 rounded-[var(--radius)] shadow-sm border border-[hsl(var(--border))]">
              <h3 className="font-heading text-lg mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[hsl(var(--terracotta))]" />
                Role Descriptions
              </h3>
              <div className="space-y-4">
                {ROLES.map(r => (
                  <div key={r.name} className="border-b border-[hsl(var(--border))] pb-3 last:border-0 last:pb-0">
                    <span className={`inline-block mb-1 px-2 py-0.5 text-xs font-bold rounded-full border ${getRoleBadgeClass(r.name)}`}>
                      {r.name.toUpperCase()}
                    </span>
                    <p className="text-sm text-slate-600 leading-tight mt-1">{r.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-[var(--radius)] shadow-sm border border-[hsl(var(--border))]">
              <h3 className="font-heading text-lg mb-2 flex items-center gap-2">
                <UserCog className="w-5 h-5 text-[hsl(var(--terracotta))]" />
                Invite a User
              </h3>
              <p className="text-sm text-slate-500">
                Ask the user to sign up at the app URL. Once they register, they will appear here and you can assign their role.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.full_name || selectedUser?.email}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Select Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r.name} value={r.name}>{r.name.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input
                value={roleChangeReason}
                onChange={(e) => setRoleChangeReason(e.target.value)}
                placeholder="e.g. Promoted to manager"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleModalOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={isUpdating}
              className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta-light))] text-white"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Edit className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
