import { supabase } from '@/lib/customSupabaseClient';
import { readAdvertisingFile } from '@/utils/advertisingFiles';

export async function advertisingAction(action, args = {}) {
  const { data, error } = await supabase.rpc('advertising_import', { payload: { ...args, action } });
  if (error) throw error; return data;
}
export async function stageAdvertisingFile(accountId, file, nativeType, contract) {
  const parsed = await readAdvertisingFile(file, nativeType);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Sign in again before uploading.');
  const path = `${user.id}/${accountId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const bucket = supabase.storage.from('advertising-imports');
  const uploaded = await bucket.upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
  if (uploaded.error) throw uploaded.error;
  try {
    const staged = await advertisingAction('stage', { account_id: accountId, file_name: file.name, storage_path: path, contract, ...parsed });
    if (staged.duplicate) await bucket.remove([path]);
    return staged;
  } catch (stageError) {
    await bucket.remove([path]); throw stageError;
  }
}
export async function originalAdvertisingFile(path) {
  const { data, error } = await supabase.storage.from('advertising-imports').createSignedUrl(path, 60);
  if (error) throw error; return data.signedUrl;
}
