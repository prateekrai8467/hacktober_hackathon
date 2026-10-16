import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ── "The Manifesto" — Preset D: Vapor Clinic ──────────
   Dark section · parallax texture · contrasting statements
   Word-by-word reveal via ScrollTrigger
   ─────────────────────────────────────────────────────── */

const PhilosophySection = () => {
    const sectionRef = useRef(null);
    const neutralRef = useRef(null);
    const boldRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Parallax on the background texture
            gsap.to('.philosophy-texture', {
                yPercent: -20,
                ease: 'none',
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            });

            // Neutral statement — fade-up
            gsap.fromTo(neutralRef.current,
                { opacity: 0, y: 40 },
                {
                    opacity: 1, y: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: neutralRef.current,
                        start: 'top 80%',
                        toggleActions: 'play none none none',
                    },
                }
            );

            // Bold statement — word-by-word reveal
            const words = boldRef.current.querySelectorAll('.word');
            gsap.fromTo(words,
                { opacity: 0, y: 20 },
                {
                    opacity: 1, y: 0,
                    duration: 0.6,
                    ease: 'power3.out',
                    stagger: 0.08,
                    scrollTrigger: {
                        trigger: boldRef.current,
                        start: 'top 75%',
                        toggleActions: 'play none none none',
                    },
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    // Split text into animatable words
    const renderWords = (text, className = '') =>
        text.split(' ').map((word, i) => (
            <span key={i} className={`word inline-block mr-[0.3em] ${className}`}>
                {word}
            </span>
        ));

    return (
        <section
            ref={sectionRef}
            id="philosophy"
            className="relative w-full py-32 md:py-44 px-6 md:px-12 lg:px-24 bg-[#0A0A14] overflow-hidden"
        >
            {/* Parallax texture image */}
            <div className="philosophy-texture absolute inset-0 opacity-[0.06]">
                <img
                    src="https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&w=1920&q=80"
                    alt=""
                    className="w-full h-[130%] object-cover"
                    aria-hidden="true"
                />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Neutral statement */}
                <p
                    ref={neutralRef}
                    className="font-sora text-[#F0EFF4]/40 text-lg md:text-2xl leading-relaxed mb-12 md:mb-16"
                >
                    Most disaster response relies on:{' '}
                    <span className="text-[#F0EFF4]/60">
                        manual ground surveys, delayed damage reports, and fragmented agency communication.
                    </span>
                </p>

                {/* Bold manifesto statement */}
                <div ref={boldRef}>
                    <p className="text-3xl md:text-5xl lg:text-6xl leading-[1.15] tracking-tight">
                        {renderWords('We rely on:', 'font-sora font-bold text-[#F0EFF4]')}
                        <br />
                        {renderWords('orbital', 'font-drama italic text-[#7B61FF]')}
                        {renderWords('intelligence.', 'font-sora font-bold text-[#F0EFF4]')}
                    </p>
                </div>

                {/* Stat strip */}
                <div className="mt-20 md:mt-28 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-[#7B61FF]/10 pt-12">
                    {[
                        { value: '<15 min', label: 'First Assessment' },
                        { value: '0.5 m', label: 'Resolution' },
                        { value: '24/7', label: 'Monitoring' },
                        { value: '99.4%', label: 'Detection Rate' },
                    ].map(({ value, label }, i) => (
                        <div key={i}>
                            <div className="font-sora font-bold text-[#7B61FF] text-2xl md:text-3xl mb-1">{value}</div>
                            <div className="font-mono text-[10px] text-[#F0EFF4]/30 uppercase tracking-widest">{label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PhilosophySection;
