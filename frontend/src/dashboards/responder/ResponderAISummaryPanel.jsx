import React, { useState, useEffect, useCallback } from 'react';
import {
    Brain,
    Sparkles,
    AlertTriangle,
    CheckCircle2,
    MapPin,
    ArrowRight,
    Lock,
    RefreshCw,
    AlertCircle
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
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchLatestIncidentAssessment = useCallback(async (isManualRefresh = false) => {
        // Prevent concurrent or duplicate in-flight requests
        if (isManualRefresh && isRefreshing) return;
        if (!isManualRefresh && !isLoading && !lastUpdated) return;

        if (isManualRefresh) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        setFetchError(null);

        try {
            const reports = await listIncidentReports({ limit: 5 });

            if (!reports || reports.length === 0) {
                setIncident(null);
                setAssessment(null);
                setLastUpdated(new Date());
                setIsLoading(false);
                setIsRefreshing(false);
                return;
            }

            let foundAssessment = false;
            for (const rep of reports) {
                try {
                    const detail = await getIncidentReportDetail(rep.id);
                    if (detail && detail.assessments && detail.assessments.length > 0) {
                        setIncident(detail.report);
                        setAssessment(detail.assessments[0]);
                        foundAssessment = true;
                        break;
                    }
                } catch {
                    // Continue checking next available report
                }
            }

            if (!foundAssessment) {
                setIncident(reports[0]);
                setAssessment(null);
            }

            setLastUpdated(new Date());
        } catch (err) {
            setFetchError(err.message || 'Unable to connect to the Sahayak crisis intelligence service.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [isLoading, isRefreshing, lastUpdated]);

    useEffect(() => {
        fetchLatestIncidentAssessment(false);
    }, [fetchLatestIncidentAssessment]);

    // Handle Manual Refresh
    const handleRefresh = (e) => {
        if (e) e.preventDefault();
        if (isLoading || isRefreshing) return; // Prevent duplicate requests
        fetchLatestIncidentAssessment(true);
    };

    // 1. Initial Loading State
    if (isLoading && !lastUpdated) {
        return (
            <div className="bg-graphite rounded-3xl p-6 border border-gray-800 shadow-glow flex items-center justify-center gap-3 text-ghost/60 text-xs font-data py-8">
                <RefreshCw className="w-4 h-4 animate-spin text-plasma" />
                <span>Loading latest AI incident review...</span>
            </div>
        );
    }

    // 2. Fetch Error State with Retry
    if (fetchError && !assessment) {
        return (
            <div className="bg-graphite rounded-3xl p-5 border border-alert-red/30 shadow-glow text-xs font-sora">
                <div className="flex items-center gap-2 mb-2 text-alert-red font-heading font-semibold">
                    <AlertCircle className="w-4 h-4" />
                    <span>Failed to Load AI Review</span>
                </div>
                <p className="text-ghost/70 mb-3 text-[11px] leading-relaxed">
                    {fetchError}
                </p>
                <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="px-3.5 py-1.5 rounded-xl bg-alert-red/10 hover:bg-alert-red/20 border border-alert-red/30 text-alert-red font-data text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>{isRefreshing ? 'Retrying...' : 'Retry Connection'}</span>
                </button>
            </div>
        );
    }

    // 3. Empty State (No assessments found)
    if (!assessment) {
        return (
            <div className="bg-graphite rounded-3xl p-5 border border-gray-800 shadow-glow">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 text-plasma">
                        <Brain className="w-5 h-5" />
                        <h3 className="font-heading font-bold text-sm text-ghost">
                            Sahayak AI Review Summary
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-1.5 rounded-lg bg-void/50 hover:bg-void text-ghost/60 hover:text-plasma border border-ghost/10 transition-colors cursor-pointer disabled:opacity-50"
                        title="Refresh incident assessment"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <p className="text-ghost/50 text-xs font-sora">
                    No AI assessment available for recent ground incidents.
                </p>
            </div>
        );
    }

    const ext = assessment.structured_extraction || {};
    const urgencyClass = getUrgencyBadge(ext.urgency_level);

    // 4. Populated Assessment View
    return (
        <div className="bg-graphite rounded-3xl p-5 md:p-6 border border-plasma/30 shadow-glow">
            {/* Header with Title and Working Refresh Button */}
            <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-gray-800">
                <div className="flex items-center gap-2 flex-wrap">
                    <Brain className="w-5 h-5 text-plasma" />
                    <h3 className="font-heading font-bold text-sm text-ghost">
                        Sahayak AI Review Summary
                    </h3>
                    <code className="text-[11px] font-data text-plasma bg-plasma/10 px-2 py-0.5 rounded border border-plasma/20">
                        {assessment.model_version || 'Gemma 4'}
                    </code>
                </div>

                <div className="flex items-center gap-2">
                    {assessment.is_genuine_inference && (
                        <span className="text-[10px] font-data text-alert-green bg-alert-green/10 px-2 py-0.5 rounded border border-alert-green/20 hidden sm:inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Genuine AI
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-1.5 rounded-lg bg-void/60 hover:bg-void text-ghost/60 hover:text-plasma border border-ghost/10 transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1 text-[11px] font-data"
                        title="Refresh latest incident review"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-plasma ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="hidden md:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                </div>
            </div>

            {/* In-Flight Soft Refresh Error Notice */}
            {fetchError && (
                <div className="mb-3 p-2.5 rounded-xl bg-alert-red/10 border border-alert-red/20 text-[11px] text-alert-red font-sora flex items-center justify-between gap-2">
                    <span className="truncate">Refresh failed: {fetchError}</span>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="underline hover:text-ghost flex-shrink-0 cursor-pointer"
                    >
                        Retry
                    </button>
                </div>
            )}

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

            {/* Read-Only Dispatch Note & Refresh Timestamp */}
            <div className="pt-2 border-t border-gray-800 flex items-center justify-between gap-2 text-[10px] font-data text-ghost/40">
                <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-alert-yellow" /> Read-Only Field Responder View
                </span>
                <span>
                    {lastUpdated ? `Updated: ${lastUpdated.toLocaleTimeString()}` : ''}
                </span>
            </div>
        </div>
    );
};

export default ResponderAISummaryPanel;
