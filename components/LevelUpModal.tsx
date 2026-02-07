import React from 'react';
import { Shield, Check, Star, Zap } from 'lucide-react';
import { getLevelTitle } from '../constants';

interface LevelUpModalProps {
  oldLevel: number;
  newLevel: number;
  onClose: () => void;
}

export default function LevelUpModal({ oldLevel, newLevel, onClose }: LevelUpModalProps) {
  const title = getLevelTitle(newLevel);
  const prevTitle = getLevelTitle(oldLevel);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-axiom-900 border-2 border-axiom-accent rounded-lg shadow-[0_0_50px_rgba(124,58,237,0.5)] w-full max-w-md relative overflow-hidden text-center p-8">
        
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        <div className="scanline absolute inset-0 z-0 opacity-30 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-axiom-accent/20 border-2 border-axiom-accent mb-6 animate-pulse shadow-[0_0_20px_rgba(124,58,237,0.5)]">
             <Shield size={48} className="text-axiom-accent" />
          </div>

          <h2 className="text-3xl font-bold text-white tracking-[0.2em] mb-2 uppercase">Promotion</h2>
          
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="text-xs font-mono text-gray-500 mb-1 uppercase tracking-widest">
               Clearance Level {oldLevel} <span className="text-axiom-accent">→</span> {newLevel}
            </div>
            
            {title === prevTitle ? (
               <div className="text-white font-bold text-lg">{title} (Grade {newLevel})</div>
            ) : (
               <div className="flex items-center justify-center gap-3 text-sm font-mono text-gray-400">
                  <span>{prevTitle}</span>
                  <span className="text-axiom-accent">→</span>
                  <span className="text-white font-bold text-lg">{title}</span>
               </div>
            )}
          </div>

          <div className="space-y-3 mb-8 text-left bg-black/50 p-4 rounded border border-axiom-800">
             <div className="flex items-center gap-3">
               <div className="bg-axiom-success/20 p-1 rounded text-axiom-success"><Check size={16} /></div>
               <span className="text-gray-300 text-sm">Clearance Level {newLevel} Granted</span>
             </div>
             <div className="flex items-center gap-3">
               <div className="bg-axiom-warning/20 p-1 rounded text-axiom-warning"><Star size={16} /></div>
               <span className="text-gray-300 text-sm">Directives Difficulty Cap Increased</span>
             </div>
             <div className="flex items-center gap-3">
               <div className="bg-axiom-accent/20 p-1 rounded text-axiom-accent"><Zap size={16} /></div>
               <span className="text-gray-300 text-sm">Store Privileges Updated</span>
             </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-axiom-accent hover:bg-axiom-accent/80 text-white font-bold py-3 rounded uppercase tracking-wider text-sm transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] hover:scale-[1.02]"
          >
            Acknowledge & Proceed
          </button>
        </div>
      </div>
    </div>
  );
}