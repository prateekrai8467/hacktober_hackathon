import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ArrowRight } from 'lucide-react';

/* ── "The Opening Shot" — Preset D: Vapor Clinic ────────
   100dvh · full-bleed Unsplash · bottom-left content
   Hero pattern: "[Tech noun] beyond" / "[Boundary word]."
   ─────────────────────────────────────────────────────── */

const HeroSection = () => {
    const containerRef = useRef(null);
    const line1Ref = useRef(null);
    const line2Ref = useRef(null);
    const tagRef = useRef(null);
    const ctaRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                defaults: { ease: 'power3.out' },
                delay: 0.3,
            });

            tl.fromTo(line1Ref.current,
                { opacity: 0, y: 40 },
                { opacity: 1, y: 0, duration: 1 }
            )
            .fromTo(line2Ref.current,
                { opacity: 0, y: 40 },
                { opacity: 1, y: 0, duration: 1 },
                '-=0.7'
            )
            .fromTo(tagRef.current,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.8 },
                '-=0.5'
            )
            .fromTo(ctaRef.current,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.8 },
                '-=0.4'
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={containerRef}
            className="relative w-full h-[100dvh] flex items-end overflow-hidden"
        >
            {/* Full-bleed background image */}
            <div className="absolute inset-0">
                <img
                    src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80"
                    alt="Earth from orbit"
                    className="w-full h-full object-cover object-center"
                />
                {/* Heavy gradient overlay — primary-to-black */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A14] via-[#0A0A14]/80 to-[#0A0A14]/30" />
            </div>

            {/* Content — pushed to bottom-left */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-24 pb-20 md:pb-28">
                {/* Badge */}
                <div className="mb-8">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7B61FF]/10 border border-[#7B61FF]/20 text-[#7B61FF] font-mono text-xs uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-[#7B61FF] animate-pulse" />
                        Disaster Response Intelligence
                    </span>
                </div>

                {/* Headline — scale contrast */}
                <h1 className="mb-6">
                    <span
                        ref={line1Ref}
                        className="block font-sora font-bold text-[#F0EFF4] text-3xl md:text-5xl lg:text-6xl tracking-tight leading-none opacity-0"
                    >
                        Intelligence beyond
                    </span>
                    <span
                        ref={line2Ref}
                        className="block font-drama italic text-[#7B61FF] text-7xl md:text-[10rem] lg:text-[13rem] leading-[0.85] -ml-1 md:-ml-2 opacity-0"
                    >
                        Limits.
                    </span>
                </h1>

                {/* Tagline */}
                <p
                    ref={tagRef}
                    className="text-[#F0EFF4]/50 text-base md:text-lg max-w-xl font-sora leading-relaxed mb-10 opacity-0"
                >
                    Real-time satellite imagery, AI-powered damage assessment, and unified
                    command — delivering actionable intelligence in minutes, not days.
                </p>

                {/* CTAs */}
                <div ref={ctaRef} className="flex flex-col sm:flex-row items-start gap-4 opacity-0">
                    <Link
                        to="/dashboard/civilian"
                        className="btn-magnetic group inline-flex items-center gap-3 bg-[#7B61FF] hover:bg-[#6A50EE] text-white px-8 py-4 rounded-full font-sora font-semibold text-sm uppercase tracking-wide transition-colors"
                    >
                        <span className="relative z-10">Civilian Access</span>
                        <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <Link
                        to="/responder-login"
                        className="btn-magnetic inline-flex items-center gap-3 border border-[#F0EFF4]/15 hover:border-[#7B61FF] text-[#F0EFF4]/70 hover:text-[#7B61FF] px-8 py-4 rounded-full font-sora font-semibold text-sm uppercase tracking-wide transition-all"
                    >
                        <span className="relative z-10">Responder Login</span>
                    </Link>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#F0EFF4]/30">
                    Scroll
                </span>
                <div className="w-px h-10 bg-gradient-to-b from-[#F0EFF4]/30 to-transparent" />
            </div>
        </section>
    );
};

export default HeroSection;
