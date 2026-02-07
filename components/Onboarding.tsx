import React, { useState } from 'react';
import { Player } from '../types';
import { AVATAR_PRESETS } from '../constants';
import { Shield, ChevronRight, User } from 'lucide-react';

interface OnboardingProps {
  player: Player;
  onComplete: (name: string, avatar: string, riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH') => void;
}

export default function Onboarding({ player, onComplete }: OnboardingProps) {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [riskTolerance, setRiskTolerance] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete(name, selectedAvatar, riskTolerance);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      
      <div className="w-full max-w-2xl bg-axiom-900 border border-axiom-800 rounded-lg shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left: Avatar Selection */}
        <div className="w-full md:w-1/3 bg-axiom-800 p-6 flex flex-col items-center border-b md:border-b-0 md:border-r border-axiom-700">
           <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-4">Select Avatar</h3>
           
           <div className="w-32 h-32 rounded-full border-2 border-axiom-accent p-1 mb-6 bg-black shadow-[0_0_20px_rgba(124,58,237,0.3)]">
             <img src={selectedAvatar} alt="Selected Avatar" className="w-full h-full rounded-full" />
           </div>

           <div className="grid grid-cols-4 gap-2">
              {AVATAR_PRESETS.map((avatar, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${selectedAvatar === avatar ? 'border-axiom-accent scale-110' : 'border-transparent opacity-50 hover:opacity-100 hover:border-gray-500'}`}
                >
                  <img src={avatar} alt={`Preset ${idx}`} className="w-full h-full rounded-full" />
                </button>
              ))}
           </div>
        </div>

        {/* Right: Details */}
        <div className="w-full md:w-2/3 p-8 flex flex-col">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-[0.2em] flex items-center gap-2">
              <Shield className="text-axiom-accent" />
              IDENTITY SETUP
            </h1>
            <p className="text-xs text-gray-500 font-mono mt-2">INITIALIZING NEW OPERATIVE PROFILE...</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 flex-1">
             <div>
                <label className="block text-xs font-mono text-gray-500 uppercase mb-2">Operative Callsign (Username)</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-600" size={16} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black border border-axiom-700 rounded py-2.5 pl-10 pr-4 text-white focus:border-axiom-accent outline-none font-mono"
                    placeholder="ENTER_NAME"
                    maxLength={15}
                    autoFocus
                    required
                  />
                </div>
             </div>

             <div>
               <label className="block text-xs font-mono text-gray-500 uppercase mb-2">Risk Tolerance</label>
               <div className="grid grid-cols-3 gap-2">
                 {['LOW', 'MEDIUM', 'HIGH'].map((level) => (
                   <button
                     type="button"
                     key={level}
                     onClick={() => setRiskTolerance(level as any)}
                     className={`py-2 rounded border text-xs font-bold transition-all ${riskTolerance === level ? 'bg-axiom-accent text-white border-axiom-accent' : 'bg-transparent text-gray-500 border-axiom-800 hover:border-gray-600'}`}
                   >
                     {level}
                   </button>
                 ))}
               </div>
               <p className="text-[10px] text-gray-600 mt-2 font-mono">
                 *Determines penalty severity and quest difficulty scaling.
               </p>
             </div>

             <div className="mt-auto pt-4">
               <button 
                 type="submit"
                 className="w-full bg-axiom-white bg-white text-black hover:bg-gray-200 font-bold py-3 rounded uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2"
               >
                 Initialize System <ChevronRight size={16} />
               </button>
             </div>
          </form>
        </div>
      </div>
    </div>
  );
}