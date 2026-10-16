import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ── "Sticky Stacking Archive" — Preset D: Vapor Clinic ──
   3 full-screen cards that stack on scroll.
   Each with a unique SVG/canvas animation:
     1 · Rotating orbital motif
     2 · Scanning laser-line grid
     3 · Pulsing EKG waveform
   ─────────────────────────────────────────────────────────── */

/* ─── SVG 1: Rotating Orbital Rings ───────────────────── */
const OrbitalMotif = () => (
    <svg viewBox="0 0 200 200" className="w-48 h-48 md:w-64 md:h-64 opacity-40">
        {/* Outer ring */}
        <circle cx="100" cy="100" r="90" fill="none" stroke="#7B61FF" strokeWidth="0.4" opacity="0.3">
            <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="40s" repeatCount="indefinite" />
        </circle>
        {/* Middle ring */}
        <circle cx="100" cy="100" r="62" fill="none" stroke="#7B61FF" strokeWidth="0.5" opacity="0.4">
            <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="-360 100 100" dur="25s" repeatCount="indefinite" />
        </circle>
        {/* Inner ring */}
        <circle cx="100" cy="100" r="35" fill="none" stroke="#7B61FF" strokeWidth="0.6" opacity="0.5">
            <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="15s" repeatCount="indefinite" />
        </circle>
        {/* Dot on outer */}
        <circle cx="190" cy="100" r="3" fill="#7B61FF">
            <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="40s" repeatCount="indefinite" />
        </circle>
        {/* Dot on middle */}
        <circle cx="162" cy="100" r="2.5" fill="#7B61FF" opacity="0.8">
            <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="-360 100 100" dur="25s" repeatCount="indefinite" />
        </circle>
        {/* Dot on inner */}
        <circle cx="135" cy="100" r="2" fill="#7B61FF" opacity="0.6">
            <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="15s" repeatCount="indefinite" />
        </circle>
        {/* Center */}
        <circle cx="100" cy="100" r="4" fill="#7B61FF" opacity="0.9" />
    </svg>
);

/* ─── SVG 2: Scanning Laser Grid ──────────────────────── */
const ScanningGrid = () => (
    <svg viewBox="0 0 240 120" className="w-60 h-28 md:w-80 md:h-36 opacity-40">
        {/* Dot grid */}
        {Array.from({ length: 8 }).map((_, row) =>
            Array.from({ length: 16 }).map((_, col) => (
                <circle
                    key={`${row}-${col}`}
                    cx={col * 15 + 7}
                    cy={row * 15 + 7}
                    r="1.2"
                    fill="#7B61FF"
                    opacity="0.25"
                />
            ))
        )}
        {/* Horizontal scanning line */}
        <line x1="0" y1="0" x2="240" y2="0" stroke="#7B61FF" strokeWidth="1.5" opacity="0.7">
            <animateTransform attributeName="transform" type="translate" values="0,0;0,120;0,0" dur="3.5s" repeatCount="indefinite" />
        </line>
        {/* Glow behind line */}
        <rect x="0" y="-4" width="240" height="8" fill="#7B61FF" opacity="0.15" rx="4">
            <animateTransform attributeName="transform" type="translate" values="0,0;0,120;0,0" dur="3.5s" repeatCount="indefinite" />
        </rect>
    </svg>
);

/* ─── SVG 3: Pulsing EKG Waveform ─────────────────────── */
const EKGWaveform = () => (
    <svg viewBox="0 0 280 60" className="w-64 h-14 md:w-80 md:h-16 opacity-40">
        <path
            d="M0,30 L40,30 L50,30 L55,8 L60,52 L65,15 L70,42 L75,30 L120,30 L130,30 L135,10 L140,50 L145,18 L150,40 L155,30 L200,30 L210,30 L215,12 L220,48 L225,20 L230,38 L235,30 L280,30"
            fill="none"
            stroke="#7B61FF"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="400"
            strokeDashoffset="400"
        >
            <animate attributeName="stroke-dashoffset" values="400;0" dur="2.5s" repeatCount="indefinite" />
        </path>
        {/* Baseline */}
        <line x1="0" y1="30" x2="280" y2="30" stroke="#7B61FF" strokeWidth="0.3" opacity="0.2" />
    </svg>
);

/* ─── Protocol Steps ──────────────────────────────────── */
const steps = [
    {
        step: '01',
        phase: 'ACQUIRE',
        title: 'Satellite Tasking',
        description: 'Emergency tasking of commercial and government satellite constellations. Multi-spectrum imagery acquired within the first orbital pass over the disaster zone.',
        Animation: OrbitalMotif,
    },
    {
        step: '02',
        phase: 'PROCESS',
        title: 'AI Analysis',
        description: 'Computer vision models scan imagery for damage signatures — collapsed structures, flood boundaries, thermal anomalies — classified by severity in real-time.',
        Animation: ScanningGrid,
    },
    {
        step: '03',
        phase: 'DISTRIBUTE',
        title: 'Intelligence Delivery',
        description: 'Actionable intelligence is pushed to responders via live dashboard, mobile alerts, and API. Continuous updates as new passes and ground reports arrive.',
        Animation: EKGWaveform,
    },
];

/* ─── Protocol Section ─────────────────────────────────── */
const ProtocolSection = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const cards = gsap.utils.toArray('.protocol-card');

            cards.forEach((card, i) => {
                if (i < cards.length - 1) {
                    // Pin each card except the last
                    ScrollTrigger.create({
                        trigger: card,
                        start: 'top top',
                        endTrigger: cards[cards.length - 1],
                        end: 'top top',
                        pin: true,
                        pinSpacing: false,
                    });

                    // Scale/blur/fade previous card as next comes in
                    gsap.to(card, {
                        scale: 0.9,
                        filter: 'blur(20px)',
                        opacity: 0.5,
                        scrollTrigger: {
                            trigger: cards[i + 1],
                            start: 'top bottom',
                            end: 'top top',
                            scrub: true,
                        },
                    });
                }
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} id="protocol">
            {/* Section header */}
            <div className="bg-[#F0EFF4] relative z-10 py-20 md:py-28 px-6 md:px-12 lg:px-24">
                <div className="max-w-7xl mx-auto">
                    <span className="block font-mono text-xs text-[#7B61FF] uppercase tracking-widest mb-4">
                        Architecture
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-sora font-bold text-[#18181B] tracking-tight">
                        The{' '}
                        <span className="font-drama italic font-normal text-[#7B61FF]">Protocol</span>
                    </h2>
                    <p className="text-[#18181B]/50 text-lg mt-4 max-w-2xl">
                        From satellite to responder in under 15 minutes. Zero human bottlenecks in the critical path.
                    </p>
                </div>
            </div>

            {/* Stacking cards */}
            {steps.map(({ step, phase, title, description, Animation }, i) => (
                <section
                    key={i}
                    className="protocol-card relative w-full min-h-screen flex items-center justify-center px-6 md:px-12 lg:px-24"
                    style={{
                        backgroundColor: '#0A0A14',
                        backgroundImage: `radial-gradient(circle at ${30 + i * 20}% ${40 + i * 10}%, rgba(123,97,255,0.06) 0%, transparent 60%)`,
                    }}
                >
                    {/* Border ring */}
                    <div className="absolute inset-4 md:inset-8 rounded-[3rem] border border-[#7B61FF]/8 pointer-events-none" />

                    <div className="relative z-10 max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
                        {/* Text side */}
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <span className="font-mono text-sm text-[#7B61FF]/60">{step}</span>
                                <span className="h-px flex-1 bg-[#7B61FF]/10" />
                                <span className="font-mono text-xs text-[#7B61FF] uppercase tracking-widest">{phase}</span>
                            </div>
                            <h3 className="font-sora font-bold text-[#F0EFF4] text-3xl md:text-4xl tracking-tight mb-6">
                                {title}
                            </h3>
                            <p className="text-[#F0EFF4]/40 text-base leading-relaxed max-w-md">
                                {description}
                            </p>
                        </div>

                        {/* Animation side */}
                        <div className="flex items-center justify-center">
                            <Animation />
                        </div>
                    </div>
                </section>
            ))}
        </div>
    );
};

export default ProtocolSection;
