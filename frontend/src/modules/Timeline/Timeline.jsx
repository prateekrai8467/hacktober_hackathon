import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { Camera, Play } from 'lucide-react';
import gsap from 'gsap';

const Timeline = () => {
    const { activeEventId } = useStore();
    const [selected, setSelected] = useState(null);
    const [passes, setPasses] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!activeEventId) return;
        setLoading(true);
        const url = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

        fetch(`${url}/satellite/passes/${activeEventId}`)
            .then(res => res.json())
            .then(data => {
                setPasses(data);
                if (data.length > 0) setSelected(data[0].id); // Autoselect most recent
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch passes", err);
                setLoading(false);
            });
    }, [activeEventId]);

    if (!activeEventId) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500 font-mono text-sm">
                SELECT AN EVENT TO VIEW SATELLITE PASSES
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 text-ghost">
                <h3 className="font-sora font-semibold text-sm flex items-center gap-2">
                    <Camera className="w-4 h-4 text-plasma" />
                    Multi-Temporal Pass Archive
                </h3>
                <button className="text-xs font-mono text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                    <Play className="w-3 h-3" />
                    PLAY TIMELAPSE
                </button>
            </div>

            <div className="flex-1 flex gap-4 overflow-x-auto custom-scrollbar pb-2 items-center">
                {passes.map((pass, i) => (
                    <div
                        key={pass.id}
                        onClick={() => setSelected(pass.id)}
                        className={`relative min-w-[200px] h-28 rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 ${selected === pass.id ? 'ring-2 ring-plasma ring-offset-2 ring-offset-graphite' : 'opacity-60 hover:opacity-100'
                            }`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-void to-transparent z-10 opacity-80" />
                        <img
                            src={pass.thumbnail_url || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80'}
                            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${selected === pass.id ? 'scale-105' : 'group-hover:scale-105'}`}
                        />
                        <div className="absolute bottom-2 left-3 z-20">
                            <div className="text-[10px] font-mono text-plasma font-bold mb-0.5">
                                {pass.is_baseline ? 'PRE-EVENT BASELINE' : 'POST-EVENT PASS'}
                            </div>
                            <div className="text-xs font-sora font-semibold text-white">
                                {new Date(pass.pass_date).toISOString().split('T')[0]}
                            </div>
                        </div>
                        {selected === pass.id && (
                            <div className="absolute top-2 right-2 z-20 w-2 h-2 rounded-full bg-alert-green animate-pulse" />
                        )}
                    </div>
                ))}

                {/* Fetching Skeleton */}
                {!loading && passes.length === 0 && (
                    <div className="min-w-[200px] h-28 rounded-2xl border border-dashed border-gray-700 flex flex-col items-center justify-center text-gray-500 gap-2 p-4 text-center">
                        <span className="text-[10px] font-mono">NO SATELLITE IMAGERY AVAILABLE YET</span>
                    </div>
                )}

                {loading && (
                    <div className="min-w-[200px] h-28 rounded-2xl border border-dashed border-plasma/30 flex flex-col items-center justify-center text-plasma gap-2">
                        <div className="w-4 h-4 border-2 border-plasma border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-mono">FETCHING PASSES</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Timeline;
