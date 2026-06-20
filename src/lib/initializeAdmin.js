
import { supabase } from '@/lib/customSupabaseClient';

// Disabled - causing network errors
// Admin is already set in database
export const ensureAdminUser = async () => {
  console.log('Admin initialization disabled - admin already configured');
  return true;
};
