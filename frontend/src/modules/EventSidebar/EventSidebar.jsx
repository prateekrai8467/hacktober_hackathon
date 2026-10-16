import React from 'react';
import { useStore } from '../../store';
import { Flame, Waves, Activity, Wind, AlertTriangle, MountainSnow } from 'lucide-react';
import gsap from 'gsap';

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
    const { events, sidebarFilter, setSidebarFilter, setActiveEventId, activeEventId, wsConnected } = useStore();
    const loading = !wsConnected && events.length === 0;

    const filteredEvents = events.filter(e =>
        sidebarFilter === 'ALL' || e.event_type === sidebarFilter
    );

    return (
        <div className="h-full flex flex-col bg-graphite rounded-3xl border border-gray-800 p-4">
            <h2 className="text-xl font-sora font-semibold mb-4 text-ghost flex items-center justify-between">
                Live Monitor
                <div className="flex items-center gap-2 text-xs font-mono text-alert-green">
                    <span className="w-2 h-2 rounded-full bg-alert-green animate-pulse"></span>
                    ACTIVE
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
                                <span className="font-mono text-xs text-gray-400">{ev.event_date}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${ev.severity === 'red' ? 'bg-alert-red/20 text-alert-red' :
                                ev.severity === 'orange' ? 'bg-alert-orange/20 text-alert-orange' :
                                    'bg-alert-green/20 text-alert-green'
                                }`}>
                                {ev.severity}
                            </span>
                        </div>

                        <h3 className="font-sora text-sm font-semibold text-ghost mb-3 line-clamp-2">
                            {ev.title}
                        </h3>

                        <button
                            className={`w-full py-2 rounded-xl text-xs font-bold transition-all btn-magnetic ${activeEventId === ev.id
                                ? 'bg-plasma text-white'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                        >
                            ANALYZE AREA
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EventSidebar;
