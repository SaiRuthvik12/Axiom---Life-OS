import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { PlayerStats } from '../types';

interface StatsRadarProps {
  stats: PlayerStats;
}

const StatsRadar: React.FC<StatsRadarProps> = ({ stats }) => {
  const data = Object.entries(stats).map(([key, value]) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1),
    A: value,
    fullMark: 100,
  }));

  return (
    <div className="w-full h-64 relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#3f3f46" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'JetBrains Mono' }} 
          />
          <Radar
            name="Player"
            dataKey="A"
            stroke="#7c3aed"
            strokeWidth={2}
            fill="#7c3aed"
            fillOpacity={0.2}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-axiom-700"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-axiom-700"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-axiom-700"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-axiom-700"></div>
    </div>
  );
};

export default StatsRadar;
