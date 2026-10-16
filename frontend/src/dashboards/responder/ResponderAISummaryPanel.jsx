import React, { useState, useEffect } from 'react';
import {
    Brain,
    Sparkles,
    AlertTriangle,
    CheckCircle2,
    MapPin,
    ArrowRight,
    Lock
} from 'lucide-react';
import { listIncidentReports, getIncidentReportDetail } from '../../services/sahayak';

const getUrgencyBadge = (urgency) => {
    switch (urgency?.toLowerCase()) {
        case 'critical':
            return 'bg-alert-red/20 text-alert-red border-alert-red/40';
        case 'high':
            return 'bg-alert-orange/20 text-alert-orange border-alert-orange/40';
        case 'medium':
            return 'bg-alert-yellow/20 text-alert-yellow border-alert-yellow/40';
        case 'low':
            return 'bg-alert-green/20 text-alert-green border-alert-green/40';
        default:
            return 'bg-ghost/10 text-ghost/70 border-ghost/20';
    }
};

export const ResponderAISummaryPanel = () => {
    const [incident, setIncident] = useState(null);
    const [assessment, setAssessment] = useState(null);
    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function fetchLatestIncidentAssessment() {
            try {
                const reports = await listIncidentReports({ limit: 5 });
                if (!isMounted) return;

                if (!reports || reports.length === 0) {
                    setHasLoaded(true);
                    return;
                }

                // Check recent reports for the latest with an assessment
                for (const rep of reports) {
                    try {
                        const detail = await getIncidentReportDetail(rep.id);
                        if (!isMounted) return;

                        if (detail && detail.assessments && detail.assessments.length > 0) {
                            setIncident(detail.report);
                            setAssessment(detail.assessments[0]);
                            setHasLoaded(true);
                            return;
                        }
                    } catch {
                        // Continue checking next report
                    }
                }

                // If no report has assessments, show latest report with null assessment
                if (reports.length > 0) {
                    setIncident(reports[0]);
                }
                setHasLoaded(true);
            } catch {
                if (isMounted) setHasLoaded(true);
            }
        }

        fetchLatestIncidentAssessment();
        return () => { isMounted = false; };
    }, []);

    if (!hasLoaded) {
        return (
            <div className="bg-graphite rounded-3xl p-5 border border-gray-800 shadow-glow text-ghost/50 text-xs font-data">
                Loading latest AI incident review...
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="bg-graphite rounded-3xl p-5 border border-gray-800 shadow-glow">
                <div className="flex items-center gap-2 mb-2 text-plasma">
                    <Brain className="w-5 h-5" />
                    <h3 className="font-heading font-bold text-sm text-ghost">
                        Sahayak AI Review Summary
                    </h3>
                </div>
                <p className="text-ghost/50 text-xs font-sora">
                    No AI assessment available for recent ground incidents.
                </p>
            </div>
        );
    }

    const ext = assessment.structured_extraction || {};
    const urgencyClass = getUrgencyBadge(ext.urgency_level);

    return (
        <div className="bg-graphite rounded-3xl p-5 md:p-6 border border-plasma/30 shadow-glow">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-plasma" />
                    <h3 className="font-heading font-bold text-sm text-ghost">
                        Sahayak AI Review Summary
                    </h3>
                    <code className="text-[11px] font-data text-plasma bg-plasma/10 px-2 py-0.5 rounded border border-plasma/20">
                        {assessment.model_version || 'Gemma 4'}
                    </code>
                </div>

                {assessment.is_genuine_inference && (
                    <span className="text-[10px] font-data text-alert-green bg-alert-green/10 px-2 py-0.5 rounded border border-alert-green/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Genuine AI
                    </span>
                )}
            </div>

            {/* Target Incident Meta */}
            {incident && (
                <div className="mb-4 text-xs font-data flex items-center justify-between gap-2 text-ghost/60">
                    <div className="flex items-center gap-1 truncate text-ghost">
                        <MapPin className="w-3.5 h-3.5 text-plasma flex-shrink-0" />
                        <span className="truncate">{incident.location_name}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${urgencyClass}`}>
                        {ext.urgency_level || 'Medium'} Urgency
                    </span>
                </div>
            )}

            {/* AI Summary */}
            <div className="mb-4">
                <div className="text-[11px] font-heading text-plasma font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Situation Summary
                </div>
                <p className="text-ghost/90 text-xs font-sora leading-relaxed bg-void/50 p-3 rounded-xl border border-gray-800">
                    {assessment.summary}
                </p>
            </div>

            {/* Recommended Next Action */}
            <div className="mb-4">
                <div className="text-[11px] font-heading text-plasma font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    Recommended Action
                </div>
                <p className="text-ghost/90 text-xs font-sora leading-relaxed bg-void/50 p-3 rounded-xl border border-gray-800">
                    {assessment.recommended_next_step || 'Awaiting coordinator triage.'}
                </p>
            </div>

            {/* Read-Only Dispatch Note */}
            <div className="pt-2 border-t border-gray-800 flex items-center justify-between gap-2 text-[10px] font-data text-ghost/40">
                <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-alert-yellow" /> Read-Only Field Responder View
                </span>
                <span>ID: {incident?.id ? incident.id.slice(0, 8) + '...' : ''}</span>
            </div>
        </div>
    );
};

export default ResponderAISummaryPanel;
