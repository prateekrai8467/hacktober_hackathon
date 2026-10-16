import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Globe, Activity, Satellite, ShieldAlert } from 'lucide-react';

const HubCard = ({ title, description, icon: Icon, path, delay }) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(path)}
            className="hub-card cursor-pointer group relative overflow-hidden bg-graphite border border-gray-800 rounded-3xl p-8 hover:border-plasma transition-all duration-500 hover:shadow-[0_0_30px_rgba(0,229,255,0.15)] flex flex-col items-start gap-4"
        >
            <div className="p-4 rounded-2xl bg-void border border-gray-800 group-hover:border-plasma/50 transition-colors">
                <Icon className="w-8 h-8 text-gray-400 group-hover:text-plasma transition-colors" />
            </div>

            <div className="mt-4">
                <h3 className="text-xl font-sora font-semibold text-ghost mb-2 group-hover:translate-x-1 transition-transform">{title}</h3>
                <p className="text-sm font-mono text-gray-400 leading-relaxed">{description}</p>
            </div>

            <div className="absolute opacity-0 group-hover:opacity-100 right-8 bottom-8 transition-opacity duration-300">
                <div className="w-10 h-10 rounded-full bg-plasma/10 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-plasma)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="translate-x-0 group-hover:translate-x-1 transition-transform">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </div>
            </div>

            {/* Magnetic background sliding layer */}
            <span className="absolute inset-0 bg-gradient-to-br from-plasma/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
    );
};

const Hub = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.hub-hero-text', {
                y: 30,
                opacity: 0,
                stagger: 0.1,
                duration: 1,
                ease: 'power3.out'
            });

            gsap.from('.hub-card', {
                y: 40,
                opacity: 0,
                stagger: 0.15,
                duration: 0.8,
                ease: 'power3.out',
                delay: 0.3
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="min-h-screen pt-32 pb-12 px-4 md:px-8 max-w-[1400px] mx-auto flex flex-col">

            <div className="mb-16 md:mb-24 flex flex-col items-center text-center">
                <div className="hub-hero-text inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-plasma/30 bg-plasma/5 text-plasma text-xs font-mono uppercase tracking-widest mb-6">
                    <div className="w-2 h-2 rounded-full bg-plasma animate-pulse" />
                    System Active
                </div>

                <h1 className="hub-hero-text text-5xl md:text-7xl font-sora font-semibold tracking-tight text-ghost mb-6">
                    Global Damage <br />
                    <span className="font-drama italic text-plasma font-normal text-6xl md:text-8xl">Intelligence</span>
                </h1>

                <p className="hub-hero-text text-gray-400 font-mono text-sm md:text-base max-w-2xl leading-relaxed">
                    Select a module to access real-time scraped disaster feeds,
                    deep satellite imagery timeline comparisons, or localized AI infrastructure risk reports.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full flex-1">
                <HubCard
                    title="Live Monitor"
                    description="Real-time global feeds for earthquakes, wildfires, and floods via GDACS & USGS with interactive cartography."
                    icon={Globe}
                    path="/monitor"
                />
                <HubCard
                    title="Damage Intelligence"
                    description="AI-driven structural damage assessments, critical infrastructure risk, and recovery trajectory analytics."
                    icon={Activity}
                    path="/intelligence"
                />
                <HubCard
                    title="Satellite Operations"
                    description="Analyze Sentinel-2 orbital passes and compare before/after high-resolution imagery."
                    icon={Satellite}
                    path="/satellite"
                />
                <HubCard
                    title="Assess My Area"
                    description="Upload on-the-ground reports and connect with the nearest response organizations."
                    icon={ShieldAlert}
                    path="/assess"
                />
            </div>

        </div>
    );
};

export default Hub;
