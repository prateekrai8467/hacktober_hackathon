import React, { useState } from 'react';
import { PencilLine, X, Search, CheckCircle } from 'lucide-react';
import { useStore } from '../../store';

const AssessMyArea = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, drawing, scanning, complete

    const handleScan = () => {
        setStatus('scanning');
        setTimeout(() => {
            setStatus('complete');
        }, 2500);
    };

    const closePanel = () => {
        setIsOpen(false);
        setStatus('idle');
    };

    return (
        <>
            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 md:right-auto md:left-1/2 md:-translate-x-1/2 z-[500] px-6 py-3 rounded-full flex items-center gap-3 transition-all hover:-translate-y-1 btn-magnetic btn-solid"
                >
                    <PencilLine className="w-5 h-5 text-plasma" />
                    <span className="font-sora font-semibold text-sm">Assess My Area</span>
                </button>
            )}

            {/* Slide-up Panel */}
            <div className={`fixed bottom-0 left-0 right-0 z-[600] bg-graphite border-t border-plasma/50 p-6 md:p-8 transform transition-transform duration-500 ease-out shadow-[0_-20px_50px_rgba(0,0,0,0.5)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="max-w-3xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-sora font-semibold text-xl text-ghost flex items-center gap-3">
                            <PencilLine className="w-6 h-6 text-plasma" />
                            On-Demand Satellite Assessment
                        </h2>
                        <button onClick={closePanel} className="text-gray-500 hover:text-white p-2">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <p className="font-sora text-sm text-gray-400">
                                Draw a polygon on the map around your neighborhood or facility to trigger an immediate, high-resolution satellite analysis.
                            </p>

                            {status === 'idle' && (
                                <button
                                    onClick={() => setStatus('drawing')}
                                    className="w-full btn-solid py-3 rounded-xl font-semibold btn-magnetic"
                                >
                                    START DRAWING ON MAP
                                </button>
                            )}

                            {status === 'drawing' && (
                                <button
                                    onClick={handleScan}
                                    className="w-full bg-alert-green/20 text-alert-green border border-alert-green/50 rounded-xl py-3 font-semibold hover:bg-alert-green/30 transition-colors flex justify-center items-center gap-2 animate-pulse"
                                >
                                    <Search className="w-5 h-5" /> CONFIRM AREA & SCAN
                                </button>
                            )}

                            {status === 'scanning' && (
                                <div className="bg-void/50 border border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center gap-3 h-28">
                                    <div className="w-6 h-6 border-2 border-gray-600 border-t-plasma rounded-full animate-spin" />
                                    <span className="font-mono text-xs text-plasma animate-pulse tracking-widest uppercase">Acquiring Sentinel Imagery...</span>
                                </div>
                            )}

                            {status === 'complete' && (
                                <div className="bg-alert-green/10 border border-alert-green/30 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
                                    <CheckCircle className="w-8 h-8 text-alert-green mb-1" />
                                    <span className="font-sora font-semibold text-ghost">Assessment Complete</span>
                                    <span className="font-mono text-[10px] text-gray-400">RESULTS ADDED TO DASHBOARD</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-void/50 rounded-2xl border border-gray-800 p-5 font-mono text-xs text-gray-400 space-y-3">
                            <div className="flex justify-between border-b border-gray-800 pb-2">
                                <span>Free Tier Quota</span>
                                <span className="text-plasma">AVAILABLE</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-800 pb-2">
                                <span>Max Polygon Size</span>
                                <span className="text-ghost">15 km²</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Estimated Time</span>
                                <span className="text-ghost">15-45 seconds</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AssessMyArea;
