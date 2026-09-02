import { getSupabaseClient } from '../config/supabase.js';

export async function deleteAccount(userId: string): Promise<void> {
  const { error } = await getSupabaseClient().auth.admin.deleteUser(userId);

  if (error) {
    throw error;
  }
}