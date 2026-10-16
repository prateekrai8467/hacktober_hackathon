import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ── "Interactive Functional Artifacts" — Preset D ──────
   Three micro-UI cards — NOT static marketing cards.
   1 · Diagnostic Shuffler  (cycling stack)
   2 · Telemetry Typewriter  (live-feed char typing)
   3 · Cursor Protocol Scheduler  (animated SVG cursor)
   ─────────────────────────────────────────────────────── */

/* ─── Card 1 — Diagnostic Shuffler ─────────────────── */
const DiagnosticShuffler = () => {
    const labels = ['Optical Imaging', 'SAR Analysis', 'Change Detection'];
    const colors = ['#7B61FF', '#9B85FF', '#5B41DF'];
    const [order, setOrder] = useState([0, 1, 2]);

    useEffect(() => {
        const interval = setInterval(() => {
            setOrder(prev => {
                const next = [...prev];
                next.unshift(next.pop());
                return next;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const getStyle = (position) => {
        const styles = [
            { y: 0, scale: 1, opacity: 1, zIndex: 3 },
            { y: 24, scale: 0.95, opacity: 0.7, zIndex: 2 },
            { y: 48, scale: 0.9, opacity: 0.4, zIndex: 1 },
        ];
        return styles[position];
    };

    return (
        <div className="relative h-44 w-full">
            {order.map((cardIdx, position) => {
                const s = getStyle(position);
                return (
                    <div
                        key={cardIdx}
                        className="absolute left-0 right-0 mx-auto w-[90%] h-24 rounded-2xl border border-[#7B61FF]/20 bg-[#0A0A14] px-5 flex items-center gap-4"
                        style={{
                            transform: `translateY(${s.y}px) scale(${s.scale})`,
                            opacity: s.opacity,
                            zIndex: s.zIndex,
                            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                    >
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: colors[cardIdx] + '20' }}
                        >
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[cardIdx] }} />
                        </div>
                        <div>
                            <div className="font-mono text-xs text-[#F0EFF4]/40 uppercase tracking-widest">
                                Module {cardIdx + 1}
                            </div>
                            <div className="font-sora font-semibold text-sm text-[#F0EFF4]">
                                {labels[cardIdx]}
                            </div>
                        </div>
                        <div className="ml-auto font-mono text-xs text-[#7B61FF]">ACTIVE</div>
                    </div>
                );
            })}
        </div>
    );
};

/* ─── Card 2 — Telemetry Typewriter ────────────────── */
const TelemetryTypewriter = () => {
    const messages = [
        '▸ ALERT: Structural collapse detected — 28.6139°N, 77.2090°E',
        '▸ SEVERITY: Critical — 12 structures compromised in sector 7',
        '▸ ANALYSIS: Flood extent increased 340% in 6h window',
        '▸ DISPATCH: SAR element deployed → grid NK-4422',
        '▸ UPDATE: Thermal anomaly resolved — fire contained',
    ];

    const [lines, setLines] = useState([]);
    const [currentMsg, setCurrentMsg] = useState(0);
    const [charIdx, setCharIdx] = useState(0);
    const [currentLine, setCurrentLine] = useState('');

    useEffect(() => {
        const timer = setInterval(() => {
            setCharIdx(prev => {
                const msg = messages[currentMsg];
                if (prev < msg.length) {
                    setCurrentLine(msg.slice(0, prev + 1));
                    return prev + 1;
                } else {
                    // Line finished — push to log and start next
                    setLines(old => [...old.slice(-3), msg]);
                    setCurrentLine('');
                    setCurrentMsg(m => (m + 1) % messages.length);
                    return 0;
                }
            });
        }, 35);

        return () => clearInterval(timer);
    }, [currentMsg]);

    return (
        <div className="bg-[#0A0A14] rounded-2xl border border-[#7B61FF]/10 p-4 h-44 flex flex-col justify-end overflow-hidden font-mono text-xs leading-relaxed">
            {/* Status bar */}
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#7B61FF]/10">
                <span className="w-2 h-2 rounded-full bg-[#7B61FF] animate-pulse" />
                <span className="text-[#7B61FF] text-[10px] uppercase tracking-widest">Live Feed</span>
            </div>

            {/* Past lines */}
            <div className="flex-1 flex flex-col justify-end gap-1">
                {lines.map((line, i) => (
                    <div key={i} className="text-[#F0EFF4]/30 truncate">{line}</div>
                ))}
                {/* Current typing line */}
                <div className="text-[#F0EFF4]/80">
                    {currentLine}
                    <span className="inline-block w-2 h-4 bg-[#7B61FF] ml-0.5 animate-pulse align-middle" />
                </div>
            </div>
        </div>
    );
};

/* ─── Card 3 — Cursor Protocol Scheduler ───────────── */
const CursorScheduler = () => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const [activeDay, setActiveDay] = useState(-1);
    const [cursorPos, setCursorPos] = useState({ x: -20, y: -20, visible: false });
    const [saved, setSaved] = useState(false);
    const gridRef = useRef(null);

    const runSequence = useCallback(() => {
        const targetDay = Math.floor(Math.random() * 7);
        const timeline = [
            // Cursor enters
            { delay: 0, action: () => setCursorPos({ x: 10, y: 60, visible: true }) },
            // Cursor moves to day
            { delay: 500, action: () => setCursorPos({ x: 24 + targetDay * 36, y: 38, visible: true }) },
            // Click — activate day
            { delay: 900, action: () => setActiveDay(targetDay) },
            // Cursor moves to Save
            { delay: 1400, action: () => setCursorPos({ x: 110, y: 80, visible: true }) },
            // Save click
            { delay: 1800, action: () => setSaved(true) },
            // Cursor exits
            { delay: 2400, action: () => setCursorPos({ x: 260, y: 80, visible: false }) },
            // Reset
            { delay: 3400, action: () => { setActiveDay(-1); setSaved(false); } },
        ];

        const timers = timeline.map(({ delay, action }) => setTimeout(action, delay));
        return () => timers.forEach(clearTimeout);
    }, []);

    useEffect(() => {
        let cleanup = runSequence();
        const interval = setInterval(() => {
            cleanup();
            cleanup = runSequence();
        }, 4000);
        return () => { cleanup(); clearInterval(interval); };
    }, [runSequence]);

    return (
        <div ref={gridRef} className="bg-[#0A0A14] rounded-2xl border border-[#7B61FF]/10 p-5 h-44 relative overflow-hidden">
            {/* Label */}
            <div className="font-mono text-[10px] text-[#F0EFF4]/40 uppercase tracking-widest mb-4">
                Deployment Schedule
            </div>

            {/* Weekly grid */}
            <div className="flex gap-2 justify-center mb-5">
                {days.map((day, i) => (
                    <div
                        key={i}
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs transition-all duration-200"
                        style={{
                            backgroundColor: activeDay === i ? '#7B61FF' : 'rgba(123,97,255,0.08)',
                            color: activeDay === i ? '#fff' : 'rgba(240,239,244,0.4)',
                            transform: activeDay === i ? 'scale(0.92)' : 'scale(1)',
                        }}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Save button */}
            <div className="flex justify-center">
                <div
                    className="px-6 py-1.5 rounded-full font-mono text-xs transition-all duration-200"
                    style={{
                        backgroundColor: saved ? '#7B61FF' : 'rgba(123,97,255,0.1)',
                        color: saved ? '#fff' : 'rgba(240,239,244,0.4)',
                        transform: saved ? 'scale(0.95)' : 'scale(1)',
                    }}
                >
                    {saved ? '✓ Saved' : 'Save'}
                </div>
            </div>

            {/* Animated cursor */}
            {cursorPos.visible && (
                <svg
                    className="absolute pointer-events-none z-20 transition-all duration-500 ease-out"
                    style={{ left: cursorPos.x, top: cursorPos.y }}
                    width="18"
                    height="22"
                    viewBox="0 0 18 22"
                    fill="none"
                >
                    <path
                        d="M1 1l6.5 18L10 12l7-2.5L1 1z"
                        fill="#7B61FF"
                        stroke="#0A0A14"
                        strokeWidth="1.5"
                    />
                </svg>
            )}
        </div>
    );
};

/* ─── Features Section Wrapper ─────────────────────── */
const FeaturesSection = () => {
    const sectionRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.utils.toArray('.feature-card').forEach((card, i) => {
                gsap.fromTo(card,
                    { opacity: 0, y: 50 },
                    {
                        opacity: 1, y: 0,
                        duration: 0.8,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: card,
                            start: 'top 85%',
                            toggleActions: 'play none none none',
                        },
                        delay: i * 0.15,
                    }
                );
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    const cards = [
        {
            label: 'Satellite Intelligence',
            descriptor: 'Multi-spectrum orbital capture with automated change detection across disaster-affected regions.',
            Component: DiagnosticShuffler,
        },
        {
            label: 'AI Damage Assessment',
            descriptor: 'Machine-learning models process imagery in real-time to classify severity and prioritize response.',
            Component: TelemetryTypewriter,
        },
        {
            label: 'Coordination Protocol',
            descriptor: 'Unified scheduling and deployment interface for multi-agency disaster response operations.',
            Component: CursorScheduler,
        },
    ];

    return (
        <section
            ref={sectionRef}
            id="features"
            className="relative w-full py-28 md:py-36 px-6 md:px-12 lg:px-24 bg-[#F0EFF4]"
        >
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-20">
                    <span className="block font-mono text-xs text-[#7B61FF] uppercase tracking-widest mb-4">
                        Capabilities
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-sora font-bold text-[#18181B] tracking-tight">
                        Intelligence{' '}
                        <span className="font-drama italic font-normal text-[#7B61FF]">Redefined</span>
                    </h2>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {cards.map(({ label, descriptor, Component }, i) => (
                        <div
                            key={i}
                            className="feature-card bg-[#F0EFF4] border border-[#18181B]/8 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:border-[#7B61FF]/25 transition-all duration-500 group"
                        >
                            {/* Card micro-UI */}
                            <Component />

                            {/* Card text */}
                            <h3 className="font-sora font-bold text-[#18181B] text-lg mt-6 mb-2 tracking-tight">
                                {label}
                            </h3>
                            <p className="text-[#18181B]/50 text-sm leading-relaxed">
                                {descriptor}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
