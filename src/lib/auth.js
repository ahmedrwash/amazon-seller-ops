
import { supabase } from './customSupabaseClient';

/**
 * Retrieves the currently authenticated user from Supabase.
 * Includes error handling and console logging for debugging.
 * @returns {Promise<Object|null>} The user object or null if not authenticated.
 */
export async function getCurrentUser() {
  try {
    console.log('[Auth] Attempting to get current user...');
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('[Auth] Error getting user:', error.message);
      return null;
    }
    
    if (data?.user) {
      console.log('[Auth] User successfully retrieved:', data.user.id);
      return data.user;
    }
    
    console.log('[Auth] No user currently logged in.');
    return null;
  } catch (err) {
    console.error('[Auth] Unexpected error in getCurrentUser:', err);
    return null;
  }
}

/**
 * Verifies if the authenticated user has access to the products table.
 * Attempts a limit(1) SELECT query.
 * @returns {Promise<boolean>} True if access is granted, false otherwise.
 */
export async function checkUserAccess() {
  try {
    console.log('[Auth] Verifying user access to products table...');
    
    // Check if we can read from the products table (verifies RLS policies)
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1);
      
    if (error) {
      console.error('[Auth] Access verification failed:', error.message, error.details);
      return false;
    }
    
    console.log('[Auth] User access verified successfully. Accessible rows:', data?.length || 0);
    return true; // We don't require rows to exist, just that the query doesn't throw a policy violation error
  } catch (err) {
    console.error('[Auth] Unexpected error verifying access:', err);
    return false;
  }
}
