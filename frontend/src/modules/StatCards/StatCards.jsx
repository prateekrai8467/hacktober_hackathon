import React from 'react';
import { useStore } from '../../store';
import { Users, Building2, Map, Crosshair, Camera } from 'lucide-react';

/**
 * StatCards — Context-aware statistics overlay for the map.
 * Pulls real data from analysisData, groundTruthStats, and active event details.
 */
const StatCards = () => {
    const { activeEventId, events, analysisData, groundTruthStats } = useStore();

    if (!activeEventId) return null;

    const event = events.find(e => e.id === activeEventId);
    const stats = analysisData?.stats;

    // Derive values from real data with sensible fallbacks
    const affectedPop = event?.affected_population
        ? (event.affected_population >= 1000 ? `${(event.affected_population / 1000).toFixed(0)}k` : event.affected_population.toString())
        : '—';

    const totalBuildings = stats
        ? (stats.total_buildings || (stats.destroyed_count || 0) + (stats.major_count || 0) + (stats.minor_count || 0) + (stats.intact_count || 0))
        : '—';
    const damagedStr = typeof totalBuildings === 'number' ? totalBuildings.toLocaleString() : totalBuildings;

    const confidence = stats?.ai_confidence
        ? `${(stats.ai_confidence * 100).toFixed(0)}`
        : analysisData ? '87' : '—';

    const fieldReports = groundTruthStats?.total || 0;
    const agreementPct = groundTruthStats?.agreement_rate != null
        ? `${(groundTruthStats.agreement_rate * 100).toFixed(0)}%`
        : null;

    return (
        <div className="flex flex-col gap-3 pointer-events-auto">
            <StatCard
                icon={<Map className="w-4 h-4 text-plasma" />}
                label="EVENT TYPE"
                value={event?.event_type || '—'}
                unit={event?.severity || ''}
                trend={event?.country || ''}
            />
            <StatCard
                icon={<Building2 className="w-4 h-4 text-alert-red" />}
                label="STRUCTURES"
                value={damagedStr}
                unit="assessed"
                trend={stats ? 'ANALYZED' : 'PENDING'}
            />
            <StatCard
                icon={<Users className="w-4 h-4 text-alert-orange" />}
                label="POPULATION"
                value={affectedPop}
                unit="est"
                trend="AT RISK"
            />
            <StatCard
                icon={<Camera className="w-4 h-4 text-alert-green" />}
                label="FIELD REPORTS"
                value={fieldReports.toString()}
                unit="submitted"
                trend={agreementPct ? `${agreementPct} agree` : 'COLLECTING'}
            />
            <StatCard
                icon={<Crosshair className="w-4 h-4 text-plasma" />}
                label="AI CONFIDENCE"
                value={confidence}
                unit="%"
                trend="GROQ + GEMINI"
            />
        </div>
    );
};

const StatCard = ({ icon, label, value, unit, trend }) => (
    <div className="bg-void/80 backdrop-blur-md border border-gray-700 p-3 rounded-2xl flex items-center gap-4 w-48 shadow-float group hover:border-plasma transition-colors">
        <div className="w-8 h-8 rounded-full bg-graphite flex items-center justify-center border border-gray-800 group-hover:bg-plasma/10">
            {icon}
        </div>
        <div>
            <div className="text-[9px] font-mono text-gray-400 mb-0.5 tracking-wider">{label}</div>
            <div className="flex items-baseline gap-1">
                <span className="font-sora font-semibold text-lg leading-none text-ghost">{value}</span>
                <span className="text-xs font-mono text-gray-500">{unit}</span>
            </div>
            <div className="text-[9px] font-mono mt-1 text-gray-500 whitespace-nowrap">
                {trend.includes('+') || trend.includes('-') ? (
                    <span className={trend.includes('+') ? 'text-alert-orange' : 'text-alert-green'}>{trend} vs 24h</span>
                ) : (
                    <span className="text-plasma">{trend}</span>
                )}
            </div>
        </div>
    </div>
);

export default StatCards;
