import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { Satellite, Calendar, Cloud, MapPin, AlertTriangle, Layers } from 'lucide-react';

const SatelliteOps = () => {
    const { activeEventId, activeEventDetails, setActiveEventDetails } = useStore();
    const [passes, setPasses] = useState([]);
    const [selectedBaseline, setSelectedBaseline] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);
    const [sliderPosition, setSliderPosition] = useState(50);
    const [loading, setLoading] = useState(false);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

    // Fetch event details and passes
    useEffect(() => {
        if (!activeEventId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch event details
                const eventRes = await fetch(`${apiUrl}/events/${activeEventId}`);
                const eventData = await eventRes.json();
                setActiveEventDetails(eventData);

                // Fetch satellite passes
                const passesRes = await fetch(`${apiUrl}/satellite/passes/${activeEventId}`);
                const passesData = await passesRes.json();
                setPasses(passesData);

                // Auto-select baseline and post-event passes
                const baseline = passesData.find(p => p.is_baseline);
                const postEvent = passesData.find(p => p.is_event_pass);
                if (baseline) setSelectedBaseline(baseline);
                if (postEvent) setSelectedPost(postEvent);
            } catch (err) {
                console.error('Failed to fetch satellite data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeEventId, apiUrl, setActiveEventDetails]);

    if (!activeEventId) {
        return (
            <div className="min-h-screen pt-32 flex flex-col items-center justify-center text-center px-8">
                <Satellite className="w-16 h-16 text-gray-600 mb-6" />
                <h2 className="text-2xl font-sora font-semibold text-ghost mb-3">No Event Selected</h2>
                <p className="text-gray-400 font-mono text-sm max-w-md">
                    Select an active disaster event from the Live Monitor to access satellite imagery comparison.
                </p>
                <a href="/monitor" className="mt-6 px-6 py-3 rounded-xl btn-solid font-semibold">
                    GO TO LIVE MONITOR
                </a>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-6 px-4 md:px-8 grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-[1920px] mx-auto">
            {/* Sidebar Metadata */}
            <div className="lg:col-span-1 flex flex-col gap-4">
                <div className="bg-graphite rounded-3xl border border-gray-800 p-6">
                    <h3 className="font-sora font-semibold text-lg text-ghost mb-4 flex items-center gap-2">
                        <Satellite className="w-5 h-5 text-plasma" />
                        Event Metadata
                    </h3>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-12 bg-void/50 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : activeEventDetails && (
                        <div className="space-y-4">
                            <div className="bg-void/50 rounded-xl p-4">
                                <div className="text-xs font-mono text-gray-500 mb-1">EVENT TITLE</div>
                                <div className="text-sm font-sora text-ghost">{activeEventDetails.title}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-void/50 rounded-xl p-3">
                                    <div className="text-[10px] font-mono text-gray-500 mb-1">LAT</div>
                                    <div className="text-sm font-mono text-plasma">{activeEventDetails.lat?.toFixed(4)}</div>
                                </div>
                                <div className="bg-void/50 rounded-xl p-3">
                                    <div className="text-[10px] font-mono text-gray-500 mb-1">LON</div>
                                    <div className="text-sm font-mono text-plasma">{activeEventDetails.lon?.toFixed(4)}</div>
                                </div>
                            </div>

                            <div className="bg-void/50 rounded-xl p-4 flex items-center gap-3">
                                <AlertTriangle className={`w-5 h-5 ${
                                    activeEventDetails.severity === 'red' ? 'text-alert-red' :
                                    activeEventDetails.severity === 'orange' ? 'text-alert-orange' : 'text-alert-green'
                                }`} />
                                <div>
                                    <div className="text-[10px] font-mono text-gray-500">SEVERITY</div>
                                    <div className="text-sm font-sora text-ghost uppercase">{activeEventDetails.severity}</div>
                                </div>
                            </div>

                            <div className="bg-void/50 rounded-xl p-4 flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-gray-400" />
                                <div>
                                    <div className="text-[10px] font-mono text-gray-500">LOCATION</div>
                                    <div className="text-sm font-sora text-ghost">{activeEventDetails.country || 'Unknown'}</div>
                                </div>
                            </div>

                            <div className="bg-void/50 rounded-xl p-4 flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                <div>
                                    <div className="text-[10px] font-mono text-gray-500">EVENT DATE</div>
                                    <div className="text-sm font-mono text-ghost">
                                        {activeEventDetails.event_date ? new Date(activeEventDetails.event_date).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pass Selection */}
                <div className="bg-graphite rounded-3xl border border-gray-800 p-6">
                    <h3 className="font-sora font-semibold text-sm text-ghost mb-4 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-plasma" />
                        Select Passes to Compare
                    </h3>

                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] font-mono text-gray-500 mb-2 block">PRE-EVENT (BASELINE)</label>
                            <select
                                value={selectedBaseline?.id || ''}
                                onChange={(e) => {
                                    const pass = passes.find(p => p.id === e.target.value);
                                    setSelectedBaseline(pass);
                                }}
                                className="w-full bg-void border border-gray-700 rounded-xl px-4 py-3 text-sm font-mono text-ghost focus:border-plasma outline-none"
                            >
                                <option value="">Select baseline...</option>
                                {passes.filter(p => p.is_baseline || !p.is_event_pass).map(pass => (
                                    <option key={pass.id} value={pass.id}>
                                        {new Date(pass.pass_date).toLocaleDateString()} — {pass.sensor}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-mono text-gray-500 mb-2 block">POST-EVENT</label>
                            <select
                                value={selectedPost?.id || ''}
                                onChange={(e) => {
                                    const pass = passes.find(p => p.id === e.target.value);
                                    setSelectedPost(pass);
                                }}
                                className="w-full bg-void border border-gray-700 rounded-xl px-4 py-3 text-sm font-mono text-ghost focus:border-plasma outline-none"
                            >
                                <option value="">Select post-event...</option>
                                {passes.filter(p => p.is_event_pass || !p.is_baseline).map(pass => (
                                    <option key={pass.id} value={pass.id}>
                                        {new Date(pass.pass_date).toLocaleDateString()} — {pass.sensor}
                                        {pass.cloud_cover_pct ? ` (${pass.cloud_cover_pct}% cloud)` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Viewport - Before/After Slider */}
            <div className="lg:col-span-3 flex flex-col gap-6">
                <div className="relative flex-1 min-h-[500px] rounded-3xl overflow-hidden border border-gray-800 bg-void">
                    {/* Before Image (Full Width) */}
                    <div className="absolute inset-0">
                        <img
                            src={selectedBaseline?.thumbnail_url || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80'}
                            alt="Pre-event baseline"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 left-4 bg-void/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-700">
                            <span className="text-xs font-mono text-gray-400">BASELINE</span>
                        </div>
                    </div>

                    {/* After Image (Clipped by slider) */}
                    <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                    >
                        <img
                            src={selectedPost?.thumbnail_url || 'https://images.unsplash.com/photo-1590483864700-1cffa7bfcaaa?w=1200&q=80'}
                            alt="Post-event damage"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 right-4 bg-void/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-plasma/50">
                            <span className="text-xs font-mono text-plasma">POST-EVENT</span>
                        </div>
                    </div>

                    {/* Slider Handle */}
                    <div
                        className="absolute top-0 bottom-0 w-1 bg-plasma cursor-ew-resize z-20"
                        style={{ left: `${sliderPosition}%` }}
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-plasma rounded-full flex items-center justify-center shadow-glow">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M18 8L22 12L18 16" />
                                <path d="M6 8L2 12L6 16" />
                            </svg>
                        </div>
                    </div>

                    {/* Slider Control */}
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderPosition}
                        onChange={(e) => setSliderPosition(Number(e.target.value))}
                        className="absolute bottom-0 left-0 right-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                    />

                    {/* Bottom Label Bar */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-void/80 backdrop-blur-md border border-gray-700 px-6 py-3 rounded-2xl flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-[10px] font-mono text-gray-500">BASELINE</div>
                            <div className="text-xs font-mono text-ghost">
                                {selectedBaseline ? new Date(selectedBaseline.pass_date).toLocaleDateString() : 'Not selected'}
                            </div>
                        </div>
                        <div className="w-px h-8 bg-gray-700" />
                        <div className="text-center">
                            <div className="text-[10px] font-mono text-plasma">POST-EVENT</div>
                            <div className="text-xs font-mono text-ghost">
                                {selectedPost ? new Date(selectedPost.pass_date).toLocaleDateString() : 'Not selected'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pass Metadata */}
                {(selectedBaseline || selectedPost) && (
                    <div className="grid grid-cols-2 gap-4">
                        {selectedBaseline && (
                            <div className="bg-graphite rounded-2xl border border-gray-800 p-4 flex items-center gap-4">
                                <Cloud className="w-8 h-8 text-gray-500" />
                                <div>
                                    <div className="text-[10px] font-mono text-gray-500">BASELINE CLOUD COVER</div>
                                    <div className="text-lg font-mono text-ghost">{selectedBaseline.cloud_cover_pct || 0}%</div>
                                </div>
                            </div>
                        )}
                        {selectedPost && (
                            <div className="bg-graphite rounded-2xl border border-gray-800 p-4 flex items-center gap-4">
                                <Cloud className="w-8 h-8 text-plasma" />
                                <div>
                                    <div className="text-[10px] font-mono text-plasma">POST-EVENT CLOUD COVER</div>
                                    <div className="text-lg font-mono text-ghost">{selectedPost.cloud_cover_pct || 0}%</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SatelliteOps;
