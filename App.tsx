import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Activity, 
  Zap, 
  Brain, 
  Target, 
  Menu, 
  X,
  CreditCard,
  Briefcase,
  AlertTriangle,
  Database,
  Server,
  Cpu,
  ShoppingCart,
  Coins,
  Plus,
  Loader,
  Terminal as TerminalIcon,
  Trash2,
  Save,
  Check,
  Undo2,
  LogOut,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';

import { supabase, isSupabaseConfigured } from './lib/supabase';
import { PlayerService } from './services/playerService';
import { Player, Quest, QuestStatus, Reward, QuestType, PlayerStats } from './types';
import { INITIAL_PLAYER, MOCK_QUESTS, MOCK_REWARDS, getLevelTitle } from './constants';
import StatsRadar from './components/StatsRadar';
import QuestCard from './components/QuestCard';
import Terminal from './components/Terminal';
import Store from './components/Store';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding'; 
import LevelUpModal from './components/LevelUpModal'; 
import { analyzeUserQuest } from './services/geminiService';
import { getLocalDate, getYesterdayDate, getStartOfWeek, getStartOfMonth, getLocalDateStringFromISO } from './lib/dateUtils';

// --- Subcomponents ---

const StatBadge = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) => (
  <div className="flex items-center justify-between bg-axiom-800/50 p-2 rounded border border-axiom-700/50">
    <div className="flex items-center gap-2">
      <Icon size={14} className={color} />
      <span className="text-xs uppercase tracking-wider text-gray-400">{label}</span>
    </div>
    <span className="text-sm font-mono font-bold">{value}</span>
  </div>
);

const SchemaTable = ({ name, fields }: { name: string, fields: string[] }) => (
  <div className="bg-black border border-axiom-700 rounded-md overflow-hidden font-mono text-xs mb-4">
    <div className="bg-axiom-800 px-3 py-2 border-b border-axiom-700 flex items-center gap-2 text-axiom-accent font-bold">
      <Database size={12} />
      {name}
    </div>
    <div className="p-3 text-gray-400 space-y-1">
      {fields.map((field, i) => (
        <div key={i} className="flex gap-2">
          <span className="text-axiom-700 select-none">│</span>
          {field.includes(':') ? (
            <>
              <span className="text-gray-300">{field.split(':')[0]}</span>
              <span className="text-gray-600">:</span>
              <span className="text-axiom-warning opacity-80">{field.split(':')[1]}</span>
            </>
          ) : (
            <span>{field}</span>
          )}
        </div>
      ))}
    </div>
  </div>
);

// --- Helper: Level Progression Logic ---
const calculateLevelState = (startLevel: number, startXP: number, startCap: number) => {
  let level = startLevel;
  let xp = startXP;
  let cap = startCap;

  if (cap <= 0) cap = 1000;

  while (xp >= cap) {
      xp -= cap;
      level++;
      cap = Math.floor(cap * 1.25);
  }

  while (xp < 0 && level > 1) {
      const prevCap = Math.ceil(cap / 1.25); 
      xp += prevCap;
      level--;
      cap = prevCap;
  }
  
  if (level === 1 && xp < 0) xp = 0;

  return { level, xp, cap };
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // App Data State
  const [player, setPlayer] = useState<Player>(INITIAL_PLAYER);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [rewards, setRewards] = useState<Reward[]>(MOCK_REWARDS);
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<'DASHBOARD' | 'STORE' | 'SYSTEM'>('DASHBOARD');
  const [levelUpState, setLevelUpState] = useState<{oldLevel: number, newLevel: number} | null>(null);
  const [systemMessages, setSystemMessages] = useState<string[]>([]);
  
  // New Directive Modal State
  const [showNewQuestModal, setShowNewQuestModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newQuestInput, setNewQuestInput] = useState({
    title: '',
    description: '',
    difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME',
    type: QuestType.DAILY
  });
  
  // Intermediate AI Analysis State
  const [suggestedStats, setSuggestedStats] = useState<Partial<PlayerStats>>({});
  const [aiAnalysis, setAiAnalysis] = useState<{
    technicalTitle: string;
    xpReward: number;
    creditReward: number;
    penaltyDescription: string;
  } | null>(null);


  // Edit/View Quest Modal State
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [isEditingQuest, setIsEditingQuest] = useState(false);
  const [editQuestForm, setEditQuestForm] = useState<Partial<Quest>>({});

  // 1. Auth & Data Loading Effect
  useEffect(() => {
    if (!isSupabaseConfigured()) {
       setQuests(MOCK_QUESTS);
       setPlayer(INITIAL_PLAYER);
       setLoading(false);
       return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData(session.user.id, session.user.email);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData(session.user.id, session.user.email);
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Data Helper
  const fetchData = async (userId: string, email: string = '') => {
    setLoading(true);
    try {
      const [profile, userQuests] = await Promise.all([
        PlayerService.getProfile(userId),
        PlayerService.getQuests(userId)
      ]);

      let currentPlayer = profile;

      if (!currentPlayer) {
        console.log("No profile found. Initializing new operative...");
        const newPlayer = { ...INITIAL_PLAYER };
        await PlayerService.createProfile(userId, email, newPlayer);
        currentPlayer = newPlayer;
      }

      // Check for level integrity
      if (currentPlayer) {
         const { level, xp, cap } = calculateLevelState(currentPlayer.level, currentPlayer.currentXP, currentPlayer.nextLevelXP);
         if (level !== currentPlayer.level || xp !== currentPlayer.currentXP) {
            currentPlayer = { ...currentPlayer, level, currentXP: xp, nextLevelXP: cap };
            // Optimistic update, DB update happens implicitly via re-save if changed
         }
      }

      if (userQuests && currentPlayer) {
         // CORE LOGIC: Process Resets for Daily, Weekly, and Epic
         const { updatedQuests, totalPenalty, streakBroken, msgs } = await processAllResets(userQuests);
         
         setQuests(updatedQuests);

         if (totalPenalty > 0 || streakBroken) {
            
            // Push these to Terminal via state
            setSystemMessages(msgs);

            // Apply penalty to player
            const penalizedXP = Math.max(0, currentPlayer.currentXP - totalPenalty);
            const updatedStreak = streakBroken ? 0 : currentPlayer.streak;
            
            currentPlayer = { 
               ...currentPlayer, 
               currentXP: penalizedXP,
               streak: updatedStreak
            };

            // Save player penalty state
            await PlayerService.updateProfile(userId, currentPlayer);
         }
      }

      setPlayer(currentPlayer || INITIAL_PLAYER);
      
    } catch (e) {
      console.error("Data load error", e);
    } finally {
      setLoading(false);
    }
  };

  // The Engine: Universal Reset Logic
  const processAllResets = async (fetchedQuests: Quest[]) => {
    const today = getLocalDate();
    const yesterday = getYesterdayDate();
    const startOfWeek = getStartOfWeek(); // Monday of current week
    const startOfMonth = getStartOfMonth(); // 1st of current month

    const updates: Promise<void>[] = [];
    let totalPenalty = 0;
    let streakBroken = false;
    const msgs: string[] = [];

    const updatedQuests = fetchedQuests.map(q => {
      const completedAtDate = getLocalDateStringFromISO(q.lastCompletedAt);
      const createdAtDate = getLocalDateStringFromISO(q.createdAt) ?? today;

      // --- DAILY QUESTS ---
      if (q.type === QuestType.DAILY) {
        if (completedAtDate === today) return q; // Done today

        // If done yesterday, reset to PENDING (New Day)
        if (completedAtDate === yesterday) {
           if (q.status === QuestStatus.COMPLETED) {
              updates.push(PlayerService.updateQuest(q.id, { status: QuestStatus.PENDING }));
              return { ...q, status: QuestStatus.PENDING };
           }
        }

        // If NOT done yesterday (and created before today) -> FAIL
        if (createdAtDate < today && completedAtDate !== yesterday) {
             const penalty = Math.ceil(q.xpReward * 0.1);
             totalPenalty += penalty;
             streakBroken = true;
             msgs.push(`MISSED PROTOCOL: ${q.title} (-${penalty} XP)`);

             if (q.status !== QuestStatus.PENDING) {
                 updates.push(PlayerService.updateQuest(q.id, { status: QuestStatus.PENDING }));
                 return { ...q, status: QuestStatus.PENDING };
             }
        }

        // Catch-all: reset completed to pending if old
        if (q.status === QuestStatus.COMPLETED) {
           updates.push(PlayerService.updateQuest(q.id, { status: QuestStatus.PENDING }));
           return { ...q, status: QuestStatus.PENDING };
        }
      }

      // --- WEEKLY QUESTS ---
      else if (q.type === QuestType.WEEKLY) {
        // If completed this week, good.
        // We compare completedAtDate to startOfWeek.
        const isCompletedThisWeek = completedAtDate && completedAtDate >= startOfWeek;

        if (isCompletedThisWeek && q.status === QuestStatus.COMPLETED) {
            return q;
        }

        // If status is COMPLETED but date is before startOfWeek -> Reset to PENDING (New Week)
        if (q.status === QuestStatus.COMPLETED && (!completedAtDate || completedAtDate < startOfWeek)) {
            updates.push(PlayerService.updateQuest(q.id, { status: QuestStatus.PENDING }));
            return { ...q, status: QuestStatus.PENDING };
        }

        // If PENDING and created before this week -> FAILURE (Missed last week)
        if (q.status === QuestStatus.PENDING && createdAtDate < startOfWeek) {
            // Apply Penalty (Higher for weekly)
            const penalty = Math.ceil(q.xpReward * 0.2); 
            totalPenalty += penalty;
            msgs.push(`WEEKLY FAILURE: ${q.title} (-${penalty} XP)`);
            
            // It stays Pending, but we acknowledge the failure
        }
      }

      // --- EPIC QUESTS ---
      else if (q.type === QuestType.EPIC) {
        // Epic logic: Monthly reset
        const isCompletedThisMonth = completedAtDate && completedAtDate >= startOfMonth;

        if (isCompletedThisMonth && q.status === QuestStatus.COMPLETED) return q;

        // Reset if old completion
        if (q.status === QuestStatus.COMPLETED && (!completedAtDate || completedAtDate < startOfMonth)) {
             updates.push(PlayerService.updateQuest(q.id, { status: QuestStatus.PENDING }));
             return { ...q, status: QuestStatus.PENDING };
        }

        // Fail if Pending and created before this month
        if (q.status === QuestStatus.PENDING && createdAtDate < startOfMonth) {
            const penalty = Math.ceil(q.xpReward * 0.3);
            totalPenalty += penalty;
            msgs.push(`EPIC FAILURE: ${q.title} (-${penalty} XP)`);
        }
      }

      return q;
    });

    await Promise.all(updates);
    
    if (streakBroken) msgs.unshift("STREAK BROKEN: Consistency failure.");
    
    return { updatedQuests, totalPenalty, streakBroken, msgs };
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setQuests([]); 
  };
  
  const toggleQuestStatus = async (questId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const questIndex = quests.findIndex(q => q.id === questId);
    if (questIndex === -1) return;
    
    const quest = quests[questIndex];
    const isCompleting = quest.status !== QuestStatus.COMPLETED;
    const newStatus = isCompleting ? QuestStatus.COMPLETED : QuestStatus.PENDING;
    const multiplier = isCompleting ? 1 : -1;
    const today = getLocalDate();

    // 1. Calculate Player Updates
    const rawNewXP = player.currentXP + (quest.xpReward * multiplier);
    const newCredits = Math.max(0, player.credits + (quest.creditReward * multiplier));
    
    // Streak: only increment for consecutive days; break if gap
    let newStreak = player.streak;
    let newLastActiveDate = player.lastActiveDate;

    if (isCompleting && quest.type === QuestType.DAILY) {
       const yesterday = getYesterdayDate();
       if (player.lastActiveDate === yesterday) {
         newStreak += 1;
         newLastActiveDate = today;
       } else if (player.lastActiveDate === today) {
         newLastActiveDate = today;
       } else {
         newStreak = 1;
         newLastActiveDate = today;
       }
    } 

    // Stat updates
    const updatedStats = { ...player.stats };
    if (quest.statRewards) {
        Object.entries(quest.statRewards).forEach(([key, val]) => {
            const statKey = key as keyof PlayerStats;
            const currentVal = updatedStats[statKey] || 0;
            updatedStats[statKey] = Math.max(0, currentVal + ((val as number) * multiplier));
        });
    }

    // Level Calc
    const { level: newLevel, xp: finalXP, cap: newCap } = calculateLevelState(
        player.level, 
        rawNewXP, 
        player.nextLevelXP
    );

    // 2. State Updates
    const timestamp = isCompleting ? getLocalDate() : quest.lastCompletedAt;

    const updatedQuest = { 
        ...quest, 
        status: newStatus,
        lastCompletedAt: timestamp
    };
    
    setQuests(prev => {
        const newQuests = [...prev];
        newQuests[questIndex] = updatedQuest;
        return newQuests;
    });

    const updatedPlayer = {
        ...player,
        level: newLevel,
        currentXP: finalXP,
        nextLevelXP: newCap,
        credits: newCredits,
        stats: updatedStats,
        streak: newStreak,
        lastActiveDate: newLastActiveDate
    };
    setPlayer(updatedPlayer);

    if (newLevel > player.level) {
        setLevelUpState({ oldLevel: player.level, newLevel });
    }

    if (session) {
        PlayerService.updateProfile(session.user.id, updatedPlayer);
        PlayerService.updateQuest(questId, { 
            status: updatedQuest.status,
            lastCompletedAt: updatedQuest.lastCompletedAt
        });
    }
  };

  // Stage 1: Analyze Input
  const handleAnalyzeQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestInput.title) return;

    setIsAnalyzing(true);
    
    // Call AI
    const analysis = await analyzeUserQuest(newQuestInput.title, newQuestInput.difficulty, player.level, newQuestInput.type);
    
    if (analysis) {
       setAiAnalysis({
         technicalTitle: analysis.technicalTitle,
         xpReward: analysis.xpReward,
         creditReward: analysis.creditReward,
         penaltyDescription: analysis.penaltyDescription
       });
       setSuggestedStats(analysis.statRewards);
    } else {
       const baseXP = newQuestInput.type === QuestType.EPIC ? 500 : newQuestInput.type === QuestType.WEEKLY ? 200 : 100;
       const xpLoss = Math.ceil(baseXP * (newQuestInput.type === QuestType.EPIC ? 0.3 : newQuestInput.type === QuestType.WEEKLY ? 0.2 : 0.1));
       setAiAnalysis({
         technicalTitle: newQuestInput.title,
         xpReward: baseXP,
         creditReward: Math.round(baseXP * 0.3),
         penaltyDescription: `No entertainment for 24h (-${xpLoss} XP)`
       });
       setSuggestedStats({ mental: 1 });
    }
    
    setIsAnalyzing(false);
  };

  // Stage 2: Finalize Creation
  const handleConfirmQuest = async () => {
    if (!aiAnalysis) return;

    let deadline = '23:59';
    if (newQuestInput.type === QuestType.WEEKLY) deadline = 'Sunday 23:59';
    if (newQuestInput.type === QuestType.EPIC) deadline = 'End of Month';
    
    // Use edited stats (suggestedStats) and possibly edited title from aiAnalysis
    // Note: If we want to allow editing Title/Penalty in Review stage, we should bind inputs to aiAnalysis state.
    // Let's assume aiAnalysis state is updated via inputs in the review render.

    const newQuest: Quest = {
      id: `temp-${Date.now()}`, 
      title: aiAnalysis.technicalTitle, 
      description: newQuestInput.description || newQuestInput.title,
      type: newQuestInput.type,
      difficulty: newQuestInput.difficulty,
      xpReward: aiAnalysis.xpReward,
      creditReward: aiAnalysis.creditReward,
      statRewards: suggestedStats,
      penaltyDescription: aiAnalysis.penaltyDescription,
      status: QuestStatus.PENDING,
      dataSource: 'MANUAL_OVERRIDE',
      linkedStat: Object.keys(suggestedStats)[0] as any || 'mental',
      deadline: deadline,
      createdAt: getLocalDate()
    };

    setQuests(prev => [newQuest, ...prev]);
    closeQuestModal();

    if (session) {
      const dbId = await PlayerService.createQuest(session.user.id, newQuest);
      if (dbId) {
         setQuests(prev => prev.map(q => q.id === newQuest.id ? { ...q, id: dbId } : q));
      }
    }
  };

  const closeQuestModal = () => {
    setShowNewQuestModal(false);
    setNewQuestInput({ title: '', description: '', difficulty: 'MEDIUM', type: QuestType.DAILY });
    setSuggestedStats({});
    setAiAnalysis(null);
  }

  const handleUpdateQuest = async () => {
    if (!selectedQuest) return;

    const updatedQuest = { ...selectedQuest, ...editQuestForm } as Quest;
    setQuests(prev => prev.map(q => q.id === selectedQuest.id ? updatedQuest : q));
    setSelectedQuest(updatedQuest);
    setIsEditingQuest(false);

    if (session) {
      await PlayerService.updateQuest(selectedQuest.id, editQuestForm);
    }
  };

  const handleDeleteQuest = async () => {
    if (!selectedQuest) return;

    if (window.confirm("Delete this directive permanently?")) {
        const idToDelete = selectedQuest.id;
        setQuests(prev => prev.filter(q => q.id !== idToDelete));
        setSelectedQuest(null);
        setIsEditingQuest(false);

        if (session) {
            await PlayerService.deleteQuest(idToDelete);
        }
    }
  };

  const handleConsumeReward = async (rewardId: string) => {
    const rewardIndex = rewards.findIndex(r => r.id === rewardId);
    if (rewardIndex === -1) return;

    // "Consuming" means we use it, so it becomes available to purchase again (purchased = false)
    const updatedRewards = [...rewards];
    updatedRewards[rewardIndex].purchased = false;
    setRewards(updatedRewards);

    // No API call needed for mock rewards in V1, but in real app we'd log consumption
    // For now, assume client-side toggle for consumption
  }

  const handlePurchase = (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward || player.credits < reward.cost) return;

    const newCredits = player.credits - reward.cost;
    setPlayer(prev => ({ ...prev, credits: newCredits }));
    setRewards(prev => prev.map(r => r.id === rewardId ? { ...r, purchased: true } : r));

    if (session) {
      PlayerService.updateProfile(session.user.id, { credits: newCredits });
    }
  };

  const adjustStat = (stat: keyof PlayerStats, delta: number) => {
     setSuggestedStats(prev => ({
       ...prev,
       [stat]: Math.max(0, (prev[stat] || 0) + delta)
     }));
  };
  
  const handleOnboardingComplete = async (name: string, avatar: string, riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH') => {
    const updatedPlayer = { ...player, name, avatar, riskTolerance };
    setPlayer(updatedPlayer);
    
    if (session) {
       await PlayerService.updateProfile(session.user.id, updatedPlayer);
    }
  };

  const openQuestModal = (quest: Quest) => {
    setSelectedQuest(quest);
    setEditQuestForm(quest);
    setIsEditingQuest(false);
  };

  const xpPercentage = Math.min(100, (player.currentXP / player.nextLevelXP) * 100);

  // --- RENDERING ---

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-axiom-accent">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin" size={32} />
          <span className="font-mono text-sm tracking-widest animate-pulse">ESTABLISHING UPLINK...</span>
        </div>
      </div>
    );
  }

  if (isSupabaseConfigured() && !session) {
    return <Auth onLogin={() => {}} />;
  }

  // Show profile setup when name is missing, empty, or still the default (new user or trigger-created profile)
  const needsProfileSetup = !player.name?.trim() || player.name === "Operative";
  if (session && needsProfileSetup) {
    return <Onboarding player={player} onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-axiom-900 text-gray-200 overflow-hidden flex flex-col md:flex-row font-sans">
      
      {/* Level Up Modal Overlay */}
      {levelUpState && (
        <LevelUpModal 
          oldLevel={levelUpState.oldLevel} 
          newLevel={levelUpState.newLevel} 
          onClose={() => setLevelUpState(null)} 
        />
      )}

      {/* Mobile: backdrop when sidebar open — tap outside to close */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-[55]"
          aria-hidden
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Header — safe area so it sits below status bar on iPhone */}
      <div className="md:hidden bg-axiom-900 border-b border-axiom-800 flex justify-between items-center z-50 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <Shield className="text-axiom-accent" />
          <span className="font-bold tracking-widest text-lg">AXIOM</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation — on mobile, higher z so it draws above header when open */}
      <aside className={`
        fixed md:static inset-y-0 left-0 w-64 bg-axiom-900 border-r border-axiom-800 z-40 md:z-auto transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0 z-[60]' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex flex-col h-full pt-[max(1rem,env(safe-area-inset-top))] md:pt-6">
          <div className="hidden md:flex items-center gap-2 mb-8 text-axiom-accent">
            <Shield size={24} />
            <span className="font-bold tracking-[0.2em] text-xl">AXIOM</span>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full border border-axiom-700 bg-black overflow-hidden relative">
                 {player.avatar ? (
                   <img src={player.avatar} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full bg-axiom-800 flex items-center justify-center text-gray-500">
                     <Shield size={20} />
                   </div>
                 )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                   <span className="text-xs font-mono text-gray-400 uppercase">{getLevelTitle(player.level)}</span>
                </div>
                <div className="text-white font-bold tracking-wide">{player.name}</div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-axiom-accent">LVL {player.level}</span>
              <span className="text-[10px] font-mono text-gray-500">{player.currentXP} / {player.nextLevelXP} XP</span>
            </div>
            <div className="w-full bg-axiom-800 h-2 rounded-full overflow-hidden mb-4">
              <div 
                className="bg-axiom-accent h-full transition-all duration-500 shadow-[0_0_10px_rgba(124,58,237,0.5)]" 
                style={{ width: `${xpPercentage}%` }}
              ></div>
            </div>

            {/* Currency Display */}
            <div className="bg-axiom-800/50 border border-axiom-800 rounded p-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-axiom-warning">
                <Coins size={14} />
                <span className="text-xs uppercase tracking-wider font-bold">Credits</span>
              </div>
              <span className="font-mono text-sm font-bold">{player.credits}</span>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <button 
              onClick={() => { setView('DASHBOARD'); setSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors flex items-center gap-3 ${view === 'DASHBOARD' ? 'bg-axiom-800 text-white border-l-2 border-axiom-accent' : 'text-gray-400 hover:bg-axiom-800/50 hover:text-white'}`}
            >
              <Activity size={18} /> Dashboard
            </button>
            <button 
              onClick={() => { setView('STORE'); setSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors flex items-center gap-3 ${view === 'STORE' ? 'bg-axiom-800 text-white border-l-2 border-axiom-accent' : 'text-gray-400 hover:bg-axiom-800/50 hover:text-white'}`}
            >
              <ShoppingCart size={18} /> Requisitions
            </button>
            <button 
              onClick={() => { setView('SYSTEM'); setSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors flex items-center gap-3 ${view === 'SYSTEM' ? 'bg-axiom-800 text-white border-l-2 border-axiom-accent' : 'text-gray-400 hover:bg-axiom-800/50 hover:text-white'}`}
            >
              <Zap size={18} /> System Core
            </button>
          </nav>
          
          <div className="mt-auto pt-4 border-t border-axiom-800">
             <button 
               onClick={handleLogout}
               className="w-full text-left px-4 py-2 rounded-md text-xs font-medium text-gray-500 hover:text-white flex items-center gap-3"
             >
               <LogOut size={16} /> Terminate Link
             </button>
             <div className="text-[10px] text-gray-700 font-mono text-center mt-2">
                SILENCE IS FAILURE
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-black/20">
        <div className="scanline absolute inset-0 z-0 opacity-20 pointer-events-none"></div>
        
        <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto">
          
          {view === 'DASHBOARD' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Stats & Overview */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-axiom-900 border border-axiom-800 rounded-lg p-5 shadow-lg">
                  <h2 className="text-sm font-mono uppercase text-gray-400 mb-4 tracking-wider flex justify-between">
                    <span>Biometrics & Status</span>
                    <Activity size={16} />
                  </h2>
                  
                  <StatsRadar stats={player.stats} />
                  
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <StatBadge icon={Activity} label="PHY" value={player.stats.physical} color="text-emerald-500" />
                    <StatBadge icon={Brain} label="COG" value={player.stats.cognitive} color="text-blue-500" />
                    <StatBadge icon={Briefcase} label="CAR" value={player.stats.career} color="text-amber-500" />
                    <StatBadge icon={CreditCard} label="FIN" value={player.stats.financial} color="text-green-500" />
                    <StatBadge icon={Zap} label="MEN" value={player.stats.mental} color="text-violet-500" />
                    <StatBadge icon={Target} label="CRT" value={player.stats.creative} color="text-pink-500" />
                  </div>
                </div>

                <div className="bg-axiom-900 border border-axiom-danger/30 rounded-lg p-5 shadow-lg relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-2 opacity-20 text-axiom-danger"><AlertTriangle size={64} /></div>
                   <h2 className="text-sm font-mono uppercase text-axiom-danger mb-2 tracking-wider">Active Penalties</h2>
                   <ul className="text-xs text-gray-400 space-y-2 relative z-10">
                     {systemMessages.length > 0 ? (
                        systemMessages.map((msg, idx) => (
                           <li key={idx} className="flex items-start gap-2">
                              <span className="text-axiom-danger font-bold">!</span>
                              <span>{msg}</span>
                           </li>
                        ))
                     ) : (
                       <li className="text-gray-600 italic">No recent infractions detected.</li>
                     )}
                   </ul>
                </div>
                
                <div className="bg-axiom-900 border border-axiom-800 rounded-lg p-5 flex items-center justify-between">
                   <div>
                      <h2 className="text-xs font-mono uppercase text-gray-400 tracking-wider mb-1">Current Streak</h2>
                      <div className="text-2xl font-bold text-white font-mono flex items-center gap-2">
                        {player.streak} <span className="text-xs text-axiom-accent">DAYS</span>
                      </div>
                   </div>
                   <div className="h-10 w-10 rounded-full bg-axiom-800 flex items-center justify-center border border-axiom-700">
                      <Activity size={20} className={player.streak > 0 ? "text-axiom-success" : "text-gray-600"} />
                   </div>
                </div>
              </div>

              {/* Middle Column: Active Quests */}
              <div className="lg:col-span-1 space-y-6">
                 <div className="bg-axiom-900/50 border border-axiom-800 rounded-lg p-5 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-mono uppercase text-gray-400 tracking-wider">
                        Directives Log
                      </h2>
                      <div className="flex gap-2">
                          <button 
                            onClick={() => setShowNewQuestModal(true)}
                            className="bg-axiom-accent/10 border border-axiom-accent/30 text-axiom-accent hover:bg-axiom-accent/20 px-3 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-2 hover:shadow-[0_0_10px_rgba(124,58,237,0.3)]"
                          >
                            <Plus size={12} />
                            NEW DIRECTIVE
                          </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                      {quests.length === 0 ? (
                        <div className="text-gray-500 text-xs font-mono text-center py-8 opacity-50">
                          NO DIRECTIVES FOUND. INITIATE PROTOCOL.
                        </div>
                      ) : (
                        [...quests]
                          .sort((a, b) => {
                            const order = (t: string) => ({ DAILY: 0, WEEKLY: 1, EPIC: 2, LEGENDARY: 3 }[t] ?? 0);
                            return order(a.type) - order(b.type);
                          })
                          .map(quest => (
                            <QuestCard 
                              key={quest.id} 
                              quest={quest} 
                              onClick={openQuestModal} 
                              onToggleStatus={toggleQuestStatus}
                            />
                          ))
                      )}
                    </div>
                 </div>
              </div>

              {/* Right Column: AI Terminal */}
              <div className="lg:col-span-1 h-[600px] lg:h-auto">
                <Terminal player={player} quests={quests} initialMessages={systemMessages} />
              </div>

            </div>
          )}

          {view === 'STORE' && (
             <Store player={player} rewards={rewards} onPurchase={handlePurchase} onConsume={handleConsumeReward} />
          )}

          {view === 'SYSTEM' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-axiom-900 border border-axiom-800 rounded-lg p-8">
                 <h1 className="text-xl font-bold tracking-widest text-white mb-6 flex items-center gap-2">
                   <Server className="text-axiom-accent" /> SYSTEM ARCHITECTURE
                 </h1>
                 
                 <div className="space-y-8 font-mono text-sm">
                   <section>
                     <h3 className="text-axiom-accent mb-2 uppercase border-b border-axiom-800 pb-1">1. Core Primitives</h3>
                     <p className="text-gray-400 leading-relaxed mb-2">
                       The system operates on an "Assume Failure" model. 
                       Silence = Failure. If data is not received from integrated APIs (Health, Calendar, Bank) by the deadline, penalties are automatically applied.
                     </p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                       <div className="bg-black p-4 border border-axiom-700 rounded">
                         <span className="text-white block mb-1">Identity Engine</span>
                         <span className="text-gray-500 text-xs">Tracks long-term identity shift via Stats. Moves focus from "Goals" to "Attributes".</span>
                       </div>
                       <div className="bg-black p-4 border border-axiom-700 rounded">
                         <span className="text-white block mb-1">Economy Agent</span>
                         <span className="text-gray-500 text-xs">Manages scarce resources. Leveling up unlocks real-world privileges (e.g., buying a coffee, watching a movie).</span>
                       </div>
                     </div>
                   </section>

                   <section>
                     <h3 className="text-axiom-accent mb-2 uppercase border-b border-axiom-800 pb-1">2. AI Agent Swarm</h3>
                     <ul className="list-disc pl-5 space-y-2 text-gray-400">
                       <li><strong className="text-white">Game Master (GM):</strong> Context-aware LLM. Observes all data streams. Decides if a "rest day" is valid or laziness.</li>
                       <li><strong className="text-white">Tracking Agent:</strong> Polls webhooks/APIs. Normalizes data (Sleep score {' -> '} Health Stat).</li>
                       <li><strong className="text-white">Motivation Agent:</strong> Detects burnout patterns. Switches quest generation from "High Intensity" to "Recovery" automatically.</li>
                     </ul>
                   </section>
                 </div>
               </div>

               <div className="bg-axiom-900 border border-axiom-800 rounded-lg p-8">
                 <h1 className="text-xl font-bold tracking-widest text-white mb-6 flex items-center gap-2">
                   <Cpu className="text-axiom-success" /> BACKEND SCHEMA
                 </h1>
                 
                 <div className="overflow-y-auto h-[600px] pr-2">
                   <p className="text-gray-500 font-mono text-xs mb-4">PostgreSQL / Supabase Architecture</p>

                   <SchemaTable 
                    name="users"
                    fields={[
                      "id: uuid (pk)",
                      "email: varchar",
                      "risk_tolerance: enum(LOW, MED, HIGH)",
                      "created_at: timestamp"
                    ]}
                   />

                   <SchemaTable 
                    name="player_stats"
                    fields={[
                      "user_id: uuid (fk)",
                      "physical: integer",
                      "cognitive: integer",
                      "financial: integer",
                      "career: integer",
                      "streak_multiplier: float",
                      "current_xp: bigint"
                    ]}
                   />

                   <SchemaTable 
                    name="quests"
                    fields={[
                      "id: uuid (pk)",
                      "user_id: uuid (fk)",
                      "title: varchar",
                      "type: enum(DAILY, WEEKLY, EPIC)",
                      "status: enum(PENDING, FAILED, COMPLETED)",
                      "deadline: timestamp",
                      "verification_source: jsonb",
                      "penalty_config: jsonb"
                    ]}
                   />

                   <SchemaTable 
                    name="agent_memory"
                    fields={[
                      "id: uuid (pk)",
                      "agent_type: enum(GM, TRACKER, ECONOMY)",
                      "memory_key: varchar",
                      "memory_value: vector(1536)",
                      "context_summary: text",
                      "last_accessed: timestamp"
                    ]}
                   />
                 </div>
               </div>
             </div>
          )}

        </div>
      </main>

      {/* New Directive Modal */}
      {showNewQuestModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-axiom-900 border border-axiom-700 w-full max-w-lg rounded-lg shadow-2xl relative overflow-hidden">
            <div className="bg-axiom-800 px-6 py-4 border-b border-axiom-700 flex justify-between items-center">
              <h2 className="text-lg font-bold tracking-widest text-white flex items-center gap-2">
                <TerminalIcon className="text-axiom-accent" size={18} /> NEW DIRECTIVE
              </h2>
              <button onClick={closeQuestModal} className="text-gray-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
               {!aiAnalysis ? (
                 /* STAGE 1: INPUT FORM */
                 <form onSubmit={handleAnalyzeQuest} className="space-y-4">
                   <div>
                     <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">Objective</label>
                     <input 
                       type="text" 
                       value={newQuestInput.title}
                       onChange={(e) => setNewQuestInput({...newQuestInput, title: e.target.value})}
                       placeholder="e.g., Run 5km, Read Chapter 3, Organize Desk"
                       className="w-full bg-black border border-axiom-700 rounded p-2 text-white focus:border-axiom-accent outline-none"
                       autoFocus
                       required
                     />
                   </div>

                   <div>
                     <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">Description (Optional)</label>
                     <textarea 
                       value={newQuestInput.description}
                       onChange={(e) => setNewQuestInput({...newQuestInput, description: e.target.value})}
                       className="w-full bg-black border border-axiom-700 rounded p-2 text-sm text-gray-300 focus:border-axiom-accent outline-none h-20 resize-none"
                     />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">Difficulty</label>
                        <select 
                          value={newQuestInput.difficulty}
                          onChange={(e) => setNewQuestInput({...newQuestInput, difficulty: e.target.value as any})}
                          className="w-full bg-black border border-axiom-700 rounded p-2 text-sm text-white focus:border-axiom-accent outline-none"
                        >
                          <option value="EASY">EASY</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HARD">HARD</option>
                          <option value="EXTREME">EXTREME</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">Frequency</label>
                        <select 
                          value={newQuestInput.type}
                          onChange={(e) => setNewQuestInput({...newQuestInput, type: e.target.value as any})}
                          className="w-full bg-black border border-axiom-700 rounded p-2 text-sm text-white focus:border-axiom-accent outline-none"
                        >
                          <option value="QuestType.DAILY">DAILY PROTOCOL</option>
                          <option value={QuestType.WEEKLY}>WEEKLY MILESTONE</option>
                          <option value={QuestType.EPIC}>LONG-TERM OBJECTIVE</option>
                        </select>
                     </div>
                   </div>
                   
                   <div className="bg-axiom-800/50 p-3 rounded border border-axiom-700/50 text-xs text-gray-400 font-mono flex gap-2 items-start mt-2">
                     <Brain size={14} className="text-axiom-accent shrink-0 mt-0.5" />
                     <p>AI will analyze your input to generate optimized Stats, XP, and Penalties.</p>
                   </div>

                   <div className="pt-4 flex justify-end gap-3">
                     <button 
                       type="button"
                       onClick={closeQuestModal}
                       className="px-4 py-2 rounded text-xs font-bold uppercase hover:bg-axiom-800 text-gray-400"
                     >
                       Cancel
                     </button>
                     <button 
                       type="submit"
                       disabled={isAnalyzing || !newQuestInput.title}
                       className="bg-axiom-accent hover:bg-axiom-accent/80 text-white px-6 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 transition-all"
                     >
                       {isAnalyzing ? (
                         <> <Loader size={14} className="animate-spin" /> Analyzing... </>
                       ) : (
                         <> Analyze Protocol <ArrowRight size={14} /> </>
                       )}
                     </button>
                   </div>
                 </form>
               ) : (
                 /* STAGE 2: REVIEW & CONFIRM */
                 <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">Technical Title (AI Generated)</label>
                      <input 
                        type="text" 
                        value={aiAnalysis.technicalTitle}
                        onChange={(e) => setAiAnalysis({...aiAnalysis, technicalTitle: e.target.value})}
                        className="w-full bg-black border border-axiom-700 rounded p-2 text-white focus:border-axiom-accent outline-none font-bold tracking-wide"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-axiom-800/50 p-3 rounded border border-axiom-700">
                         <span className="block text-[10px] uppercase text-gray-500 mb-1">XP Reward</span>
                         <span className="text-xl font-bold text-axiom-accent">+{aiAnalysis.xpReward} XP</span>
                      </div>
                      <div className="bg-axiom-800/50 p-3 rounded border border-axiom-700">
                         <span className="block text-[10px] uppercase text-gray-500 mb-1">Credits</span>
                         <span className="text-xl font-bold text-axiom-warning flex items-center gap-1">
                           <Coins size={16} /> +{aiAnalysis.creditReward}
                         </span>
                      </div>
                    </div>

                    {/* Stat Manual Override */}
                    <div className="bg-black/40 border border-axiom-800 rounded p-3">
                       <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2">Stat Reward Calibration</label>
                       <div className="grid grid-cols-3 gap-2">
                         {(['physical', 'cognitive', 'career', 'financial', 'mental', 'creative'] as Array<keyof PlayerStats>).map(stat => (
                            <div key={stat} className="flex items-center justify-between bg-axiom-900 border border-axiom-800 p-1 rounded">
                               <span className="text-[9px] uppercase text-gray-400 pl-1">{stat.slice(0,3)}</span>
                               <div className="flex items-center gap-1">
                                  <button type="button" onClick={() => adjustStat(stat, -1)} className="text-gray-500 hover:text-white px-1"><ChevronDown size={10} /></button>
                                  <span className={`text-xs font-bold w-3 text-center ${suggestedStats[stat] ? 'text-axiom-accent' : 'text-gray-600'}`}>{suggestedStats[stat] || 0}</span>
                                  <button type="button" onClick={() => adjustStat(stat, 1)} className="text-gray-500 hover:text-white px-1"><ChevronUp size={10} /></button>
                               </div>
                            </div>
                         ))}
                       </div>
                    </div>

                    <div>
                       <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">Failure Penalty</label>
                       <input 
                         type="text" 
                         value={aiAnalysis.penaltyDescription}
                         onChange={(e) => setAiAnalysis({...aiAnalysis, penaltyDescription: e.target.value})}
                         className="w-full bg-black border border-axiom-danger/30 text-axiom-danger rounded p-2 text-sm focus:border-axiom-danger outline-none"
                         placeholder="e.g. No video games tonight (-50 XP)"
                       />
                       <p className="text-[10px] font-mono text-axiom-danger/80 mt-1">
                         XP loss on fail: -{Math.ceil(aiAnalysis.xpReward * (newQuestInput.type === QuestType.EPIC ? 0.3 : newQuestInput.type === QuestType.WEEKLY ? 0.2 : 0.1))} XP
                       </p>
                    </div>

                    <div className="pt-2 flex justify-between items-center border-t border-axiom-800 mt-4">
                      <button 
                        onClick={() => setAiAnalysis(null)}
                        className="text-gray-500 hover:text-white text-xs font-bold uppercase flex items-center gap-1"
                      >
                        <Undo2 size={14} /> Back to Edit
                      </button>
                      <button 
                        onClick={handleConfirmQuest}
                        className="bg-axiom-success hover:bg-axiom-success/80 text-white px-6 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                      >
                        Confirm Directive
                      </button>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Quest Details / Edit Modal */}
      {selectedQuest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-axiom-900 border border-axiom-700 w-full max-w-lg rounded-lg shadow-2xl relative overflow-hidden">
            <div className="bg-axiom-800 px-6 py-4 border-b border-axiom-700 flex justify-between items-center">
              <h2 className="text-lg font-bold tracking-widest text-white flex items-center gap-2">
                <TerminalIcon className="text-axiom-accent" size={18} /> DIRECTIVE DETAILS
              </h2>
              <button onClick={() => setSelectedQuest(null)} className="text-gray-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {isEditingQuest ? (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">Title</label>
                    <input 
                      type="text" 
                      value={editQuestForm.title || ''}
                      onChange={(e) => setEditQuestForm({...editQuestForm, title: e.target.value})}
                      className="w-full bg-black border border-axiom-700 rounded p-2 text-white focus:border-axiom-accent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">Description</label>
                    <textarea 
                      value={editQuestForm.description || ''}
                      onChange={(e) => setEditQuestForm({...editQuestForm, description: e.target.value})}
                      className="w-full bg-black border border-axiom-700 rounded p-2 text-sm text-gray-300 focus:border-axiom-accent outline-none h-20 resize-none"
                    />
                  </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">Difficulty</label>
                       <select 
                         value={editQuestForm.difficulty || 'MEDIUM'}
                         onChange={(e) => setEditQuestForm({...editQuestForm, difficulty: e.target.value as any})}
                         className="w-full bg-black border border-axiom-700 rounded p-2 text-sm text-white focus:border-axiom-accent outline-none"
                       >
                         <option value="EASY">EASY</option>
                         <option value="MEDIUM">MEDIUM</option>
                         <option value="HARD">HARD</option>
                         <option value="EXTREME">EXTREME</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">Frequency</label>
                       <select 
                         value={editQuestForm.type || QuestType.DAILY}
                         onChange={(e) => setEditQuestForm({...editQuestForm, type: e.target.value as any})}
                         className="w-full bg-black border border-axiom-700 rounded p-2 text-sm text-white focus:border-axiom-accent outline-none"
                       >
                         <option value={QuestType.DAILY}>DAILY PROTOCOL</option>
                         <option value={QuestType.WEEKLY}>WEEKLY MILESTONE</option>
                         <option value={QuestType.EPIC}>LONG-TERM OBJECTIVE</option>
                       </select>
                    </div>
                   </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-4">
                   <div>
                     <span className="text-xs font-mono text-axiom-accent bg-axiom-accent/10 px-2 py-0.5 rounded border border-axiom-accent/20">
                       {selectedQuest.type} // {selectedQuest.difficulty}
                     </span>
                     <h3 className="text-xl font-bold text-white mt-2">{selectedQuest.title}</h3>
                   </div>
                   
                   <p className="text-gray-300 text-sm leading-relaxed border-l-2 border-axiom-700 pl-3">
                     {selectedQuest.description}
                   </p>

                   <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-axiom-800/30 p-3 rounded">
                      <div>
                        <span className="text-gray-500 block">Rewards</span>
                        <div className="flex gap-3 mt-1">
                          <span className="text-axiom-accent">+{selectedQuest.xpReward} XP</span>
                          <span className="text-axiom-warning">+{selectedQuest.creditReward} Credits</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Linked Stat</span>
                        <span className="text-white capitalize mt-1">
                          {selectedQuest.statRewards 
                            ? Object.entries(selectedQuest.statRewards)
                                .filter(([_, val]) => Number(val) > 0)
                                .map(([key]) => key)
                                .join(', ') 
                            : selectedQuest.linkedStat}
                        </span>
                      </div>
                      <div>
                         <span className="text-gray-500 block">Penalty</span>
                         <span className="text-axiom-danger mt-1">{selectedQuest.penaltyDescription}</span>
                         <span className="text-axiom-danger/80 text-xs font-mono mt-0.5 block">
                           (-{Math.ceil(selectedQuest.xpReward * (selectedQuest.type === QuestType.EPIC ? 0.3 : selectedQuest.type === QuestType.WEEKLY ? 0.2 : 0.1))} XP on fail)
                         </span>
                      </div>
                      <div>
                         <span className="text-gray-500 block">Deadline</span>
                         <span className="text-white mt-1">{selectedQuest.deadline}</span>
                      </div>
                   </div>
                </div>
              )}

              <div className="pt-6 flex justify-between items-center border-t border-axiom-800 mt-4">
                 {isEditingQuest ? (
                   <div className="flex gap-2 w-full justify-end">
                      <button 
                        onClick={() => setIsEditingQuest(false)}
                        className="px-4 py-2 rounded text-xs font-bold uppercase hover:bg-axiom-800 text-gray-400"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleUpdateQuest}
                        className="bg-axiom-accent hover:bg-axiom-accent/80 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                      >
                        <Save size={14} /> Save Changes
                      </button>
                   </div>
                 ) : (
                   <>
                     <div className="flex gap-2">
                       <button 
                         onClick={handleDeleteQuest}
                         className="p-2 text-gray-500 hover:text-axiom-danger transition-colors"
                         title="Delete Directive"
                       >
                         <Trash2 size={16} />
                       </button>
                       <button 
                         onClick={() => setIsEditingQuest(true)}
                         className="px-3 py-2 rounded text-xs font-bold uppercase hover:bg-axiom-800 text-gray-400 transition-colors"
                       >
                         Edit
                       </button>
                     </div>
                     
                     {selectedQuest.status === QuestStatus.PENDING ? (
                       <button 
                         onClick={() => toggleQuestStatus(selectedQuest.id)}
                         className="bg-axiom-success/20 hover:bg-axiom-success/30 border border-axiom-success/50 text-axiom-success px-6 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all hover:scale-105"
                       >
                         <Check size={16} /> Complete Protocol
                       </button>
                     ) : (
                       <button 
                         onClick={() => toggleQuestStatus(selectedQuest.id)}
                         className="bg-axiom-800 hover:bg-axiom-700 border border-gray-600 text-gray-400 px-6 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
                       >
                         <Undo2 size={16} /> Revoke Status
                       </button>
                     )}
                   </>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}