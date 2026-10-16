import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crosshair, ArrowRight } from 'lucide-react';
import gsap from 'gsap';

/* ── Responder Login — Vapor Clinic (Preset D) ──────────
   Void #0A0A14 | Plasma #7B61FF | Ghost #F0EFF4
   ─────────────────────────────────────────────────────── */

export const LoginOrganization = () => {
    const navigate = useNavigate();
    const cardRef = useRef(null);
    const headerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(headerRef.current,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
            );
            gsap.fromTo(cardRef.current,
                { opacity: 0, y: 40 },
                { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.15 }
            );
        });
        return () => ctx.revert();
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        navigate('/dashboard/organization');
    };

    return (
        <div className="min-h-screen bg-[#0A0A14] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Subtle radial glow */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse at 50% 30%, rgba(123,97,255,0.08) 0%, transparent 60%)',
            }} />

            {/* Back link */}
            <div className="absolute top-8 left-8 z-10">
                <Link to="/" className="text-[#F0EFF4]/40 font-mono text-sm hover:text-[#7B61FF] transition-colors">
                    ← BACK TO SURFACE
                </Link>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <div ref={headerRef} className="flex items-center justify-center mb-10 opacity-0">
                    <Crosshair className="w-10 h-10 text-[#7B61FF] mr-4" />
                    <h1 className="text-4xl font-sora font-bold text-[#F0EFF4] tracking-tight">
                        RESPONDER
                        <br />
                        <span className="font-drama font-normal italic text-[#7B61FF]">Access</span>
                    </h1>
                </div>

                {/* Card */}
                <div
                    ref={cardRef}
                    className="bg-[#12121E] border border-[#7B61FF]/10 p-8 rounded-[2rem] shadow-2xl opacity-0"
                >
                    {/* Status bar */}
                    <div className="flex justify-between items-center mb-8 pb-4 border-b border-[#7B61FF]/10">
                        <span className="font-mono text-xs text-[#F0EFF4]/40 uppercase tracking-widest">
                            Authentication
                        </span>
                        <span className="flex items-center gap-2 font-mono text-xs text-[#7B61FF] uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7B61FF] animate-pulse" />
                            Secure
                        </span>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Agency */}
                        <div>
                            <label className="block font-sora text-xs font-semibold text-[#F0EFF4]/60 mb-2 uppercase tracking-wider">
                                Agency Designation
                            </label>
                            <select className="w-full bg-[#0A0A14] border border-[#7B61FF]/15 rounded-xl px-4 py-3.5 text-[#F0EFF4] font-mono text-sm focus:outline-none focus:border-[#7B61FF] transition-colors appearance-none cursor-pointer">
                                <option value="ndrf">NDRF Battalion</option>
                                <option value="crpf">CRPF Territorial</option>
                                <option value="army">Territorial Army</option>
                                <option value="authority">State Authority</option>
                            </select>
                        </div>

                        {/* Commander ID */}
                        <div>
                            <label className="block font-sora text-xs font-semibold text-[#F0EFF4]/60 mb-2 uppercase tracking-wider">
                                Commander ID
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full bg-[#0A0A14] border border-[#7B61FF]/15 rounded-xl px-4 py-3.5 text-[#F0EFF4] font-mono text-sm focus:outline-none focus:border-[#7B61FF] transition-colors placeholder:text-[#F0EFF4]/20"
                                placeholder="OP-7734-X"
                            />
                        </div>

                        {/* Clearance Key */}
                        <div>
                            <label className="block font-sora text-xs font-semibold text-[#F0EFF4]/60 mb-2 uppercase tracking-wider">
                                Clearance Key
                            </label>
                            <input
                                type="password"
                                required
                                className="w-full bg-[#0A0A14] border border-[#7B61FF]/15 rounded-xl px-4 py-3.5 text-[#F0EFF4] font-mono text-sm focus:outline-none focus:border-[#7B61FF] transition-colors placeholder:text-[#F0EFF4]/20"
                                placeholder="••••••••••••"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="btn-magnetic w-full bg-[#7B61FF] hover:bg-[#6A50EE] text-white py-4 mt-2 rounded-full font-sora text-sm font-semibold uppercase tracking-widest group transition-colors"
                        >
                            <span className="relative z-10 flex items-center justify-center">
                                AUTHORIZE OVERRIDE
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>

                        {/* Switch to civilian */}
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard/civilian')}
                            className="w-full border border-[#F0EFF4]/10 hover:border-[#7B61FF] text-[#F0EFF4]/50 hover:text-[#7B61FF] py-4 mt-2 rounded-full font-sora text-sm font-semibold uppercase tracking-widest transition-all"
                        >
                            SWITCH TO CIVILIAN PORTAL
                        </button>
                    </form>

                    <div className="mt-8 text-center font-mono text-[10px] text-[#F0EFF4]/20 uppercase tracking-widest">
                        Restricted Military / Government Access Only
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginOrganization;
