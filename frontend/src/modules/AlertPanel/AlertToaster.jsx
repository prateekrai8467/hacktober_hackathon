import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { ShieldAlert, X, AlertTriangle, Info, Zap } from 'lucide-react';
import gsap from 'gsap';

const AlertToaster = () => {
    const { alerts } = useStore();
    const [visibleToasts, setVisibleToasts] = useState([]);
    const [dismissed, setDismissed] = useState(new Set());

    // Watch for new alerts and show toasts
    useEffect(() => {
        const newAlerts = alerts.filter(
            alert => !alert.acknowledged && !dismissed.has(alert.id)
        ).slice(0, 3); // Max 3 toasts at a time

        setVisibleToasts(newAlerts);

        // Animate new toasts in
        newAlerts.forEach((alert, idx) => {
            gsap.fromTo(
                `.toast-${alert.id}`,
                { x: 400, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.5, delay: idx * 0.1, ease: 'power3.out' }
            );
        });

        // Auto-dismiss after 8 seconds
        const timers = newAlerts.map(alert => {
            return setTimeout(() => {
                dismissToast(alert.id);
            }, 8000);
        });

        return () => timers.forEach(t => clearTimeout(t));
    }, [alerts, dismissed]);

    const dismissToast = (id) => {
        gsap.to(`.toast-${id}`, {
            x: 400,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                setDismissed(prev => new Set(prev).add(id));
            }
        });
    };

    const getAlertIcon = (severity) => {
        switch (severity) {
            case 'critical':
                return <ShieldAlert className="w-5 h-5 text-alert-red" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-alert-orange" />;
            default:
                return <Info className="w-5 h-5 text-plasma" />;
        }
    };

    const getAlertBorder = (severity) => {
        switch (severity) {
            case 'critical':
                return 'border-alert-red/50 shadow-[0_0_20px_rgba(255,59,48,0.3)]';
            case 'warning':
                return 'border-alert-orange/50 shadow-[0_0_20px_rgba(255,149,0,0.3)]';
            default:
                return 'border-plasma/30 shadow-glow';
        }
    };

    if (visibleToasts.length === 0) return null;

    return (
        <div className="fixed top-24 right-4 z-[800] flex flex-col gap-3 max-w-sm">
            {visibleToasts.map((alert, idx) => (
                <div
                    key={alert.id}
                    className={`toast-${alert.id} bg-graphite border ${getAlertBorder(alert.severity)} rounded-2xl p-4 flex items-start gap-3 backdrop-blur-md`}
                >
                    <div className={`p-2 rounded-xl ${
                        alert.severity === 'critical' ? 'bg-alert-red/10' :
                        alert.severity === 'warning' ? 'bg-alert-orange/10' : 'bg-plasma/10'
                    }`}>
                        {getAlertIcon(alert.severity)}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                                alert.severity === 'critical' ? 'text-alert-red animate-pulse' :
                                alert.severity === 'warning' ? 'text-alert-orange' : 'text-plasma'
                            }`}>
                                {alert.alert_type?.replace(/_/g, ' ') || 'SYSTEM ALERT'}
                            </span>
                        </div>
                        <p className="text-sm font-sora text-ghost leading-snug line-clamp-2">
                            {alert.message}
                        </p>
                        <span className="text-[10px] font-mono text-gray-500 mt-2 block">
                            {alert.created_at ? new Date(alert.created_at).toLocaleTimeString() : 'Just now'}
                        </span>
                    </div>

                    <button
                        onClick={() => dismissToast(alert.id)}
                        className="text-gray-500 hover:text-white transition-colors p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default AlertToaster;
