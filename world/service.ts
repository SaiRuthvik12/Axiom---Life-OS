/**
 * World Service — Supabase persistence layer for world state.
 *
 * Stores the entire WorldState as a JSONB document.
 * Falls back gracefully when Supabase is not configured (demo mode).
 */

import { supabase } from '../lib/supabase';
import type { WorldState } from './types';

export const WorldService = {

  async getWorldState(userId: string): Promise<WorldState | null> {
    try {
      const { data, error } = await supabase
        .from('world_states')
        .select('state')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        console.error('[World] Error fetching world state:', error);
        return null;
      }

      return data?.state as WorldState ?? null;
    } catch (err) {
      console.error('[World] Service unavailable:', err);
      return null;
    }
  },

  async createWorldState(userId: string, state: WorldState): Promise<void> {
    try {
      const { error } = await supabase
        .from('world_states')
        .insert({
          user_id: userId,
          state: state,
        });

      if (error) console.error('[World] Error creating world state:', error);
    } catch (err) {
      console.error('[World] Service unavailable:', err);
    }
  },

  async updateWorldState(userId: string, state: WorldState): Promise<void> {
    try {
      const { error } = await supabase
        .from('world_states')
        .update({ state: state })
        .eq('user_id', userId);

      if (error) console.error('[World] Error updating world state:', error);
    } catch (err) {
      console.error('[World] Service unavailable:', err);
    }
  },

  async deleteWorldState(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('world_states')
        .delete()
        .eq('user_id', userId);

      if (error) console.error('[World] Error deleting world state:', error);
    } catch (err) {
      console.error('[World] Service unavailable:', err);
    }
  },
};
