import React, { useState, useEffect, useCallback } from 'react';
import {
    History,
    RefreshCw,
    Search,
    MapPin,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
    Shield,
    Trash2,
    ExternalLink,
    ChevronRight,
    X,
    FileText,
    Brain,
    Camera
} from 'lucide-react';
import {
    getTrackedReportIds,
    addTrackedReportId,
    removeTrackedReportId,
    getIncidentReportDetail
} from '../../services/sahayak';
import GemmaAssessmentViewer from './GemmaAssessmentViewer';

// Status badge styling helper
const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
        case 'submitted':
            return {
                label: 'Submitted (Intake Logged)',
                classes: 'bg-plasma/10 text-plasma border-plasma/30',
                pulse: true
            };
        case 'analyzing':
            return {
                label: 'Analyzing with AI',
                classes: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                pulse: true
            };
        case 'analyzed':
            return {
                label: 'Evidence Analyzed',
                classes: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                pulse: false
            };
        case 'verified':
            return {
                label: 'Verified by Responder',
                classes: 'bg-alert-green/10 text-alert-green border-alert-green/30',
                pulse: false
            };
        case 'rejected':
            return {
                label: 'Rejected / Disputed',
                classes: 'bg-alert-red/10 text-alert-red border-alert-red/30',
                pulse: false
            };
        case 'info_requested':
            return {
                label: 'Information Requested',
                classes: 'bg-alert-orange/10 text-alert-orange border-alert-orange/30',
                pulse: true
            };
        default:
            return {
                label: status || 'Unknown Status',
                classes: 'bg-ghost/10 text-ghost/70 border-ghost/20',
                pulse: false
            };
    }
};

const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
        case 'critical':
            return 'bg-alert-red/15 text-alert-red border-alert-red/30';
        case 'high':
            return 'bg-alert-orange/15 text-alert-orange border-alert-orange/30';
        case 'medium':
            return 'bg-alert-yellow/15 text-alert-yellow border-alert-yellow/30';
        case 'low':
            return 'bg-alert-green/15 text-alert-green border-alert-green/30';
        default:
            return 'bg-ghost/10 text-ghost/70 border-ghost/20';
    }
};

export const IncidentHistory = ({ refreshTrigger }) => {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [fetchError, setFetchError] = useState(null);

    // Search by ID state
    const [searchId, setSearchId] = useState('');
    const [searchError, setSearchError] = useState(null);
    const [searchSuccess, setSearchSuccess] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    // Selected report for detail modal
    const [selectedReportDetail, setSelectedReportDetail] = useState(null);
    const [detailTab, setDetailTab] = useState('gemma_ai'); // 'gemma_ai' or 'record'

    // Fetch reports for all tracked IDs
    const loadTrackedReports = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        setFetchError(null);

        try {
            const trackedIds = getTrackedReportIds();

            if (trackedIds.length === 0) {
                setReports([]);
                setLastRefreshed(new Date());
                setIsLoading(false);
                setIsRefreshing(false);
                return;
            }

            // Fetch details in parallel
            const results = await Promise.allSettled(
                trackedIds.map(id => getIncidentReportDetail(id))
            );

            const loadedReports = [];
            results.forEach((res, index) => {
                if (res.status === 'fulfilled' && res.value && res.value.report) {
                    loadedReports.push({
                        ...res.value.report,
                        assessments: res.value.assessments || [],
                        reviews: res.value.reviews || [],
                        tool_activities: res.value.tool_activities || []
                    });
                } else {
                    // ID may have been deleted or invalid
                    loadedReports.push({
                        id: trackedIds[index],
                        isNotFound: true,
                        title: 'Report Unavailable',
                        description: 'This report could not be retrieved from the server. It may have been archived or removed.',
                        status: 'not_found',
                        category: 'unknown',
                        severity_claimed: 'unknown',
                        location_name: 'Unknown Location',
                        created_at: null
                    });
                }
            });

            setReports(loadedReports);
            setLastRefreshed(new Date());
        } catch (err) {
            setFetchError(err.message || 'Unable to communicate with the Sahayak AI crisis ledger.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // Load on mount and when refreshTrigger changes
    useEffect(() => {
        loadTrackedReports(false);
    }, [loadTrackedReports, refreshTrigger]);

    // Handle Search by ID helper
    const searchReportById = async (targetId) => {
        setSearchError(null);
        setSearchSuccess(null);
        const cleanId = targetId.trim();
        if (!cleanId) return;

        setIsSearching(true);
        try {
            const detail = await getIncidentReportDetail(cleanId);
            if (detail && detail.report) {
                addTrackedReportId(detail.report.id);
                setSearchSuccess(`Successfully tracked report: "${detail.report.title || detail.report.id.slice(0, 8)}"`);
                setSearchId('');
                await loadTrackedReports(true);
                setSelectedReportDetail({
                    ...detail.report,
                    assessments: detail.assessments || [],
                    reviews: detail.reviews || []
                });
                setDetailTab(detail.assessments && detail.assessments.length > 0 ? 'gemma_ai' : 'record');
            } else {
                setSearchError(`Report '${cleanId}' was not found in the crisis intake ledger.`);
            }
        } catch (err) {
            setSearchError(err.message || `Failed to fetch report '${cleanId}'.`);
        } finally {
            setIsSearching(false);
        }
    };

    // Manual Form Search
    const handleSearchById = async (e) => {
        e.preventDefault();
        searchReportById(searchId);
    };

    // Remove report from device history
    const handleRemoveTracked = (id, e) => {
        if (e) e.stopPropagation();
        removeTrackedReportId(id);
        setReports(prev => prev.filter(r => r.id !== id));
        if (selectedReportDetail?.id === id) {
            setSelectedReportDetail(null);
        }
    };

    // Open detail view and choose default tab
    const handleSelectReport = (report) => {
        setSelectedReportDetail(report);
        setDetailTab(report.assessments && report.assessments.length > 0 ? 'gemma_ai' : 'record');
    };

    return (
        <div className="bg-graphite rounded-3xl p-6 md:p-8 border border-plasma/20 shadow-float">
            {/* Header with Title and Refresh Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <History className="w-6 h-6 text-plasma" />
                        <h2 className="text-xl md:text-2xl font-heading font-bold text-ghost">
                            Disaster Incident History & Status
                        </h2>
                    </div>
                    <p className="text-ghost/60 font-sora text-sm">
                        Track ground truth incident reports submitted on this device with real-time processing statuses and Gemma 4 evidence assessments.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {lastRefreshed && (
                        <div className="text-[11px] font-data text-ghost/40 hidden sm:block">
                            Refreshed: <span className="text-ghost/70">{lastRefreshed.toLocaleTimeString()}</span>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => loadTrackedReports(true)}
                        disabled={isRefreshing || isLoading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ghost/5 hover:bg-ghost/10 border border-ghost/15 text-ghost text-xs font-data transition-all hover:border-plasma/40 disabled:opacity-50 cursor-pointer"
                        title="Fetch latest status from backend"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-plasma ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>{isRefreshing ? 'Refreshing...' : 'Refresh Status'}</span>
                    </button>
                </div>
            </div>

            {/* Privacy Notice Banner */}
            <div className="bg-void/60 border border-ghost/10 rounded-2xl p-4 mb-6 flex items-start gap-3 text-xs font-sora text-ghost/70">
                <Shield className="w-5 h-5 text-plasma flex-shrink-0 mt-0.5" />
                <div>
                    <strong className="text-ghost block mb-0.5 font-heading">
                        Privacy Notice — Reports on This Device
                    </strong>
                    This section tracks disaster reports initiated from this browser session or linked by Report ID.
                    For civilian privacy, incident identifiers are stored locally on your device rather than tied to an open public profile.
                </div>
            </div>

            {/* Manual Track by Report ID Search Bar */}
            <form onSubmit={handleSearchById} className="mb-6">
                <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-ghost/40 absolute left-3.5 top-3 pointer-events-none" />
                        <input
                            type="text"
                            value={searchId}
                            onChange={(e) => {
                                setSearchId(e.target.value);
                                if (searchError) setSearchError(null);
                            }}
                            placeholder="Enter Report ID (e.g., 869b3ce9-b060-44d5-86e6-fdb40c3f507f)..."
                            disabled={isSearching}
                            className="w-full bg-void rounded-xl border border-ghost/15 pl-10 pr-4 py-2.5 text-xs text-ghost placeholder:text-ghost/30 focus:outline-none focus:border-plasma focus:ring-1 focus:ring-plasma font-data disabled:opacity-50"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSearching || !searchId.trim()}
                        className="px-5 py-2.5 rounded-xl bg-plasma/20 hover:bg-plasma/30 border border-plasma/40 text-plasma font-heading font-semibold text-xs transition-all hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                    >
                        {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        Track by Report ID
                    </button>
                </div>

                {searchError && (
                    <div className="mt-2 text-xs font-sora text-alert-red flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {searchError}
                    </div>
                )}
                {searchSuccess && (
                    <div className="mt-2 text-xs font-sora text-alert-green flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {searchSuccess}
                    </div>
                )}
            </form>

            {/* Network / Global Fetch Error */}
            {fetchError && (
                <div className="bg-alert-red/10 border border-alert-red/30 rounded-2xl p-4 mb-6 flex items-start gap-3 text-xs text-ghost font-sora">
                    <AlertCircle className="w-4 h-4 text-alert-red flex-shrink-0 mt-0.5" />
                    <div>
                        <strong className="text-alert-red block mb-0.5">Connection Error</strong>
                        {fetchError}
                    </div>
                </div>
            )}

            {/* Reports List View */}
            {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-ghost/50 space-y-3 font-data text-xs">
                    <RefreshCw className="w-6 h-6 animate-spin text-plasma" />
                    <span>Synchronizing tracked reports with Sahayak crisis ledger...</span>
                </div>
            ) : reports.length === 0 ? (
                <div className="bg-void/40 border border-dashed border-ghost/15 rounded-2xl p-10 text-center space-y-3">
                    <FileText className="w-10 h-10 text-ghost/20 mx-auto" />
                    <h3 className="font-heading font-semibold text-ghost text-sm">
                        No Reports Tracked on This Device Yet
                    </h3>
                    <p className="text-ghost/50 text-xs font-sora max-w-md mx-auto">
                        Submit a disaster ground observation using the form above, or paste an existing Report ID into the search bar to inspect its live processing status.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {reports.map((report) => {
                        const statusBadge = getStatusBadge(report.status);
                        const severityClass = getSeverityBadge(report.severity_claimed);
                        const isSelected = selectedReportDetail?.id === report.id;
                        const hasAssessment = report.assessments && report.assessments.length > 0;

                        if (report.isNotFound) {
                            return (
                                <div
                                    key={report.id}
                                    className="bg-void/40 border border-alert-red/20 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs font-data"
                                >
                                    <div>
                                        <span className="text-alert-red font-bold block mb-0.5">ID: {report.id}</span>
                                        <span className="text-ghost/50 font-sora">Report record not found on server.</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => handleRemoveTracked(report.id, e)}
                                        className="p-2 rounded-lg hover:bg-alert-red/20 text-ghost/40 hover:text-alert-red transition-colors"
                                        title="Remove from tracking"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={report.id}
                                onClick={() => handleSelectReport(report)}
                                className={`bg-void rounded-2xl p-4 md:p-5 border transition-all cursor-pointer hover:border-plasma/40 ${
                                    isSelected ? 'border-plasma ring-1 ring-plasma/50 bg-void/90' : 'border-ghost/10 hover:bg-void/80'
                                }`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-heading font-bold text-ghost text-sm">
                                            {report.title || `${report.category.toUpperCase()} Incident`}
                                        </h3>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-data uppercase font-bold border ${severityClass}`}>
                                            {report.severity_claimed}
                                        </span>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-data uppercase bg-ghost/5 text-ghost/70 border border-ghost/10">
                                            {report.category}
                                        </span>
                                        {hasAssessment && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-data uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                                <Brain className="w-3 h-3 text-purple-400" />
                                                Gemma 4 Evaluated
                                            </span>
                                        )}
                                    </div>

                                    {/* Status Badge */}
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-data font-semibold border inline-flex items-center gap-1.5 ${statusBadge.classes}`}>
                                            {statusBadge.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                                            {statusBadge.label}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-ghost/70 font-sora text-xs line-clamp-2 mb-3 leading-relaxed">
                                    {report.description}
                                </p>

                                <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-data text-ghost/40 pt-2 border-t border-ghost/10">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1 text-ghost/70">
                                            <MapPin className="w-3.5 h-3.5 text-plasma" />
                                            {report.location_name}
                                        </span>
                                        {report.created_at && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(report.created_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-plasma hover:underline flex items-center gap-1 text-xs font-semibold">
                                            Inspect Assessment <ChevronRight className="w-3.5 h-3.5" />
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => handleRemoveTracked(report.id, e)}
                                            className="p-1 rounded hover:bg-graphite text-ghost/30 hover:text-alert-red transition-colors"
                                            title="Stop tracking this report on this device"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* INCIDENT DETAILS & GEMMA 4 ASSESSMENT VIEWER MODAL (Commit 3)     */}
            {/* ----------------------------------------------------------------- */}
            {selectedReportDetail && (
                <div className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
                    <div className="bg-graphite border border-plasma/30 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-5 md:p-8 shadow-2xl relative custom-scrollbar">
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setSelectedReportDetail(null)}
                            className="absolute top-5 right-5 p-2 rounded-xl bg-void/50 hover:bg-void text-ghost/60 hover:text-ghost transition-colors border border-ghost/10 z-10 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Modal Header */}
                        <div className="mb-5 pr-10">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-data bg-plasma/10 text-plasma border border-plasma/20">
                                    <FileText className="w-3.5 h-3.5" />
                                    INCIDENT DOSSIER
                                </span>
                                {selectedReportDetail.is_synthetic && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-data bg-alert-yellow/15 text-alert-yellow border border-alert-yellow/30 uppercase">
                                        Synthetic Test Fixture
                                    </span>
                                )}
                            </div>
                            <h3 className="text-xl md:text-2xl font-heading font-bold text-ghost">
                                {selectedReportDetail.title || `${selectedReportDetail.category?.toUpperCase()} Incident`}
                            </h3>
                            <div className="text-xs font-data text-ghost/50 mt-1 break-all">
                                Report ID: <span className="text-plasma font-semibold">{selectedReportDetail.id}</span>
                            </div>
                        </div>

                        {/* Modal Navigation Tabs: [ Gemma 4 AI Intelligence ] vs [ Original Submission Record ] */}
                        <div className="flex items-center gap-2 mb-6 border-b border-ghost/10 pb-3">
                            <button
                                type="button"
                                onClick={() => setDetailTab('gemma_ai')}
                                className={`px-4 py-2 rounded-xl text-xs font-heading font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                                    detailTab === 'gemma_ai'
                                        ? 'bg-plasma/20 text-plasma border border-plasma/40 shadow-glow font-bold'
                                        : 'bg-void text-ghost/60 hover:text-ghost border border-ghost/10'
                                }`}
                            >
                                <Brain className="w-4 h-4 text-plasma" />
                                <span>Gemma 4 AI Assessment</span>
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-data bg-ghost/10 text-ghost">
                                    {selectedReportDetail.assessments?.length || 0}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setDetailTab('record')}
                                className={`px-4 py-2 rounded-xl text-xs font-heading font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                                    detailTab === 'record'
                                        ? 'bg-plasma/20 text-plasma border border-plasma/40 shadow-glow font-bold'
                                        : 'bg-void text-ghost/60 hover:text-ghost border border-ghost/10'
                                }`}
                            >
                                <FileText className="w-4 h-4" />
                                <span>Original Ground Record</span>
                            </button>
                        </div>

                        {/* TAB 1: GEMMA 4 ASSESSMENT VIEWER */}
                        {detailTab === 'gemma_ai' ? (
                            <div className="mb-6">
                                <GemmaAssessmentViewer
                                    report={selectedReportDetail}
                                    assessments={selectedReportDetail.assessments || []}
                                    onTrackReportId={(id) => searchReportById(id)}
                                />
                            </div>
                        ) : (
                            /* TAB 2: ORIGINAL GROUND RECORD */
                            <div className="space-y-5 mb-6 text-sm font-sora">
                                {/* Status & Category Bar */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-void border border-ghost/10 font-data text-xs">
                                    <div>
                                        <span className="text-ghost/40 block mb-1">Current Status</span>
                                        <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold inline-block ${getStatusBadge(selectedReportDetail.status).classes}`}>
                                            {getStatusBadge(selectedReportDetail.status).label}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-ghost/40 block mb-1">Claimed Severity</span>
                                        <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold uppercase inline-block ${getSeverityBadge(selectedReportDetail.severity_claimed)}`}>
                                            {selectedReportDetail.severity_claimed}
                                        </span>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <span className="text-ghost/40 block mb-1">Disaster Category</span>
                                        <span className="text-ghost font-semibold uppercase">
                                            {selectedReportDetail.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Detailed Description */}
                                <div>
                                    <h4 className="text-xs font-heading font-semibold text-ghost/50 uppercase tracking-wider mb-1.5">
                                        Original Incident Description
                                    </h4>
                                    <p className="text-ghost/90 leading-relaxed bg-void/50 p-4 rounded-xl border border-ghost/10 whitespace-pre-wrap">
                                        {selectedReportDetail.description}
                                    </p>
                                </div>

                                {/* Location & Coordinates */}
                                <div>
                                    <h4 className="text-xs font-heading font-semibold text-ghost/50 uppercase tracking-wider mb-1.5">
                                        Location Telemetry
                                    </h4>
                                    <div className="p-3.5 rounded-xl bg-void/50 border border-ghost/10 text-xs font-data space-y-1">
                                        <div className="flex items-center gap-1.5 text-ghost">
                                            <MapPin className="w-4 h-4 text-plasma" />
                                            <span>{selectedReportDetail.location_name}</span>
                                        </div>
                                        {selectedReportDetail.lat && selectedReportDetail.lon && (
                                            <div className="text-ghost/50 pl-5">
                                                GPS: {Number(selectedReportDetail.lat).toFixed(6)}°, {Number(selectedReportDetail.lon).toFixed(6)}°
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Attached Photograph if any */}
                                {selectedReportDetail.photo_url && (
                                    <div>
                                        <h4 className="text-xs font-heading font-semibold text-ghost/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                            <Camera className="w-4 h-4 text-plasma" />
                                            Submitted Photograph
                                        </h4>
                                        <div className="p-2 rounded-xl bg-void/50 border border-ghost/10">
                                            <img
                                                src={selectedReportDetail.photo_url}
                                                alt="Incident evidence"
                                                className="max-h-56 rounded-lg object-cover w-full"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                            <a
                                                href={selectedReportDetail.photo_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] text-plasma hover:underline mt-2 font-data"
                                            >
                                                <ExternalLink className="w-3 h-3" /> View full photo
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {/* Submission Timestamp */}
                                {selectedReportDetail.created_at && (
                                    <div className="text-[11px] font-data text-ghost/40 pt-2">
                                        Logged into ledger: {new Date(selectedReportDetail.created_at).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Modal Footer */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-ghost/10">
                            <button
                                type="button"
                                onClick={() => handleRemoveTracked(selectedReportDetail.id)}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-alert-red/10 hover:bg-alert-red/20 border border-alert-red/30 text-alert-red text-xs font-data transition-colors cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Stop Tracking on This Device
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedReportDetail(null)}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-ghost/10 hover:bg-ghost/20 text-ghost text-xs font-heading font-semibold transition-colors cursor-pointer"
                            >
                                Close Dossier
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncidentHistory;
