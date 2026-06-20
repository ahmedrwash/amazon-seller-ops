
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/context/AuthContext';
import { isPrimaryAdmin } from '@/lib/permissions';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, MoreVertical, ShieldAlert, CheckCircle2, UserCog, User, Users, Info, Shield, Ban, RefreshCw, AlertCircle, WifiOff, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

const ROLE_DEFINITIONS = [
  { id: 'admin', name: 'Admin', description: 'Full access to all system features including user management.', color: 'bg-red-100 text-red-800 border-red-200' },
  { id: 'editor', name: 'Editor', description: 'Can create and edit products and operations data.', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'collaborator', name: 'Collaborator', description: 'Can edit specific operational data but cannot create products.', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'viewer', name: 'Viewer', description: 'Read-only access to products and data.', color: 'bg-stone-100 text-stone-800 border-stone-200' },
];

const STATUS_DEFINITIONS = [
  { id: 'active', name: 'Active', color: 'bg-green-500' },
  { id: 'inactive', name: 'Inactive', color: 'bg-slate-300' },
  { id: 'suspended', name: 'Suspended', color: 'bg-red-500' }
];

export default function UserManagement() {
  const { userRole, canManageUsers, user, session } = useAuth();
  const { toast } = useToast();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchError, setFetchError] = useState(null);
  
  // Role change modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add user modal
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('editor');
  const [isAddingUser, setIsAddingUser] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          setFetchError('Database tables are missing. Please ensure the migration scripts have run successfully.');
        } else if (error.message.includes('infinite recursion')) {
          setFetchError('Database policy error: Infinite recursion detected. Please apply the simplified RLS policies.');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
          setFetchError('Network error: Unable to connect to the database. Please check your internet connection.');
        } else {
          setFetchError(error.message);
        }
        throw error;
      }
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (!fetchError) {
        toast({ title: 'Error loading users', description: error.message, variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (canManageUsers || userRole === 'admin')) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [user, canManageUsers, userRole]);

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      if (targetUser && isPrimaryAdmin(targetUser.email) && newStatus !== 'active') {
        toast({ title: 'Action blocked', description: 'Primary admin cannot be deactivated or suspended.', variant: 'destructive' });
        return;
      }

      const { error } = await supabase
        .from('user_accounts')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;
      
      toast({ title: `User status changed to ${newStatus}` });
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error updating status', description: error.message, variant: 'destructive' });
    }
  };

  const openRoleModal = (u) => {
    if (isPrimaryAdmin(u.email)) {
      toast({ title: 'Action blocked', description: 'Primary admin role cannot be changed.', variant: 'destructive' });
      return;
    }
    setSelectedUser(u);
    setNewRole(u.role || 'editor');
    setChangeReason('');
    setIsRoleModalOpen(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    setIsSubmitting(true);
    
    try {
      const oldRole = selectedUser.role;
      
      const { error: updateError } = await supabase
        .from('user_accounts')
        .update({ role: newRole })
        .eq('id', selectedUser.id);
        
      if (updateError) throw updateError;
      
      const { error: historyError } = await supabase
        .from('user_role_history')
        .insert({
          user_id: selectedUser.id,
          old_role: oldRole,
          new_role: newRole,
          changed_by: user.id,
          reason: changeReason
        });
        
      if (historyError) {
        console.warn('Failed to log role history, but role was updated:', historyError);
      }
      
      toast({ title: 'Role updated successfully' });
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u));
      setIsRoleModalOpen(false);
    } catch (error) {
      console.error('Error changing role:', error);
      toast({ title: 'Error changing role', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail.trim()) return;
    setIsAddingUser(true);
    try {
      const { error } = await supabase.from('user_accounts').insert({
        email: newUserEmail.trim().toLowerCase(),
        full_name: newUserName.trim() || null,
        role: newUserRole,
        status: 'active',
      });
      if (error) throw error;
      toast({ title: 'User added', description: `${newUserEmail} has been pre-registered as ${newUserRole}. They can now sign up and will get this role automatically.` });
      setIsAddUserOpen(false);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserRole('editor');
      await fetchUsers();
    } catch (err) {
      toast({ title: 'Error adding user', description: err.message, variant: 'destructive' });
    } finally {
      setIsAddingUser(false);
    }
  };

  const filteredUsers = users.filter(u =>
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getRoleColor = (roleId) => {
    const role = ROLE_DEFINITIONS.find(r => r.id === roleId);
    return role ? role.color : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const stats = useMemo(() => {
    const counts = { admin: 0, editor: 0, collaborator: 0, viewer: 0 };
    users.forEach(u => {
      const r = u.role || 'viewer';
      if (counts[r] !== undefined) counts[r]++;
    });
    return counts;
  }, [users]);

  // Auth Check
  if (!user || !session) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center p-8 bg-[hsl(var(--parchment))]">
        <User className="h-16 w-16 text-slate-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Not Authenticated</h2>
        <p className="text-slate-600 mb-6 max-w-md">You must be logged in to view the User Management area.</p>
        <Button asChild>
          <Link to="/auth">Log In</Link>
        </Button>
      </div>
    );
  }

  // Loading Check
  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-[hsl(var(--terracotta))]" />
        <p className="text-slate-500 font-medium">Loading user accounts...</p>
      </div>
    );
  }

  // Admin Check
  if (!canManageUsers && userRole !== 'admin') {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center p-8 bg-[hsl(var(--parchment))]">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-600 mb-6 max-w-md">You do not have permission to access the User Management area. This section is restricted to administrators.</p>
        <Button asChild>
          <Link to="/">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl animate-in fade-in zoom-in-95">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-heading text-[hsl(var(--cinder))] flex items-center gap-3">
            <Users className="h-8 w-8 text-[hsl(var(--terracotta))]" />
            User Management
          </h1>
          <p className="text-slate-500 mt-1">Manage user roles, permissions, and account statuses.</p>
        </div>
        <Button onClick={() => setIsAddUserOpen(true)} className="bg-[hsl(var(--terracotta))] hover:opacity-90 text-white">
          <UserPlus className="h-4 w-4 mr-2" /> Add User
        </Button>
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 flex flex-col items-center text-center">
          {fetchError.includes('Network') ? <WifiOff className="h-10 w-10 text-red-500 mb-3" /> : <AlertCircle className="h-10 w-10 text-red-500 mb-3" />}
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3>
          <p className="text-red-600 mb-4">{fetchError}</p>
          <Button onClick={fetchUsers} variant="outline" className="bg-white hover:bg-red-50">
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      )}

      {!fetchError && (
        <>
          {/* Admin Info Box */}
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 mb-6 flex gap-3 shadow-sm">
            <Info className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-600" />
            <div>
              <h3 className="font-semibold mb-1">Administrator Privileges Active</h3>
              <p className="text-sm opacity-90">
                You can modify the roles and access levels of all users in the system. Changes are recorded in the audit trail.
                The primary admin account cannot be demoted, deactivated, or suspended.
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl border border-[hsl(var(--border))] shadow-sm flex flex-col items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-red-500 mb-2" />
              <span className="text-2xl font-bold text-slate-900">{stats.admin}</span>
              <span className="text-sm text-slate-500 font-medium">Admins</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[hsl(var(--border))] shadow-sm flex flex-col items-center justify-center">
              <UserCog className="h-6 w-6 text-blue-500 mb-2" />
              <span className="text-2xl font-bold text-slate-900">{stats.editor}</span>
              <span className="text-sm text-slate-500 font-medium">Editors</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[hsl(var(--border))] shadow-sm flex flex-col items-center justify-center">
              <Users className="h-6 w-6 text-amber-500 mb-2" />
              <span className="text-2xl font-bold text-slate-900">{stats.collaborator}</span>
              <span className="text-sm text-slate-500 font-medium">Collaborators</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[hsl(var(--border))] shadow-sm flex flex-col items-center justify-center">
              <User className="h-6 w-6 text-stone-500 mb-2" />
              <span className="text-2xl font-bold text-slate-900">{stats.viewer}</span>
              <span className="text-sm text-slate-500 font-medium">Viewers</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {ROLE_DEFINITIONS.map(role => (
              <div key={role.id} className="bg-white p-4 rounded-xl border border-[hsl(var(--border))] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border capitalize ${role.color}`}>
                    {role.name}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{role.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[hsl(var(--border))] overflow-hidden">
            <div className="p-4 border-b border-[hsl(var(--border))] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search users by name or email..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-sm font-medium text-slate-500">
                  Total Users: {filteredUsers.length}
                </div>
                <Button variant="outline" size="sm" onClick={fetchUsers}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[250px]">User Details</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                        No users found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => {
                      const isPrimary = isPrimaryAdmin(u.email);
                      const statusDef = STATUS_DEFINITIONS.find(s => s.id === (u.status || 'active'));
                      
                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                {u.role === 'admin' ? <ShieldAlert className="h-5 w-5 text-red-500" /> : <User className="h-5 w-5 text-slate-500" />}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-slate-900 flex flex-wrap items-center gap-2">
                                  <span className="truncate max-w-[200px]">{u.full_name || 'No Name Provided'}</span>
                                  {isPrimary && <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200 whitespace-nowrap"><Shield className="w-3 h-3 mr-1"/> Primary Admin</Badge>}
                                </div>
                                <div className="text-sm text-slate-500 truncate">{u.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize whitespace-nowrap ${getRoleColor(u.role)}`}>
                              {u.role || 'viewer'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <div className={`h-2 w-2 rounded-full ${statusDef?.color || 'bg-slate-300'}`} />
                              <span className="text-sm capitalize text-slate-700">{u.status || 'active'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Unknown'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => openRoleModal(u)} disabled={isPrimary}>
                                  <UserCog className="h-4 w-4 mr-2" /> Change Role
                                </DropdownMenuItem>
                                
                                <div className="h-px bg-slate-200 my-1 mx-2" />
                                
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(u.id, 'active')}
                                  disabled={isPrimary || u.status === 'active'}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Set Active
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(u.id, 'inactive')}
                                  disabled={isPrimary || u.status === 'inactive'}
                                >
                                  <User className="h-4 w-4 mr-2 text-slate-500" /> Set Inactive
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(u.id, 'suspended')}
                                  disabled={isPrimary || u.status === 'suspended'}
                                  className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                >
                                  <Ban className="h-4 w-4 mr-2" /> Suspend User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Pre-register a user by email. Their role will be set immediately. When they sign up, they'll be linked automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input
                type="email"
                placeholder="neemat@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Full Name (optional)</Label>
              <Input
                placeholder="Neemat Ahmed"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_DEFINITIONS.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">{ROLE_DEFINITIONS.find(r => r.id === newUserRole)?.description}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAddUser}
              disabled={isAddingUser || !newUserEmail.trim()}
              className="bg-[hsl(var(--terracotta))] hover:opacity-90 text-white"
            >
              {isAddingUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update system permissions for <span className="font-medium text-slate-900">{selectedUser?.email}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_DEFINITIONS.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      <span className="capitalize">{role.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newRole && (
                <p className="text-sm text-slate-500 mt-2 bg-slate-50 p-3 rounded-md border border-slate-100">
                  {ROLE_DEFINITIONS.find(r => r.id === newRole)?.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Reason for change (Required for audit trail)</Label>
              <Textarea 
                placeholder="e.g. Promoted to operations manager"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
            <Button onClick={handleRoleChange} disabled={isSubmitting || newRole === selectedUser?.role || !changeReason.trim()}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
