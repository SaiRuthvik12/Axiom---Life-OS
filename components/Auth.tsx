import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Shield, Lock, Mail, ChevronRight, AlertCircle, Loader, CheckCircle } from 'lucide-react';

export default function Auth({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!isSupabaseConfigured()) {
      setError("System Error: SUPABASE_URL or KEY missing in environment.");
      setLoading(false);
      return;
    }

    try {
      if (mode === 'SIGNUP') {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        if (data.user && data.session) {
           setMessage("Identity created. Initializing uplink...");
           // Auto login logic handled by App.tsx subscription
        } else if (data.user && !data.session) {
           setMessage("Identity verification required. Check your external comms (Email).");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
       {/* Background Grid */}
       <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
       <div className="scanline absolute inset-0 z-0 opacity-20 pointer-events-none"></div>

       <div className="bg-axiom-900 border border-axiom-800 p-8 rounded-lg shadow-2xl max-w-md w-full relative z-10">
         <div className="text-center mb-8">
           <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-axiom-800 border border-axiom-700 mb-4 text-axiom-accent">
             <Shield size={32} />
           </div>
           <h1 className="text-2xl font-bold tracking-[0.2em] text-white">AXIOM</h1>
           <p className="text-xs text-gray-500 font-mono mt-2">LIFE OPERATING SYSTEM // AUTH_GATE</p>
         </div>

         <form onSubmit={handleAuth} className="space-y-4">
           <div className="space-y-1">
             <label className="text-xs font-mono text-gray-500 uppercase">Identity String</label>
             <div className="relative">
               <Mail className="absolute left-3 top-2.5 text-gray-600" size={16} />
               <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black border border-axiom-800 rounded py-2 pl-10 pr-4 text-gray-300 focus:border-axiom-accent focus:outline-none font-mono text-sm"
                placeholder="operative@axiom.os"
               />
             </div>
           </div>

           <div className="space-y-1">
             <label className="text-xs font-mono text-gray-500 uppercase">Access Code</label>
             <div className="relative">
               <Lock className="absolute left-3 top-2.5 text-gray-600" size={16} />
               <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black border border-axiom-800 rounded py-2 pl-10 pr-4 text-gray-300 focus:border-axiom-accent focus:outline-none font-mono text-sm"
                placeholder="••••••••"
               />
             </div>
           </div>

           {error && (
             <div className="bg-axiom-danger/10 border border-axiom-danger/20 p-3 rounded flex items-start gap-2">
               <AlertCircle size={16} className="text-axiom-danger shrink-0 mt-0.5" />
               <span className="text-xs text-axiom-danger">{error}</span>
             </div>
           )}

           {message && (
             <div className="bg-axiom-success/10 border border-axiom-success/20 p-3 rounded flex items-start gap-2">
               <CheckCircle size={16} className="text-axiom-success shrink-0 mt-0.5" />
               <span className="text-xs text-axiom-success">{message}</span>
             </div>
           )}

           <button 
             type="submit" 
             disabled={loading}
             className="w-full bg-axiom-accent hover:bg-axiom-accent/80 text-white font-bold py-2 rounded uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2 mt-2"
           >
             {loading ? <Loader className="animate-spin" size={16} /> : <ChevronRight size={16} />}
             {mode === 'LOGIN' ? 'Establish Link' : 'Initialize Profile'}
           </button>
         </form>

         <div className="mt-6 text-center">
           <button 
             onClick={() => { setError(null); setMessage(null); setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN'); }}
             className="text-xs text-gray-500 hover:text-white underline underline-offset-4 font-mono"
           >
             {mode === 'LOGIN' ? 'New Operative? Initialize Sequence' : 'Existing Operative? Reconnect'}
           </button>
         </div>
       </div>
    </div>
  );
}