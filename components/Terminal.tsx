import React, { useEffect, useRef, useState } from 'react';
import { Terminal as TerminalIcon, Send } from 'lucide-react';
import { generateGMCommentary } from '../services/geminiService';
import { Player, Quest } from '../types';

interface TerminalProps {
  player: Player;
  quests: Quest[];
  initialMessages?: string[];
  worldContext?: string;
}

const Terminal: React.FC<TerminalProps> = ({ player, quests, initialMessages = [], worldContext }) => {
  const [history, setHistory] = useState<string[]>([
    "AXIOM OS v2.4.1 initialized...",
    "User biometric signature verified.",
    "Awaiting input..."
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMessages.length > 0) {
       setHistory(prev => [
         ...prev, 
         ...initialMessages.map(msg => `SYSTEM: ${msg}`)
       ]);
    }
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // GM greeting only once per session (not on every Dashboard open / tab switch)
  const gmShownRef = useRef(false);
  useEffect(() => {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('axiom_gm_greeting_shown') === '1') return;
    if (gmShownRef.current) return;
    gmShownRef.current = true;
    const initGM = async () => {
      setIsProcessing(true);
      const greeting = await generateGMCommentary(player, quests, "Initialize session. Acknowledge user return.", worldContext);
      setHistory(prev => [...prev, `GM: ${greeting}`]);
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('axiom_gm_greeting_shown', '1');
      setIsProcessing(false);
    };
    initGM();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    const userMsg = input;
    setHistory(prev => [...prev, `USER: ${userMsg}`]);
    setInput('');
    setIsProcessing(true);

    const response = await generateGMCommentary(player, quests, userMsg, worldContext);
    setHistory(prev => [...prev, `GM: ${response}`]);
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col h-full bg-axiom-900 border border-axiom-700 rounded-md overflow-hidden font-mono text-xs md:text-sm shadow-2xl shadow-black">
      <div className="flex items-center justify-between px-3 py-2 bg-axiom-800 border-b border-axiom-700">
        <div className="flex items-center gap-2 text-axiom-accent">
          <TerminalIcon size={14} />
          <span className="uppercase tracking-widest font-bold">Game Master Link</span>
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-axiom-danger animate-pulse"></div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-2 text-gray-300">
        {history.map((line, i) => (
          <div key={i} className={`break-words ${line.startsWith('GM:') ? 'text-axiom-accent' : line.startsWith('SYSTEM:') ? 'text-axiom-danger' : 'text-gray-400'}`}>
            <span className="opacity-50 mr-2">
               {new Date().toLocaleTimeString('en-US', {hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit"})}
            </span>
            {line}
          </div>
        ))}
        {isProcessing && (
           <div className="text-axiom-accent animate-pulse">
             <span className="opacity-50 mr-2">SYSTEM</span>
             Processing...
           </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-2 bg-axiom-900 border-t border-axiom-700 flex gap-2">
        <span className="text-axiom-accent pt-1">{'>'}</span>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-transparent outline-none text-gray-200 placeholder-gray-700"
          placeholder="Enter command or query..."
          autoComplete="off"
        />
        <button 
          onClick={handleSend}
          disabled={isProcessing}
          className="text-gray-500 hover:text-white disabled:opacity-30"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default Terminal;