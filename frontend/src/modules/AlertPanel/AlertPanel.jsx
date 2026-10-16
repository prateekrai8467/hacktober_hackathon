import React from 'react';
import { useStore } from '../../store';
import { X, ShieldAlert, Check, Activity } from 'lucide-react';

const AlertPanel = () => {
    const { isAlertPanelOpen, toggleAlertPanel, alerts } = useStore();

    if (!isAlertPanelOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-void/60 backdrop-blur-sm z-[900]"
                onClick={toggleAlertPanel}
            />
            <div className="fixed top-0 right-0 bottom-0 w-80 md:w-96 bg-graphite border-l border-gray-800 z-[1000] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)] transform transition-transform duration-300">
                <div className="flex justify-between items-center p-6 border-b border-gray-800">
                    <h2 className="font-sora font-bold text-lg text-ghost flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-plasma" />
                        System Alerts
                    </h2>
                    <button onClick={toggleAlertPanel} className="text-gray-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-4">
                    {alerts.map(alert => (
                        <div key={alert.id} className="bg-void/50 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className={`mt-0.5 ${alert.severity === 'critical' ? 'text-alert-red animate-pulse' :
                                    alert.severity === 'warning' ? 'text-alert-yellow' : 'text-plasma'
                                    }`}>
                                    {alert.severity === 'info' ? <Activity className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                </div>
                                <p className="flex-1 text-sm font-sora text-gray-300 leading-snug">{alert.message}</p>
                            </div>

                            <div className="flex justify-between items-center ml-7 mt-1">
                                <span className="text-[10px] font-mono text-gray-500">{alert.created_at}</span>
                                <button className="text-[10px] font-mono font-bold text-plasma hover:text-white flex items-center gap-1 transition-colors">
                                    <Check className="w-3 h-3" /> ACKNOWLEDGE
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-800 bg-void/30 text-center">
                    <button className="text-xs font-mono text-gray-500 hover:text-ghost transition-colors">
                        MARK ALL AS READ
                    </button>
                </div>
            </div>
        </>
    );
};

export default AlertPanel;
