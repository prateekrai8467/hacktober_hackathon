import React from 'react';
import { Link } from 'react-router-dom';

export const CivilianDashboard = () => {
    return (
        <div className="min-h-screen bg-void text-ghost">
            {/* Civilian Dashboard Navbar */}
            <nav className="fixed top-0 left-0 w-full h-16 border-b border-primary/10 bg-textDark text-primary z-50 flex items-center px-6">
                <div className="font-heading font-bold text-xl tracking-tight">
                    TeraScope
                </div>
                <div className="ml-auto flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-data text-accent">
                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                        LIVE
                    </div>
                    <Link to="/" className="text-sm font-data text-primary/60 hover:text-primary transition-colors ml-4">
                        EXIT
                    </Link>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-heading font-bold mb-8">Civilian Dashboard</h1>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Active Alerts Card */}
                        <div className="bg-graphite rounded-2xl p-6 border border-plasma/20">
                            <h2 className="text-lg font-heading font-semibold text-plasma mb-4">Active Alerts</h2>
                            <p className="text-ghost/60 font-data text-sm">No active alerts in your area</p>
                        </div>

                        {/* Safety Status Card */}
                        <div className="bg-graphite rounded-2xl p-6 border border-alert-green/20">
                            <h2 className="text-lg font-heading font-semibold text-alert-green mb-4">Safety Status</h2>
                            <p className="text-ghost/60 font-data text-sm">All clear - Normal conditions</p>
                        </div>

                        {/* Resources Card */}
                        <div className="bg-graphite rounded-2xl p-6 border border-ghost/10">
                            <h2 className="text-lg font-heading font-semibold mb-4">Emergency Resources</h2>
                            <p className="text-ghost/60 font-data text-sm">View nearby shelters and aid stations</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CivilianDashboard;
