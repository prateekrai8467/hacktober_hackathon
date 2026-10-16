import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Activity,
    ShieldAlert,
    AlertTriangle,
    PhoneCall,
    MapPin,
    Clock,
    CheckCircle2
} from 'lucide-react';
import IncidentReportForm from './IncidentReportForm';

export const CivilianDashboard = () => {
    const [recentReports, setRecentReports] = useState([]);

    const handleReportSubmitted = (newReport) => {
        setRecentReports((prev) => [newReport, ...prev]);
    };

    return (
        <div className="min-h-screen bg-void text-ghost flex flex-col">
            {/* Civilian Dashboard Navbar */}
            <nav className="fixed top-0 left-0 w-full h-16 border-b border-primary/10 bg-textDark text-primary z-50 flex items-center px-6">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-plasma" />
                    <span className="font-heading font-bold text-xl tracking-tight text-ghost">
                        TeraScope
                    </span>
                    <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-data bg-plasma/10 text-plasma border border-plasma/30 uppercase tracking-widest hidden sm:inline-block">
                        Civilian Portal
                    </span>
                </div>
                <div className="ml-auto flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs font-data text-accent">
                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                        SAHAYAK INTAKE ONLINE
                    </div>
                    <Link
                        to="/"
                        className="text-xs font-data text-primary/60 hover:text-primary transition-colors ml-4 uppercase tracking-wider"
                    >
                        Exit to Home
                    </Link>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto w-full flex-1">
                {/* Dashboard Title & Overview Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-ghost mb-2">
                        Civilian Crisis Portal
                    </h1>
                    <p className="text-ghost/60 font-sora text-sm max-w-3xl">
                        Monitor local safety conditions, view nearby disaster relief resources, and submit ground-level incident reports directly to emergency crisis intelligence.
                    </p>
                </div>

                {/* Top Status & Resource Cards (Preserving & enhancing existing layout) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                    {/* Active Alerts Card */}
                    <div className="bg-graphite rounded-3xl p-6 border border-plasma/20 shadow-float">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-base font-heading font-semibold text-plasma flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-plasma" />
                                Active Regional Alerts
                            </h2>
                            <span className="text-[10px] font-data text-ghost/40 uppercase">Live Feed</span>
                        </div>
                        <p className="text-ghost/70 font-sora text-sm mb-3">
                            No critical evacuation alerts in your immediate sector.
                        </p>
                        <div className="text-[11px] font-data text-ghost/40">
                            Satellite pass telemetry: <span className="text-plasma">Synchronized</span>
                        </div>
                    </div>

                    {/* Safety Status Card */}
                    <div className="bg-graphite rounded-3xl p-6 border border-alert-green/20 shadow-float">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-base font-heading font-semibold text-alert-green flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-alert-green" />
                                Safety Status
                            </h2>
                            <span className="w-2 h-2 rounded-full bg-alert-green animate-pulse" />
                        </div>
                        <p className="text-ghost/70 font-sora text-sm mb-3">
                            All clear — Normal municipal conditions reported.
                        </p>
                        <div className="text-[11px] font-data text-ghost/40">
                            Status: <span className="text-alert-green font-semibold">SAFE</span>
                        </div>
                    </div>

                    {/* Emergency Helplines & Resources Card */}
                    <div className="bg-graphite rounded-3xl p-6 border border-ghost/10 shadow-float">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-base font-heading font-semibold text-ghost flex items-center gap-2">
                                <PhoneCall className="w-4 h-4 text-accent" />
                                Immediate Helplines
                            </h2>
                            <span className="text-[10px] font-data text-accent uppercase font-bold">24/7 SOS</span>
                        </div>
                        <div className="space-y-1.5 text-xs font-data">
                            <div className="flex justify-between text-ghost/80">
                                <span>National Disaster Relief:</span>
                                <span className="text-accent font-bold">112 / 1078</span>
                            </div>
                            <div className="flex justify-between text-ghost/80">
                                <span>Fire & Rescue:</span>
                                <span className="text-accent font-bold">101</span>
                            </div>
                            <div className="flex justify-between text-ghost/80">
                                <span>Medical Ambulance:</span>
                                <span className="text-accent font-bold">102 / 108</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Primary Feature: Incident Reporting Form */}
                <div className="mb-10">
                    <IncidentReportForm onReportSubmitted={handleReportSubmitted} />
                </div>

                {/* Session Incident History (Shows submitted reports during this session) */}
                {recentReports.length > 0 && (
                    <div className="bg-graphite rounded-3xl p-6 border border-ghost/10 shadow-float">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-5 h-5 text-plasma" />
                            <h3 className="text-lg font-heading font-bold text-ghost">
                                Your Submitted Reports (This Session)
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-xs font-data bg-plasma/10 text-plasma ml-auto">
                                {recentReports.length} {recentReports.length === 1 ? 'Report' : 'Reports'}
                            </span>
                        </div>

                        <div className="divide-y divide-ghost/10">
                            {recentReports.map((report) => (
                                <div key={report.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-heading font-semibold text-ghost text-sm">
                                                {report.title || report.location_name}
                                            </span>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-data uppercase font-bold bg-alert-orange/20 text-alert-orange border border-alert-orange/30">
                                                {report.category}
                                            </span>
                                        </div>
                                        <p className="text-xs text-ghost/60 font-sora line-clamp-1">
                                            {report.description}
                                        </p>
                                        <div className="flex items-center gap-3 text-[11px] font-data text-ghost/40">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {report.location_name}
                                            </span>
                                            <span>•</span>
                                            <span>ID: {report.id.slice(0, 8)}...</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-start sm:self-center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-data uppercase bg-plasma/10 text-plasma border border-plasma/20">
                                            {report.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-ghost/10 bg-void py-6 px-6 text-center text-xs font-data text-ghost/40">
                TeraScope • Sahayak AI Disaster Intelligence and Evidence Investigation Platform
            </footer>
        </div>
    );
};

export default CivilianDashboard;
