import React from 'react';
import { Quest, QuestStatus } from '../types';
import { AlertCircle, CheckCircle, Radio, Activity, Coins, Square, CheckSquare, Zap } from 'lucide-react';

interface QuestCardProps {
  quest: Quest;
  onClick: (quest: Quest) => void;
  onToggleStatus?: (questId: string, e: React.MouseEvent) => void;
}

const QuestCard: React.FC<QuestCardProps> = ({ quest, onClick, onToggleStatus }) => {
  const getStatusColor = (status: QuestStatus) => {
    switch (status) {
      case QuestStatus.COMPLETED: return 'border-axiom-success bg-axiom-success/10 text-axiom-success';
      case QuestStatus.FAILED: return 'border-axiom-danger bg-axiom-danger/10 text-axiom-danger';
      case QuestStatus.VERIFYING: return 'border-axiom-warning bg-axiom-warning/10 text-axiom-warning';
      default: return 'border-axiom-700 bg-axiom-800/50 text-gray-300 hover:border-axiom-accent';
    }
  };

  const renderStatusIcon = () => {
    if (quest.status === QuestStatus.COMPLETED) {
      return <CheckSquare size={20} className="text-axiom-success" />;
    }
    if (quest.status === QuestStatus.FAILED) {
      return <AlertCircle size={20} className="text-axiom-danger" />;
    }
    if (quest.status === QuestStatus.VERIFYING) {
      return <Activity size={20} className="text-axiom-warning animate-pulse" />;
    }
    return <Square size={20} className="text-gray-500 group-hover:text-axiom-accent transition-colors" />;
  };

  return (
    <div 
      onClick={() => onClick(quest)}
      className={`relative border-l-4 p-4 mb-3 rounded-r-md transition-all cursor-pointer group ${getStatusColor(quest.status)}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-wider opacity-70">
              [{quest.type}] :: {quest.difficulty}
            </span>
            {quest.status === QuestStatus.VERIFYING && (
              <span className="text-[10px] bg-axiom-warning text-black px-1 rounded font-bold uppercase">
                Syncing {quest.dataSource}
              </span>
            )}
          </div>
          <h3 className={`font-bold text-sm md:text-base group-hover:text-white transition-colors ${quest.status === QuestStatus.COMPLETED ? 'line-through opacity-70' : ''}`}>
            {quest.title}
          </h3>
          <p className="text-xs md:text-sm opacity-80 mt-1 line-clamp-2">{quest.description}</p>
          
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-axiom-accent">
              XP +{quest.xpReward}
            </span>
            <span className="flex items-center gap-1 text-axiom-warning">
              <Coins size={12} />
              +{quest.creditReward}
            </span>
            
            {/* Stat Rewards Display */}
            <div className="flex gap-2">
              {Object.entries(quest.statRewards || {})
                .filter(([_, val]) => Number(val) > 0)
                .map(([stat, val]) => (
                <span key={stat} className="flex items-center gap-1 text-gray-400">
                  <Zap size={10} className="text-gray-500" />
                  {stat.slice(0,3).toUpperCase()} +{val}
                </span>
              ))}
            </div>

            {quest.status === QuestStatus.PENDING && (
               <span className="flex items-center gap-1 text-axiom-danger opacity-70 ml-auto md:ml-0">
                 <AlertCircle size={12} />
                 {quest.penaltyDescription}
               </span>
            )}
          </div>
        </div>

        <div className="ml-4 flex flex-col items-end gap-2 h-full justify-between">
           <button 
             onClick={(e) => onToggleStatus && onToggleStatus(quest.id, e)}
             className="p-2 rounded hover:bg-white/10 transition-colors"
             title={quest.status === QuestStatus.COMPLETED ? "Undo Completion" : "Complete Protocol"}
           >
             {renderStatusIcon()}
           </button>
           
           <span className="text-[10px] font-mono opacity-50 flex items-center gap-1 mt-2">
             {quest.deadline}
           </span>
        </div>
      </div>
    </div>
  );
};

export default QuestCard;