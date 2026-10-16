import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { Flame, Waves, Activity, Wind, AlertTriangle, MountainSnow, RefreshCw } from 'lucide-react';

const EventIcon = ({ type }) => {
    switch (type) {
        case 'WF': return <Flame className="w-5 h-5 text-alert-orange" />;
        case 'FL': return <Waves className="w-5 h-5 text-blue-400" />;
        case 'EQ': return <Activity className="w-5 h-5 text-alert-red" />;
        case 'TC': return <Wind className="w-5 h-5 text-gray-400" />;
        case 'VO': return <MountainSnow className="w-5 h-5 text-alert-red" />;
        default: return <AlertTriangle className="w-5 h-5 text-alert-yellow" />;
    }
};

const EventSidebar = () => {
    const { events, sidebarFilter, setSidebarFilter, setActiveEventId, activeEventId, wsConnected, fetchEvents } = useStore();
    const [syncing, setSyncing] = useState(false);
    const loading = !wsConnected && events.length === 0;

    // On mount, do a REST fetch as fallback
    useEffect(() => {
        if (events.length === 0) {
            fetchEvents();
        }
    }, []);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            await fetch(`${apiUrl}/events/sync`, { method: 'POST' });
            await fetchEvents();
        } catch (err) {
            console.error('Sync failed:', err);
        }
        setSyncing(false);
    };

    const filteredEvents = events.filter(e =>
        sidebarFilter === 'ALL' || e.event_type === sidebarFilter
    );

    return (
        <div className="h-full flex flex-col bg-graphite rounded-3xl border border-gray-800 p-4">
            <h2 className="text-xl font-sora font-semibold mb-4 text-ghost flex items-center justify-between">
                <span>Live Monitor</span>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="p-1.5 rounded-lg bg-void border border-gray-700 text-gray-400 hover:text-plasma hover:border-plasma transition-colors disabled:opacity-50"
                        title="Sync live feeds"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="flex items-center gap-2 text-xs font-mono">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${wsConnected ? 'bg-alert-green' : 'bg-alert-orange'}`}></span>
                        <span className={wsConnected ? 'text-alert-green' : 'text-alert-orange'}>
                            {wsConnected ? 'LIVE' : 'REST'}
                        </span>
                    </div>
                </div>
            </h2>

            {/* Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto custom-scrollbar pb-2">
                {['ALL', 'WF', 'FL', 'EQ', 'TC', 'VO'].map(f => (
                    <button
                        key={f}
                        onClick={() => setSidebarFilter(f)}
                        className={`px-3 py-1 text-xs font-mono rounded-full border transition-colors whitespace-nowrap ${sidebarFilter === f
                            ? 'bg-plasma text-white border-plasma'
                            : 'bg-void text-gray-400 border-gray-700 hover:border-plasma hover:text-white'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Event count */}
            <div className="text-[10px] font-mono text-gray-500 mb-3 uppercase tracking-widest">
                {filteredEvents.length} active event{filteredEvents.length !== 1 ? 's' : ''}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col gap-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-void/50 rounded-2xl border border-gray-800 animate-pulse"></div>
                    ))}
                </div>
            )}

            {/* Event List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2">
                {!loading && filteredEvents.map((ev, i) => (
                    <div
                        key={ev.id}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${activeEventId === ev.id
                            ? 'bg-void border-plasma shadow-glow'
                            : 'bg-void/40 border-gray-800 hover:border-gray-600 hover:-translate-y-1'
                            }`}
                        onClick={() => setActiveEventId(ev.id)}
                        style={{ animationDelay: `${i * 100}ms` }}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <EventIcon type={ev.event_type} />
                                <span className="font-mono text-xs text-gray-400">
                                    {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : '—'}
                                </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${ev.severity === 'red' ? 'bg-alert-red/20 text-alert-red' :
                                ev.severity === 'orange' ? 'bg-alert-orange/20 text-alert-orange' :
                                    'bg-alert-green/20 text-alert-green'
                                }`}>
                                {ev.severity}
                            </span>
                        </div>

                        <h3 className="font-sora text-sm font-semibold text-ghost mb-1 line-clamp-2">
                            {ev.title}
                        </h3>

                        {ev.country && (
                            <div className="text-[10px] font-mono text-gray-500 mb-3">
                                📍 {ev.country} {ev.affected_population ? `· ${Number(ev.affected_population).toLocaleString()} affected` : ''}
                            </div>
                        )}

                        <button
                            className={`w-full py-2 rounded-xl text-xs font-bold transition-all btn-magnetic ${activeEventId === ev.id
                                ? 'bg-plasma text-white'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                        >
                            {activeEventId === ev.id ? 'ANALYZING...' : 'ANALYZE AREA'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EventSidebar;
