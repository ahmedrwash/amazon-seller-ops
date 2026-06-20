
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
import { Loader2, Search, MoreVertical, ShieldAlert, CheckCircle2, UserCog, User, Users, Info, Shield, Ban, RefreshCw, AlertCircle, WifiOff, UserPlus, Trash2, RotateCcw, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const ROLE_DEFINITIONS = [
  { id: 'admin', name: 'Admin', description: 'Full access to all features, including user management.', color: 'bg-red-100 text-red-800 border-red-200' },
  { id: 'editor', name: 'Editor', description: 'Can create and edit products and operations data.', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'collaborator', name: 'Collaborator', description: 'Can edit operational data but cannot create products.', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'viewer', name: 'Viewer', description: 'Read-only access to products and data.', color: 'bg-stone-100 text-stone-800 border-stone-200' },
];

export default function UserManagement() {
  const { userRole, canManageUsers, user, session } = useAuth();
  const { toast } = useToast();

  const [rows, setRows] = useState([]);            // merged profiles + invites
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchError, setFetchError] = useState(null);

  // Role / access modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [capFinance, setCapFinance] = useState(false);
  const [capUsers, setCapUsers] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Remove-access confirm
  const [removeTarget, setRemoveTarget] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Add user modal
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('editor');
  const [isAddingUser, setIsAddingUser] = useState(false);

  // ── Load: merge profiles (source of truth) with pending invites ──────────────
  const fetchUsers = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [profRes, invRes] = await Promise.all([
        supabase.from('profiles')
          .select('id, email, full_name, role, active, can_manage_users, can_manage_finance, last_login, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('user_accounts')
          .select('id, email, full_name, role, status, auth_id, created_at'),
      ]);

      if (profRes.error) {
        const msg = profRes.error.message || '';
        if (profRes.error.code === '42P01' || msg.includes('does not exist')) {
          setFetchError('Database tables are missing. Please ensure the migration scripts have run successfully.');
        } else if (msg.includes('infinite recursion')) {
          setFetchError('Database policy error: Infinite recursion detected. Please apply the simplified RLS policies.');
        } else if (msg.includes('Failed to fetch') || msg.includes('network')) {
          setFetchError('Network error: Unable to connect to the database. Please check your internet connection.');
        } else {
          setFetchError(msg);
        }
        throw profRes.error;
      }

      const profiles = profRes.data || [];
      const invites = invRes.error ? [] : (invRes.data || []);

      const byEmail = new Map();
      profiles.forEach(p => {
        const key = (p.email || '').toLowerCase();
        byEmail.set(key, {
          key,
          id: p.id,
          inviteId: null,
          email: p.email,
          full_name: p.full_name,
          role: p.role || 'viewer',
          active: p.active !== false,
          can_manage_users: !!p.can_manage_users,
          can_manage_finance: !!p.can_manage_finance,
          last_login: p.last_login,
          created_at: p.created_at,
          source: 'profile',
          status: p.active === false ? 'revoked' : 'active',
        });
      });
      invites.forEach(ua => {
        const key = (ua.email || '').toLowerCase();
        if (byEmail.has(key)) {
          byEmail.get(key).inviteId = ua.id;     // already signed up; keep registry link
        } else {
          byEmail.set(key, {
            key,
            id: null,
            inviteId: ua.id,
            email: ua.email,
            full_name: ua.full_name,
            role: ua.role || 'viewer',
            active: ua.status === 'active',
            can_manage_users: false,
            can_manage_finance: false,
            last_login: null,
            created_at: ua.created_at,
            source: 'invite',
            status: 'invited',
          });
        }
      });

      setRows(Array.from(byEmail.values()));
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

  // ── Role + capability changes ────────────────────────────────────────────────
  const openRoleModal = (u) => {
    if (isPrimaryAdmin(u.email)) {
      toast({ title: 'Action blocked', description: 'The primary admin account cannot be modified.', variant: 'destructive' });
      return;
    }
    setSelectedUser(u);
    setNewRole(u.role || 'viewer');
    setCapFinance(!!u.can_manage_finance);
    setCapUsers(!!u.can_manage_users);
    setChangeReason('');
    setIsRoleModalOpen(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    setIsSubmitting(true);
    try {
      const oldRole = selectedUser.role;

      if (selectedUser.source === 'profile' && selectedUser.id) {
        const { error } = await supabase.from('profiles')
          .update({ role: newRole, can_manage_finance: capFinance, can_manage_users: capUsers })
          .eq('id', selectedUser.id);
        if (error) throw error;

        if (selectedUser.inviteId) {
          await supabase.from('user_accounts').update({ role: newRole }).eq('id', selectedUser.inviteId);
        }

        const { error: histErr } = await supabase.from('user_role_history').insert({
          user_id: selectedUser.id,
          old_role: oldRole,
          new_role: newRole,
          changed_by: user.id,
          reason: changeReason,
        });
        if (histErr) console.warn('Role history not logged:', histErr.message);
      } else if (selectedUser.inviteId) {
        const { error } = await supabase.from('user_accounts').update({ role: newRole }).eq('id', selectedUser.inviteId);
        if (error) throw error;
      }

      toast({ title: 'Access updated successfully' });
      setIsRoleModalOpen(false);
      await fetchUsers();
    } catch (error) {
      console.error('Error changing role:', error);
      toast({ title: 'Error changing role', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Activate / revoke access ─────────────────────────────────────────────────
  const handleToggleActive = async (u, active) => {
    if (isPrimaryAdmin(u.email) && !active) {
      toast({ title: 'Action blocked', description: 'The primary admin cannot be revoked.', variant: 'destructive' });
      return;
    }
    try {
      if (u.source === 'profile' && u.id) {
        const { error } = await supabase.from('profiles').update({ active }).eq('id', u.id);
        if (error) throw error;
        if (u.inviteId) {
          await supabase.from('user_accounts').update({ status: active ? 'active' : 'suspended' }).eq('id', u.inviteId);
        }
      } else if (u.inviteId) {
        const { error } = await supabase.from('user_accounts').update({ status: active ? 'active' : 'suspended' }).eq('id', u.inviteId);
        if (error) throw error;
      }
      toast({ title: active ? 'Access restored' : 'Access revoked' });
      await fetchUsers();
    } catch (error) {
      toast({ title: 'Error updating access', description: error.message, variant: 'destructive' });
    }
  };

  // ── Remove (delete invite, or revoke + delete registry row) ──────────────────
  const handleRemove = async () => {
    const u = removeTarget;
    if (!u) return;
    setIsRemoving(true);
    try {
      if (u.source === 'profile' && u.id) {
        // Can't delete the auth user from the client — revoke access durably.
        const { error } = await supabase.from('profiles').update({ active: false }).eq('id', u.id);
        if (error) throw error;
      }
      if (u.inviteId) {
        await supabase.from('user_accounts').delete().eq('id', u.inviteId);
      }
      toast({
        title: u.source === 'profile' ? 'Access revoked' : 'Invite deleted',
        description: u.source === 'profile'
          ? 'The user can no longer sign in. Delete the auth account from Supabase to remove it entirely.'
          : undefined,
      });
      setRemoveTarget(null);
      await fetchUsers();
    } catch (error) {
      toast({ title: 'Error removing access', description: error.message, variant: 'destructive' });
    } finally {
      setIsRemoving(false);
    }
  };

  // ── Add user (pre-registration / invite) ─────────────────────────────────────
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
      toast({ title: 'User invited', description: `${newUserEmail} is pre-registered as ${newUserRole}. The role applies automatically when they sign up.` });
      setIsAddUserOpen(false);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserRole('editor');
      await fetchUsers();
    } catch (err) {
      toast({ title: 'Error inviting user', description: err.message, variant: 'destructive' });
    } finally {
      setIsAddingUser(false);
    }
  };

  const filteredUsers = rows.filter(u =>
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getRoleColor = (roleId) => {
    const role = ROLE_DEFINITIONS.find(r => r.id === roleId);
    return role ? role.color : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const stats = useMemo(() => {
    const counts = { admin: 0, editor: 0, collaborator: 0, viewer: 0 };
    rows.forEach(u => {
      const r = u.role || 'viewer';
      if (counts[r] !== undefined) counts[r]++;
    });
    return counts;
  }, [rows]);

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

  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-[hsl(var(--terracotta))]" />
        <p className="text-slate-500 font-medium">Loading user accounts...</p>
      </div>
    );
  }

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
          <p className="text-slate-500 mt-1">Manage roles, access, and capabilities. Roles take effect immediately.</p>
        </div>
        <Button onClick={() => setIsAddUserOpen(true)} className="bg-[hsl(var(--terracotta))] hover:opacity-90 text-white">
          <UserPlus className="h-4 w-4 mr-2" /> Invite User
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
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 mb-6 flex gap-3 shadow-sm">
            <Info className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-600" />
            <div>
              <h3 className="font-semibold mb-1">Administrator Privileges Active</h3>
              <p className="text-sm opacity-90">
                Roles (<strong>admin / editor / collaborator / viewer</strong>) and the <strong>Finance</strong>/<strong>User-management</strong> capabilities
                are enforced everywhere immediately. Changes are recorded in the audit trail. The primary admin account cannot be modified.
              </p>
            </div>
          </div>

          {/* Stats */}
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
                    <TableHead>Capabilities</TableHead>
                    <TableHead>Status</TableHead>
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
                      return (
                        <TableRow key={u.key}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                {u.role === 'admin' ? <ShieldAlert className="h-5 w-5 text-red-500" /> : <User className="h-5 w-5 text-slate-500" />}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-slate-900 flex flex-wrap items-center gap-2">
                                  <span className="truncate max-w-[200px]">{u.full_name || 'No Name Provided'}</span>
                                  {isPrimary && <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200 whitespace-nowrap"><Shield className="w-3 h-3 mr-1" /> Primary Admin</Badge>}
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
                            <div className="flex flex-wrap gap-1">
                              {u.can_manage_finance && <Badge variant="secondary" className="bg-green-100 text-green-800 whitespace-nowrap">Finance</Badge>}
                              {u.can_manage_users && <Badge variant="secondary" className="bg-purple-100 text-purple-800 whitespace-nowrap">Users</Badge>}
                              {!u.can_manage_finance && !u.can_manage_users && <span className="text-xs text-slate-400">—</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              {u.status === 'invited' ? (
                                <><Mail className="h-3.5 w-3.5 text-blue-400" /><span className="text-sm text-blue-600">Invited</span></>
                              ) : u.status === 'revoked' ? (
                                <><div className="h-2 w-2 rounded-full bg-red-500" /><span className="text-sm text-red-600">Revoked</span></>
                              ) : (
                                <><div className="h-2 w-2 rounded-full bg-green-500" /><span className="text-sm text-slate-700">Active</span></>
                              )}
                            </div>
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
                                  <UserCog className="h-4 w-4 mr-2" /> Edit Role &amp; Access
                                </DropdownMenuItem>

                                <div className="h-px bg-slate-200 my-1 mx-2" />

                                {u.status === 'revoked' || (u.status === 'invited' && !u.active) ? (
                                  <DropdownMenuItem onClick={() => handleToggleActive(u, true)} disabled={isPrimary}>
                                    <RotateCcw className="h-4 w-4 mr-2 text-green-500" /> Restore Access
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleToggleActive(u, false)} disabled={isPrimary}>
                                    <Ban className="h-4 w-4 mr-2 text-amber-500" /> Revoke Access
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuItem
                                  onClick={() => setRemoveTarget(u)}
                                  disabled={isPrimary}
                                  className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> {u.source === 'invite' ? 'Delete Invite' : 'Remove User'}
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

      {/* Invite User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Pre-register a user by email and assign a role. When they sign up, the role is applied automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Full Name (optional)</Label>
              <Input
                placeholder="Full name"
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
              Invite User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role & Access Dialog */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Edit Role &amp; Access</DialogTitle>
            <DialogDescription>
              Update permissions for <span className="font-medium text-slate-900">{selectedUser?.email}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
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

            {/* Capability flags (only meaningful for signed-up users) */}
            <div className="space-y-2">
              <Label>Extra Capabilities</Label>
              {selectedUser?.source === 'profile' ? (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300"
                      checked={capFinance} onChange={(e) => setCapFinance(e.target.checked)} />
                    Finance access (view Finance &amp; Growth, regardless of role)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300"
                      checked={capUsers} onChange={(e) => setCapUsers(e.target.checked)} />
                    User management (manage other users)
                  </label>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Capabilities can be set once the user has signed up.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Reason for change (required for audit trail)</Label>
              <Textarea
                placeholder="e.g. Promoted to operations manager"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleRoleChange}
              disabled={
                isSubmitting ||
                !changeReason.trim() ||
                (newRole === selectedUser?.role &&
                 capFinance === !!selectedUser?.can_manage_finance &&
                 capUsers === !!selectedUser?.can_manage_users)
              }
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove / Revoke confirm */}
      <Dialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{removeTarget?.source === 'invite' ? 'Delete Invite' : 'Remove User'}</DialogTitle>
            <DialogDescription>
              {removeTarget?.source === 'invite' ? (
                <>This will delete the pending invite for <span className="font-medium text-slate-900">{removeTarget?.email}</span>.</>
              ) : (
                <>This will revoke all access for <span className="font-medium text-slate-900">{removeTarget?.email}</span>. They will be signed out and blocked from the app. The login account itself must be deleted from the Supabase dashboard to remove it permanently.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>Cancel</Button>
            <Button onClick={handleRemove} disabled={isRemoving} className="bg-red-600 hover:bg-red-700 text-white">
              {isRemoving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              {removeTarget?.source === 'invite' ? 'Delete Invite' : 'Revoke Access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
