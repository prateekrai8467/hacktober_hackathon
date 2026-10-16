import React from 'react';
import { useStore } from '../../store';
import { Zap, Droplets, HeartPulse, ShieldAlert, Radio } from 'lucide-react';

const InfraIcon = ({ type }) => {
    switch (type) {
        case 'hospital': return <HeartPulse className="w-3.5 h-3.5" />;
        case 'power': return <Zap className="w-3.5 h-3.5" />;
        case 'water': return <Droplets className="w-3.5 h-3.5" />;
        case 'comms': return <Radio className="w-3.5 h-3.5" />;
        default: return <ShieldAlert className="w-3.5 h-3.5" />;
    }
};

const RiskBadge = ({ risk }) => {
    if (risk === 'critical') return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-alert-red/20 text-alert-red border border-alert-red/30 uppercase tracking-widest animate-pulse">Critical</span>;
    if (risk === 'high') return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-alert-orange/20 text-alert-orange border border-alert-orange/30 uppercase tracking-widest">High Risk</span>;
    return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-alert-yellow/20 text-alert-yellow border border-alert-yellow/30 uppercase tracking-widest">Monitor</span>;
};

const InfraRiskPanel = () => {
    const { activeEventId, analysisData } = useStore();

    if (!activeEventId) return null;

    const facilities = analysisData?.at_risk_facilities || [];
    const criticalCount = facilities.filter(f => f.risk_level === 'critical').length;

    return (
        <div className="bg-graphite border border-gray-800 p-5 rounded-3xl flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-sora font-semibold text-sm flex items-center gap-2 text-ghost">
                    <ShieldAlert className="w-4 h-4 text-plasma" />
                    Critical Infrastructure
                </h3>
                {criticalCount > 0 && (
                    <span className="text-xs font-mono text-alert-red animate-pulse">{criticalCount} CRITICAL</span>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-2 pb-2">
                {facilities.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-2 border border-dashed border-gray-800 rounded-2xl p-4">
                        <span className="text-[10px] font-mono text-center">NO INFRASTRUCTURE DATA<br />AWAITING ANALYSIS</span>
                    </div>
                )}

                {facilities.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center justify-between p-3 rounded-2xl bg-void/60 border border-gray-800/80 hover:border-gray-600 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl border ${item.risk_level === 'critical' ? 'bg-alert-red/10 border-alert-red/20 text-alert-red' :
                                item.risk_level === 'high' ? 'bg-alert-orange/10 border-alert-orange/20 text-alert-orange' :
                                    'bg-gray-800 border-gray-700 text-gray-400'
                                }`}>
                                <InfraIcon type={item.facility_type} />
                            </div>
                            <div>
                                <div className="text-xs font-sora font-semibold text-ghost">{item.name}</div>
                                <div className="text-[10px] font-mono text-gray-500 uppercase">{item.facility_type} · {item.distance || 'Unknown'}</div>
                            </div>
                        </div>
                        <RiskBadge risk={item.risk_level} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InfraRiskPanel;
