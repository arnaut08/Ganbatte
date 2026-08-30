import type { Request, Response } from 'express';
import { getSupabaseClient, isSupabaseConfigured } from '../config/supabase.js';

/** Payload returned by the `record_user_activity` Postgres RPC. */
export type RecordUserActivityResult = {
  current_streak: number;
  streak_extended: boolean;
  /** Tier stored on the profile before this activity was recorded. */
  previous_tier: string;
};

/** Supabase-js generic RPC signature used for the untyped database handle. */
type RpcClient = {
  rpc: (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: Error | null }>;
};

/**
 * PostgREST hands `json` function results back as parsed objects, but stay
 * defensive: a string-encoded body must never silently skip the popup.
 */
function normalizeActivityResult(data: unknown): RecordUserActivityResult | null {
  if (!data) return null;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as RecordUserActivityResult;
    } catch {
      return null;
    }
  }
  return data as RecordUserActivityResult;
}

/**
 * Records a learning action (first correct Kana recall, Vocab stage clear,
 * Kanji session completion, PvP match end) for the authenticated user. The
 * `record_user_activity` RPC owns the streak bookkeeping so the count stays
 * consistent across devices.
 */
export async function recordActivity(req: Request, res: Response): Promise<void> {
  if (!isSupabaseConfigured()) {
    res.status(503).json({ error: 'Supabase is not configured.' });
    return;
  }

  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  try {
    const rpcClient = getSupabaseClient() as unknown as RpcClient;
    const { data, error } = await rpcClient.rpc('record_user_activity', { p_user_id: userId });

    if (error) throw error;

    const activity = normalizeActivityResult(data);
    res.json({
      activity: activity ?? { current_streak: 0, streak_extended: false, previous_tier: 'N5 NOVICE' },
    });
  } catch (error) {
    console.error('Activity recording failed:', error);
    res.status(500).json({ error: 'Unable to record activity.' });
  }
}
