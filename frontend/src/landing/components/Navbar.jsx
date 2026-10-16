import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

/* ── Preset D: Vapor Clinic ──────────────────────────────
   Void #0A0A14 | Plasma #7B61FF | Ghost #F0EFF4 | Graphite #18181B
   ─────────────────────────────────────────────────────── */

const Navbar = () => {
    const navRef = useRef(null);
    const scrolledRef = useRef(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.set(navRef.current, {
                backgroundColor: 'rgba(10, 10, 20, 0)',
                backdropFilter: 'blur(0px)',
                borderColor: 'rgba(123, 97, 255, 0)',
            });
        });

        const handleScroll = () => {
            const isScrolled = window.scrollY > 80;
            if (isScrolled !== scrolledRef.current) {
                scrolledRef.current = isScrolled;
                setScrolled(isScrolled);
                gsap.to(navRef.current, {
                    backgroundColor: isScrolled
                        ? 'rgba(240, 239, 244, 0.6)'
                        : 'rgba(10, 10, 20, 0)',
                    backdropFilter: isScrolled ? 'blur(24px)' : 'blur(0px)',
                    borderColor: isScrolled
                        ? 'rgba(24, 24, 27, 0.08)'
                        : 'rgba(123, 97, 255, 0)',
                    duration: 0.4,
                    ease: 'power2.out',
                });
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            ctx.revert();
        };
    }, []);

    return (
        <nav
            ref={navRef}
            className="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] max-w-5xl h-16 rounded-full border border-transparent z-50 flex items-center px-8"
        >
            {/* Logo */}
            <Link
                to="/"
                className={`font-sora font-bold text-xl tracking-tight transition-colors duration-300 ${scrolled ? 'text-[#18181B]' : 'text-[#F0EFF4]'
                    }`}
            >
                TeraScope
            </Link>

            {/* Nav Links */}
            <div
                className={`hidden md:flex items-center gap-8 ml-auto mr-8 font-mono text-sm transition-colors duration-300 ${scrolled ? 'text-[#18181B]/60' : 'text-[#F0EFF4]/60'
                    }`}
            >
                <a href="#features" className="hover:-translate-y-px transition-transform duration-300 hover:opacity-100">
                    Capabilities
                </a>
                <a href="#philosophy" className="hover:-translate-y-px transition-transform duration-300 hover:opacity-100">
                    Philosophy
                </a>
                <a href="#protocol" className="hover:-translate-y-px transition-transform duration-300 hover:opacity-100">
                    Architecture
                </a>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-3 ml-auto md:ml-0">
                <Link
                    to="/responder-login"
                    className={`hidden sm:inline-flex h-10 px-5 items-center text-sm font-mono rounded-full border transition-all duration-300 hover:scale-[1.03] hover:-translate-y-px ${scrolled
                            ? 'border-[#18181B]/15 text-[#18181B]/70 hover:border-[#7B61FF] hover:text-[#7B61FF]'
                            : 'border-[#F0EFF4]/15 text-[#F0EFF4]/70 hover:border-[#7B61FF] hover:text-[#7B61FF]'
                        }`}
                >
                    Responder
                </Link>

                <Link
                    to="/dashboard/civilian"
                    className="btn-magnetic h-10 px-6 text-sm rounded-full font-sora font-semibold bg-[#7B61FF] text-white inline-flex items-center justify-center"
                >
                    <span className="relative z-10">Civilian Access</span>
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
