import React from 'react';
import { Link } from 'react-router-dom';

/* ── Footer — Preset D: Vapor Clinic ────────────────────
   Deep dark · rounded-t-[4rem] · status indicator
   ─────────────────────────────────────────────────────── */

const FooterSection = () => {
    return (
        <footer className="relative w-full bg-[#0A0A14] text-[#F0EFF4] rounded-t-[3rem] md:rounded-t-[4rem] -mt-12 pt-20 pb-12 px-6 md:px-12 lg:px-24 z-20">
            <div className="max-w-7xl mx-auto">
                {/* CTA Band */}
                <div className="mb-20 pb-16 border-b border-[#7B61FF]/10 text-center">
                    <h3 className="font-sora font-bold text-3xl md:text-5xl tracking-tight mb-4">
                        Access the{' '}
                        <span className="font-drama italic font-normal text-[#7B61FF]">Command Center</span>
                    </h3>
                    <p className="text-[#F0EFF4]/40 text-base md:text-lg max-w-xl mx-auto mb-10">
                        Whether you&rsquo;re a civilian seeking safety intelligence or a responder
                        coordinating operations — your portal is ready.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/dashboard/civilian"
                            className="btn-magnetic inline-flex items-center gap-3 bg-[#7B61FF] hover:bg-[#6A50EE] text-white px-8 py-4 rounded-full font-sora font-semibold text-sm uppercase tracking-wide transition-colors"
                        >
                            <span className="relative z-10">Civilian Access</span>
                        </Link>
                        <Link
                            to="/responder-login"
                            className="btn-magnetic inline-flex items-center gap-3 border border-[#F0EFF4]/15 hover:border-[#7B61FF] text-[#F0EFF4]/60 hover:text-[#7B61FF] px-8 py-4 rounded-full font-sora font-semibold text-sm uppercase tracking-wide transition-all"
                        >
                            <span className="relative z-10">Responder Login</span>
                        </Link>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <h4 className="font-sora font-bold text-xl tracking-tight mb-3">TeraScope</h4>
                        <p className="text-[#F0EFF4]/30 text-sm max-w-sm leading-relaxed">
                            Advanced disaster intelligence platform combining satellite imagery,
                            AI analysis, and ground-truth coordination for rapid response.
                        </p>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h5 className="font-mono text-[10px] text-[#7B61FF] uppercase tracking-widest mb-5">
                            Navigation
                        </h5>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#features" className="text-[#F0EFF4]/40 hover:text-[#7B61FF] transition-colors">Capabilities</a></li>
                            <li><a href="#philosophy" className="text-[#F0EFF4]/40 hover:text-[#7B61FF] transition-colors">Philosophy</a></li>
                            <li><a href="#protocol" className="text-[#F0EFF4]/40 hover:text-[#7B61FF] transition-colors">Architecture</a></li>
                            <li><Link to="/dashboard/civilian" className="text-[#F0EFF4]/40 hover:text-[#7B61FF] transition-colors">Civilian Portal</Link></li>
                            <li><Link to="/responder-login" className="text-[#F0EFF4]/40 hover:text-[#7B61FF] transition-colors">Responder Access</Link></li>
                        </ul>
                    </div>

                    {/* System Status */}
                    <div>
                        <h5 className="font-mono text-[10px] text-[#7B61FF] uppercase tracking-widest mb-5">
                            System Status
                        </h5>
                        <div className="space-y-3">
                            {[
                                { label: 'Satellite Feed', status: 'Online' },
                                { label: 'AI Pipeline', status: 'Active' },
                                { label: 'API Gateway', status: 'Operational' },
                            ].map(({ label, status }, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="font-mono text-xs text-[#F0EFF4]/35">
                                        {label}: {status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-8 border-t border-[#7B61FF]/8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <span className="font-mono text-[10px] text-[#F0EFF4]/20 uppercase tracking-widest">
                        &copy; {new Date().getFullYear()} TeraScope Intelligence Platform
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="font-mono text-[10px] text-[#F0EFF4]/30 uppercase tracking-widest">
                            All Systems Operational
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default FooterSection;
