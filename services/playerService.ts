import { supabase } from '../lib/supabase';
import { Player, Quest, QuestStatus } from '../types';
import { INITIAL_PLAYER, MOCK_QUESTS } from '../constants';

// --- Types for DB Rows ---
// Matches the SQL Schema provided
interface ProfileRow {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  level: number;
  current_xp: number;
  next_level_xp: number;
  credits: number;
  stats: any;
  streak: number;
  risk_tolerance: 'LOW' | 'MEDIUM' | 'HIGH';
  last_active_date?: string;
}

interface QuestRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: any;
  difficulty: any;
  xp_reward: number;
  credit_reward: number;
  stat_rewards: any; // JSONB
  penalty_description: string;
  status: any;
  data_source: any;
  linked_stat: any;
  deadline: string;
  last_completed_at?: string;
  created_at: string;
}

export const PlayerService = {
  
  // Fetch full player profile
  async getProfile(userId: string): Promise<Player | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; 
      console.error('Error fetching profile:', error);
      return null;
    }

    if (!data) return null;

    // Transform DB row to Player object
    return {
      name: data.name,
      avatar: data.avatar_url,
      level: data.level,
      currentXP: data.current_xp,
      nextLevelXP: data.next_level_xp,
      credits: data.credits,
      stats: data.stats,
      streak: data.streak,
      riskTolerance: data.risk_tolerance as any,
      lastActiveDate: data.last_active_date || new Date().toISOString().split('T')[0]
    };
  },

  // Initialize a new profile
  async createProfile(userId: string, email: string, player: Player): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        name: player.name,
        avatar_url: player.avatar,
        level: player.level,
        current_xp: player.currentXP,
        next_level_xp: player.nextLevelXP,
        credits: player.credits,
        stats: player.stats,
        streak: player.streak,
        risk_tolerance: player.riskTolerance,
        last_active_date: player.lastActiveDate
      });

    if (error) console.error('Error creating profile:', error);
  },

  // Update specific player fields
  async updateProfile(userId: string, updates: Partial<Player>): Promise<void> {
    // Transform Player keys to DB snake_case keys
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;
    if (updates.level !== undefined) dbUpdates.level = updates.level;
    if (updates.currentXP !== undefined) dbUpdates.current_xp = updates.currentXP;
    if (updates.nextLevelXP !== undefined) dbUpdates.next_level_xp = updates.nextLevelXP;
    if (updates.credits !== undefined) dbUpdates.credits = updates.credits;
    if (updates.stats !== undefined) dbUpdates.stats = updates.stats;
    if (updates.streak !== undefined) dbUpdates.streak = updates.streak;
    if (updates.riskTolerance !== undefined) dbUpdates.risk_tolerance = updates.riskTolerance;
    if (updates.lastActiveDate !== undefined) dbUpdates.last_active_date = updates.lastActiveDate;

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId);

    if (error) console.error('Error updating profile:', error);
  },

  // Fetch all quests for user
  async getQuests(userId: string): Promise<Quest[]> {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quests:', error);
      return [];
    }

    return (data || []).map((row: QuestRow) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      difficulty: row.difficulty,
      xpReward: row.xp_reward,
      creditReward: row.credit_reward,
      statRewards: row.stat_rewards || { [row.linked_stat || 'mental']: 1 }, // Fallback logic
      penaltyDescription: row.penalty_description,
      status: row.status,
      dataSource: row.data_source,
      linkedStat: row.linked_stat,
      deadline: row.deadline,
      lastCompletedAt: row.last_completed_at,
      createdAt: row.created_at
    }));
  },

  // Create new quest
  async createQuest(userId: string, quest: Quest): Promise<string | null> {
    const { data, error } = await supabase
      .from('quests')
      .insert({
        user_id: userId,
        title: quest.title,
        description: quest.description,
        type: quest.type,
        difficulty: quest.difficulty,
        xp_reward: quest.xpReward,
        credit_reward: quest.creditReward,
        stat_rewards: quest.statRewards,
        penalty_description: quest.penaltyDescription,
        status: quest.status,
        data_source: quest.dataSource,
        linked_stat: quest.linkedStat || 'mental', // Fallback
        deadline: quest.deadline
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating quest:', error);
      return null;
    }
    return data.id;
  },

  // Update quest
  async updateQuest(questId: string, updates: Partial<Quest>): Promise<void> {
    const dbUpdates: any = {};
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.type) dbUpdates.type = updates.type;
    if (updates.difficulty) dbUpdates.difficulty = updates.difficulty;
    if (updates.xpReward) dbUpdates.xp_reward = updates.xpReward;
    if (updates.creditReward) dbUpdates.credit_reward = updates.creditReward;
    if (updates.statRewards) dbUpdates.stat_rewards = updates.statRewards;
    if (updates.penaltyDescription) dbUpdates.penalty_description = updates.penaltyDescription;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.dataSource) dbUpdates.data_source = updates.dataSource;
    if (updates.linkedStat) dbUpdates.linked_stat = updates.linkedStat;
    if (updates.deadline) dbUpdates.deadline = updates.deadline;
    if (updates.lastCompletedAt) dbUpdates.last_completed_at = updates.lastCompletedAt;

    const { error } = await supabase
      .from('quests')
      .update(dbUpdates)
      .eq('id', questId);

    if (error) console.error('Error updating quest:', error);
  },

  // Delete quest
  async deleteQuest(questId: string): Promise<void> {
    const { error } = await supabase
      .from('quests')
      .delete()
      .eq('id', questId);

    if (error) console.error('Error deleting quest:', error);
  }
};