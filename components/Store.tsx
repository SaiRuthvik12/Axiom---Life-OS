import React from 'react';
import { Reward, Player } from '../types';
import { Lock, Coins, ShoppingCart, Check, Tv, Pizza, Cpu, GlassWater, PauseCircle, PlayCircle } from 'lucide-react';

interface StoreProps {
  player: Player;
  rewards: Reward[];
  onPurchase: (rewardId: string) => void;
  onConsume: (rewardId: string) => void;
}

// Map string icon names to Lucide components
const IconMap: Record<string, any> = {
  Tv, Pizza, Cpu, GlassWater, PauseCircle
};

const Store: React.FC<StoreProps> = ({ player, rewards, onPurchase, onConsume }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-axiom-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-widest text-white flex items-center gap-2">
            <ShoppingCart className="text-axiom-accent" /> REQUISITIONS
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-1">EXCHANGE CREDITS FOR PRIVILEGES. DO NOT INDULGE.</p>
        </div>
        <div className="bg-axiom-800 px-4 py-2 rounded border border-axiom-700 flex items-center gap-3">
          <span className="text-xs text-gray-400 font-mono uppercase">Available Funds</span>
          <span className="text-lg font-bold text-axiom-warning flex items-center gap-1 font-mono">
            <Coins size={16} /> {player.credits}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map(reward => {
          const isLocked = player.level < reward.minLevel;
          const canAfford = player.credits >= reward.cost;
          const Icon = IconMap[reward.icon] || ShoppingCart;

          return (
            <div 
              key={reward.id}
              className={`
                relative p-5 rounded-lg border flex flex-col h-full transition-all
                ${reward.purchased 
                  ? 'bg-axiom-success/5 border-axiom-success/30' 
                  : isLocked 
                    ? 'bg-black/50 border-gray-800 opacity-60 grayscale' 
                    : 'bg-axiom-900 border-axiom-700 hover:border-axiom-accent hover:shadow-[0_0_15px_rgba(124,58,237,0.1)]'
                }
              `}
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-md ${reward.purchased ? 'bg-axiom-success/20 text-axiom-success' : 'bg-axiom-800 text-gray-400'}`}>
                  <Icon size={20} />
                </div>
                <div className="text-right">
                  <div className={`font-mono font-bold ${canAfford || reward.purchased ? 'text-axiom-warning' : 'text-gray-600'}`}>
                    {reward.purchased ? 'OWNED' : `¢ ${reward.cost}`}
                  </div>
                  {isLocked && !reward.purchased && (
                    <div className="flex items-center justify-end gap-1 text-[10px] text-axiom-danger font-mono mt-1">
                      <Lock size={10} /> LVL {reward.minLevel} REQ
                    </div>
                  )}
                </div>
              </div>

              <h3 className="font-bold text-gray-200 mb-1">{reward.title}</h3>
              <p className="text-xs text-gray-500 mb-4 flex-1">{reward.description}</p>
              
              {reward.purchased ? (
                 <button
                    onClick={() => onConsume(reward.id)}
                    className="w-full py-2 rounded text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-axiom-success hover:bg-axiom-success/80 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                 >
                    <PlayCircle size={14} /> Consume / Activate
                 </button>
              ) : (
                <button
                  onClick={() => !isLocked && canAfford && onPurchase(reward.id)}
                  disabled={isLocked || !canAfford}
                  className={`
                    w-full py-2 rounded text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2
                    ${isLocked
                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        : canAfford
                          ? 'bg-axiom-accent hover:bg-axiom-accent/80 text-white shadow-lg shadow-axiom-accent/20'
                          : 'bg-axiom-800 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                   {isLocked ? (
                    <> <Lock size={14} /> Locked </>
                  ) : canAfford ? (
                    'Purchase'
                  ) : (
                    'Insufficient Funds'
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Store;