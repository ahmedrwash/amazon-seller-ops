
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { ROLES } from '@/constants/roleConstants';
import { retryOperation, getFriendlyErrorMessage } from '@/utils/networkUtils';
import { getUserRole, clearRoleCache } from '@/lib/permissions';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Authorization State
  const [allowedMarketplaceIds, setAllowedMarketplaceIds] = useState([]);
  const [canManageUsersState, setCanManageUsersState] = useState(false);
  const [canManageFinance, setCanManageFinance] = useState(false);
  const [hasOpsHubAccess, setHasOpsHubAccess] = useState(false);
  const [userRole, setUserRole] = useState('viewer');
  const [modulePermissions, setModulePermissions] = useState({}); // per-user overrides: { module_id: row }

  const refreshProfile = async (userId) => {
    if (!userId) return null;
    try {
      const { data, error } = await retryOperation(() => 
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()
      );
      
      if (error) {
        if (error.code === '42P17' || error.code === '42501') {
          console.warn('Profile fetch restricted by RLS or recursion. Using fallback.');
          return null;
        }
        console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
  };

  const refreshUserRole = async (userId) => {
    if (!userId) return;
    clearRoleCache(userId);
    const role = await getUserRole(userId);
    setUserRole(role);
    return role;
  };

  // Per-user module access overrides (UX layer; RLS is the real gate).
  const loadModulePermissions = async (userId) => {
    if (!userId) { setModulePermissions({}); return {}; }
    try {
      const { data, error } = await supabase
        .from('user_module_permissions')
        .select('module_id, can_view, can_create, can_edit, can_delete, can_export')
        .eq('user_id', userId);
      if (error) { setModulePermissions({}); return {}; }
      const map = {};
      (data || []).forEach(r => { map[r.module_id] = r; });
      setModulePermissions(map);
      return map;
    } catch {
      setModulePermissions({});
      return {};
    }
  };

  const provisionProfile = async (authUser) => {
    if (!authUser) return null;
    
    let userProfile = await refreshProfile(authUser.id);

    if (!userProfile) {
      const newProfile = {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
        role: authUser.user_metadata?.role || ROLES.VIEWER,
        active: true,
        last_login: new Date().toISOString(),
        allowed_marketplace_ids: [],
        can_manage_users: false,
        can_manage_finance: false,
        ops_hub: true
      };

      try {
        const { data, error } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .maybeSingle();

        if (error) {
          if (error.code === '23505') {
             userProfile = await refreshProfile(authUser.id);
             if (userProfile) {
               await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', authUser.id);
             }
          } else {
             userProfile = { ...newProfile, is_fallback: true };
          }
        } else {
          userProfile = data;
        }
      } catch (err) {
        userProfile = { ...newProfile, is_fallback: true };
      }
    } else {
      supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', authUser.id).then(() => {});
    }
    
    return userProfile;
  };

  // Authorization Methods
  const hasMarketplaceAccess = (marketplaceId) => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    return allowedMarketplaceIds.includes(marketplaceId);
  };

  const canEditRecord = (record) => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    if (profile.role === 'viewer') return false;
    
    const isCreator = record?.created_by === user?.id;
    const isOwner = record?.owner_id === user?.id;
    const isAssigned = record?.assigned_to === user?.id;

    return isCreator || isOwner || isAssigned;
  };

  const canDeleteRecord = (record) => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    if (profile.role === 'viewer') return false;

    return record?.created_by === user?.id;
  };

  const canApproveFinance = () => {
    if (!profile) return false;
    return profile.role === 'admin' || canManageFinance;
  };

  const checkEmailVerified = () => {
    if (!user) return false;
    return !!user.email_confirmed_at;
  };

  useEffect(() => {
    if (profile) {
      setAllowedMarketplaceIds(profile.allowed_marketplace_ids || []);
      // Admins (by role) can always manage users; otherwise honor the capability flag.
      setCanManageUsersState(profile.role === 'admin' || profile.can_manage_users || userRole === 'admin');
      setCanManageFinance(profile.role === 'admin' || profile.can_manage_finance);
      setHasOpsHubAccess(profile.role === 'admin' || profile.ops_hub);
    } else {
      setAllowedMarketplaceIds([]);
      setCanManageUsersState(false);
      setCanManageFinance(false);
      setHasOpsHubAccess(false);
    }
  }, [profile, userRole]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await retryOperation(() => supabase.auth.getSession());
        if (error) throw error;

        if (mounted) {
          if (session?.user) {
            setSession(session);
            setUser(session.user);
            await refreshUserRole(session.user.id);
            const userProfile = await provisionProfile(session.user);
            setProfile(userProfile);
            await loadModulePermissions(session.user.id);
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
            setUserRole('viewer');
            setModulePermissions({});
          }
        }
      } catch (err) {
        if (mounted) {
          console.error("Auth initialization error:", err);
          setError(getFriendlyErrorMessage(err));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await refreshUserRole(session.user.id);
        if (!profile || profile.id !== session.user.id) {
          const userProfile = await provisionProfile(session.user);
          setProfile(userProfile);
        }
        await loadModulePermissions(session.user.id);
      } else {
        setProfile(null);
        setUserRole('viewer');
        setModulePermissions({});
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, fullName) => {
    try {
      const { data, error } = await retryOperation(() => supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      }));
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getFriendlyErrorMessage(error));
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await retryOperation(() => supabase.auth.signInWithPassword({ email, password }));
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getFriendlyErrorMessage(error));
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getFriendlyErrorMessage(error));
    }
  };

  const signOut = async () => {
    try {
      const { error } = await retryOperation(() => supabase.auth.signOut());
      if (error) throw error;
      setUser(null);
      setSession(null);
      setProfile(null);
      setUserRole('viewer');
      clearRoleCache();
    } catch (error) {
      console.error("Error signing out:", error);
      setUser(null);
      setSession(null);
      setProfile(null);
      setUserRole('viewer');
      clearRoleCache();
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    try {
      const { error } = await retryOperation(() => supabase.from('profiles').update(updates).eq('id', user.id));
      if (error) throw error;
      const updated = await refreshProfile(user.id);
      setProfile(updated);
      return updated;
    } catch (error) {
      throw new Error(getFriendlyErrorMessage(error));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        error,
        userRole,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        updateProfile,
        refreshProfile: () => refreshProfile(user?.id),
        refreshUserRole: () => refreshUserRole(user?.id),
        checkEmailVerified,
        allowedMarketplaceIds,
        canManageUsers: canManageUsersState,
        canManageFinance,
        hasOpsHubAccess,
        hasMarketplaceAccess,
        canEditRecord,
        canDeleteRecord,
        canApproveFinance,
        modulePermissions,
        refreshModulePermissions: () => loadModulePermissions(user?.id)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
