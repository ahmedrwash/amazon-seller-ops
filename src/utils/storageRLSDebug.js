import { supabase } from '@/lib/customSupabaseClient';

/**
 * Checks the status of Storage RLS policies by calling a helper RPC function.
 * Note: Requires the 'debug_storage_policies' RPC function to be created in the database.
 */
export async function checkStorageRLSStatus() {
  console.group('🔍 Storage RLS Debug');
  try {
    // 1. Check if we can list buckets (basic connectivity)
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Failed to list buckets:', bucketError.message);
      return { status: 'error', error: bucketError };
    }
    
    console.log('✅ Buckets found:', buckets.map(b => `${b.name} (${b.public ? 'public' : 'private'})`));

    // 2. Check policies via RPC (if available)
    const { data: policies, error: rpcError } = await supabase.rpc('debug_storage_policies');
    
    if (rpcError) {
      console.warn('⚠️ Could not fetch detailed policy list (RPC function missing). Proceeding with behavioral tests only.');
    } else {
      console.log('✅ Active Storage Policies:', policies);
      
      const hasAdminPolicy = policies.some(p => p.policy_name.includes('Admin'));
      const hasOpsPolicy = policies.some(p => p.policy_name.includes('Ops') || p.policy_name.includes('Finance'));
      const hasReadPolicy = policies.some(p => p.policy_name.includes('Read'));
      
      console.log('Policy Check:', {
        Admin: hasAdminPolicy ? '✅' : '❌',
        OpsFinance: hasOpsPolicy ? '✅' : '❌',
        Read: hasReadPolicy ? '✅' : '❌'
      });
    }

    return { status: 'ok', buckets, policies };
  } catch (err) {
    console.error('❌ Unexpected error in RLS check:', err);
    return { status: 'error', error: err };
  } finally {
    console.groupEnd();
  }
}

/**
 * Verifies if a specific bucket has basic access.
 */
export async function verifyBucketPolicies(bucketName) {
  try {
    const { data, error } = await supabase.storage.from(bucketName).list();
    if (error) {
      console.error(`❌ Bucket '${bucketName}' access failed:`, error.message);
      return false;
    }
    console.log(`✅ Bucket '${bucketName}' is accessible.`);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Performs a comprehensive CRUD test on a specific bucket to determine effective permissions.
 */
export async function testStorageAccess(bucketName, fileName = 'rls-test-file.txt') {
  const results = {
    upload: false,
    read: false,
    delete: false,
    errors: {}
  };
  
  const testContent = new Blob(['RLS Policy Test Content'], { type: 'text/plain' });

  // 1. Test Upload
  try {
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, testContent, { upsert: true });

    if (uploadError) {
      results.errors.upload = uploadError.message;
    } else {
      results.upload = true;
    }
  } catch (e) { results.errors.upload = e.message; }

  // 2. Test Read (only if upload worked or file exists)
  try {
    const { data, error: readError } = await supabase.storage
      .from(bucketName)
      .download(fileName);

    if (readError) {
      results.errors.read = readError.message;
    } else {
      results.read = true;
    }
  } catch (e) { results.errors.read = e.message; }

  // 3. Test Delete
  try {
    // Only attempt delete if we uploaded it or want to try cleanup
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([fileName]);

    if (deleteError) {
      results.errors.delete = deleteError.message;
    } else {
      results.delete = true;
    }
  } catch (e) { results.errors.delete = e.message; }

  return results;
}