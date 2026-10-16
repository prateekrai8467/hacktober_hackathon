import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Activity, Download, Share2, Map, ShieldAlert } from 'lucide-react';
import StatCards from '../StatCards/StatCards'; // Reusing visual, normally would pass data

const PublicReport = () => {
    const { slug } = useParams();

    return (
        <div className="min-h-screen bg-void pt-8 pb-20 px-4 md:px-8 max-w-4xl mx-auto custom-scrollbar">
            <nav className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <Activity className="text-plasma w-6 h-6" />
                    <span className="font-sora font-bold text-xl tracking-tight text-ghost">TeraScope</span>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors btn-magnetic">
                        <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm btn-solid btn-magnetic">
                        <Printer className="w-4 h-4" /> PDF Brief
                    </button>
                </div>
            </nav>

            <div className="flex flex-col gap-8">
                <header className="text-center">
                    <div className="inline-block px-3 py-1 bg-alert-red/20 text-alert-red border border-alert-red/30 rounded font-mono text-xs font-bold tracking-widest uppercase mb-4 animate-pulse">
                        Red Alert Emergency
                    </div>
                    <h1 className="font-sora text-3xl md:text-5xl font-bold text-ghost mb-2">California Wildfire Complex</h1>
                    <p className="font-mono text-gray-400">Report Generated: 2026-02-26 14:30z | Slug: <b>{slug}</b></p>
                </header>

                <section className="grid md:grid-cols-2 gap-6">
                    <img
                        src="https://images.unsplash.com/photo-1549429598-a38f32ac1c9a?auto=format&fit=crop&w=800&q=80"
                        className="rounded-3xl border border-gray-800 w-full h-64 object-cover"
                        alt="satellite pre-event"
                    />
                    <img
                        src="https://images.unsplash.com/photo-1590483864700-1cffa7bfcaaa?auto=format&fit=crop&w=800&q=80"
                        className="rounded-3xl border border-gray-800 w-full h-64 object-cover"
                        alt="satellite post-event damage"
                    />
                </section>

                <section className="bg-graphite border border-gray-800 rounded-3xl p-6 md:p-8">
                    <h2 className="font-sora text-xl font-bold text-plasma flex items-center gap-2 mb-4">
                        <Map className="w-5 h-5" />
                        Executive Summary (AI Generated)
                    </h2>
                    <p className="text-gray-300 leading-relaxed font-sora">
                        Satellite assessment indicates significant structural damage across the primary residential corridor.
                        Approximately 142 km² affected with 28% classified as critical severity. Immediate deployment of
                        search and rescue teams is recommended for Priority Zone Alpha. Ground truth reports largely agree
                        with satellite telemetry, confirming catastrophic roof collapses.
                    </p>
                </section>

                <section className="bg-void/50 border border-alert-orange/50 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-alert-orange/10 blur-3xl -mr-10 -mt-10"></div>
                    <h2 className="font-sora text-xl font-bold text-alert-orange flex items-center gap-2 mb-4">
                        <ShieldAlert className="w-5 h-5" />
                        Priority Action Zones
                    </h2>
                    <ul className="space-y-4 text-gray-300 font-sora">
                        <li className="flex gap-4">
                            <span className="font-mono text-alert-orange font-bold">1</span>
                            <div>
                                <b>Deploy heavy urban rescue to Sector Alpha</b>
                                <p className="text-sm text-gray-400 mt-1">Highest density of collapsed residential structures.</p>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="font-mono text-alert-orange font-bold">2</span>
                            <div>
                                <b>Airdrop medical supplies to cutoff zones</b>
                                <p className="text-sm text-gray-400 mt-1">Main highway bridge [Hw9] compromised; terrain impassable.</p>
                            </div>
                        </li>
                    </ul>
                </section>

                <div className="flex justify-center mt-4">
                    <Link to="/" className="text-sm font-mono text-plasma hover:underline">← RETURN TO COMMAND DASHBOARD</Link>
                </div>
            </div>
        </div>
    );
};

export default PublicReport;
