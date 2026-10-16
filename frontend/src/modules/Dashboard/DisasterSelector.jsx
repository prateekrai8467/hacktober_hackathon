import React, { useState } from 'react';
import { ChevronDown, Flame, Waves, Activity, Wind, AlertTriangle } from 'lucide-react';

const TypeIcon = ({ type }) => {
  switch (type) {
    case 'WF': return <Flame className="w-4 h-4 text-alert-orange" />;
    case 'FL': return <Waves className="w-4 h-4 text-blue-400" />;
    case 'EQ': return <Activity className="w-4 h-4 text-alert-red" />;
    case 'TC': return <Wind className="w-4 h-4 text-gray-400" />;
    default: return <AlertTriangle className="w-4 h-4 text-alert-yellow" />;
  }
};

const DisasterSelector = ({ disasters, selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-graphite border border-gray-800 hover:border-plasma/50 rounded-2xl px-5 py-3 min-w-[280px] transition-all"
      >
        <TypeIcon type={selected.type} />
        <div className="flex-1 text-left">
          <div className="text-sm font-sora font-semibold text-ghost truncate">{selected.title}</div>
          <div className="text-xs font-mono text-gray-500">{selected.date}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 right-0 w-80 bg-graphite border border-gray-800 rounded-2xl shadow-float z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-800">
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Historical Case Studies</span>
            </div>
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {disasters.map(disaster => (
                <button
                  key={disaster.id}
                  onClick={() => {
                    onSelect(disaster);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-void/50 transition-colors ${
                    selected.id === disaster.id ? 'bg-plasma/10 border-l-2 border-plasma' : ''
                  }`}
                >
                  <TypeIcon type={disaster.type} />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-sora text-ghost truncate">{disaster.title}</div>
                    <div className="text-xs font-mono text-gray-500">{disaster.location} • {disaster.date}</div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                    disaster.severity === 'red' ? 'bg-alert-red/20 text-alert-red' :
                    disaster.severity === 'orange' ? 'bg-alert-orange/20 text-alert-orange' :
                    'bg-alert-green/20 text-alert-green'
                  }`}>
                    {disaster.type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DisasterSelector;
