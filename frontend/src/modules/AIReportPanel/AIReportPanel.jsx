import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { FileText, RefreshCw, Eye, Download } from 'lucide-react';
import gsap from 'gsap';

const AIReportPanel = () => {
    const { activeEventId } = useStore();
    const [loading, setLoading] = useState(true);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!activeEventId) return;
        setLoading(true);

        // Simulate AI generation delay
        setTimeout(() => {
            setLoading(false);

            // Animate text reveal once loaded
            if (containerRef.current) {
                gsap.fromTo('.report-text',
                    { opacity: 0, y: 10 },
                    { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: 'power2.out' }
                );
            }
        }, 2500);
    }, [activeEventId]);

    if (!activeEventId) {
        return (
            <div className="bg-graphite border border-gray-800 p-5 rounded-3xl h-64 flex flex-col items-center justify-center text-center">
                <FileText className="w-8 h-8 text-gray-600 mb-3" />
                <h3 className="font-sora text-sm text-gray-400">AWAITING TARGET</h3>
                <p className="text-xs font-mono text-gray-600 mt-2">Select an event to generate<br />LLM situation report</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="bg-graphite border border-gray-800 p-5 rounded-3xl flex flex-col shrink-0 relative overflow-hidden">
            {/* Glossy highlight */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none rounded-t-3xl" />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <h2 className="font-sora font-semibold text-sm flex items-center gap-2 text-ghost">
                    <CpuIcon />
                    Tactical Briefing
                </h2>
                <div className="flex gap-2">
                    {!loading && (
                        <button className="p-1.5 rounded-lg bg-void border border-gray-700 text-gray-400 hover:text-plasma hover:border-plasma transition-colors">
                            <Download className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button className={`p-1.5 rounded-lg bg-void border border-gray-700 text-gray-400 hover:text-plasma transition-colors ${loading ? 'animate-spin' : ''}`}>
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col gap-3 flex-1 relative z-10">
                    <div className="h-3 w-full bg-void rounded animate-pulse" />
                    <div className="h-3 w-11/12 bg-void rounded animate-pulse" />
                    <div className="h-3 w-4/5 bg-void rounded animate-pulse mb-2" />
                    <div className="h-3 w-full bg-void rounded animate-pulse" />
                    <div className="h-3 w-10/12 bg-void rounded animate-pulse" />

                    <div className="mt-auto text-[10px] font-mono text-plasma flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-plasma animate-ping" />
                        SYNTHESIZING SATELLITE TELEMETRY...
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4 text-sm text-gray-300 relative z-10 overflow-y-auto custom-scrollbar flex-1 pb-2">
                    <div className="report-text bg-void/50 p-3 rounded-xl border border-gray-800/50">
                        <h3 className="text-xs font-mono text-plasma mb-1 uppercase tracking-wider">Executive Summary</h3>
                        <p className="leading-relaxed text-xs">Satellite assessment indicates significant structural damage across the primary residential corridor. Approximately 142 km² affected with 28% classified as critical severity.</p>
                    </div>

                    <div className="report-text">
                        <h3 className="text-[10px] font-mono text-alert-red mb-1 uppercase tracking-wider flex items-center gap-1">
                            <AlertTriangleIcon /> Priority Action Required
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-xs text-gray-400 ml-1">
                            <li>Deploy heavy urban rescue to Sector Alpha</li>
                            <li>Airdrop medical supplies to cutoff zones</li>
                            <li>Restore bridging at coordinates [38.5, -121.5]</li>
                        </ul>
                    </div>

                    <div className="report-text mt-2 pt-3 border-t border-gray-800/50">
                        <h3 className="text-[10px] font-mono text-plasma mb-2 uppercase tracking-wider flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Visual Intelligence (Gemini)
                        </h3>
                        <p className="text-xs italic text-gray-500 border-l-2 border-plasma/30 pl-2">
                            "Imagery shows complete roof collapse in southeastern quadrant. Main arterial road blocked by debris. Temporary shelters coalescing in northern park."
                        </p>
                    </div>

                    <div className="mt-2 text-[9px] font-mono text-gray-600 flex justify-between uppercase tracking-widest pt-2">
                        <span>LLM: Llama-3.1-70b</span>
                        <span>Vision: Gemini 1.5</span>
                    </div>
                </div>
            )}
        </div>
    );
};

const CpuIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-plasma"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
);
const AlertTriangleIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);

export default AIReportPanel;
