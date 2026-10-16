import React, { useState } from 'react';
import {
    Brain,
    Sparkles,
    ShieldCheck,
    AlertTriangle,
    Eye,
    MessageSquare,
    CheckCircle2,
    HelpCircle,
    Scale,
    GitCompare,
    ArrowRight,
    Lock,
    ExternalLink,
    Calendar,
    Layers,
    ListChecks,
    Check,
    Copy
} from 'lucide-react';

/**
 * Visual badge for urgency levels
 */
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

/**
 * Visual badge for proposed task status
 */
const getTaskStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
        case 'approved':
            return {
                label: 'APPROVED BY DISPATCHER',
                classes: 'bg-alert-green/20 text-alert-green border-alert-green/40'
            };
        case 'rejected':
            return {
                label: 'REJECTED BY OPERATOR',
                classes: 'bg-alert-red/20 text-alert-red border-alert-red/40'
            };
        case 'pending_approval':
        default:
            return {
                label: 'PENDING HUMAN APPROVAL',
                classes: 'bg-alert-yellow/20 text-alert-yellow border-alert-yellow/40'
            };
    }
};

/**
 * Section A: Assessment Overview Subcomponent
 */
export const AssessmentOverview = ({ report, assessment, assessments, selectedIndex, onSelectIndex }) => {
    const ext = assessment.structured_extraction || {};
    const urgencyClass = getUrgencyBadge(ext.urgency_level);

    return (
        <div className="bg-void/80 rounded-2xl p-5 md:p-6 border border-plasma/30 shadow-glow mb-6">
            {/* Model & Authenticity Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-ghost/10">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-plasma/10 border border-plasma/30 text-plasma">
                        <Brain className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-heading font-bold text-ghost text-base">
                                Gemma 4 Crisis Assessment
                            </span>
                            <code className="px-2 py-0.5 rounded text-xs font-data bg-plasma/10 text-plasma border border-plasma/30">
                                {assessment.model_version || 'gemma-4'}
                            </code>
                        </div>
                        <div className="text-[11px] font-data text-ghost/40 mt-0.5">
                            Target Incident: <span className="text-ghost/70">{report?.title || report?.location_name || 'Ground Report'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Genuine Inference Indicator */}
                    {assessment.is_genuine_inference ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-data bg-alert-green/10 text-alert-green border border-alert-green/30 inline-flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Genuine Gemma 4 Inference
                        </span>
                    ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-data bg-alert-yellow/10 text-alert-yellow border border-alert-yellow/30 inline-flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Unverified Inference
                        </span>
                    )}

                    {/* Creation timestamp */}
                    {assessment.created_at && (
                        <div className="text-[11px] font-data text-ghost/40 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(assessment.created_at).toLocaleTimeString()}
                        </div>
                    )}
                </div>
            </div>

            {/* Multiple Assessments Selector (if available) */}
            {assessments && assessments.length > 1 && (
                <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl bg-graphite border border-ghost/10 text-xs font-data overflow-x-auto">
                    <Layers className="w-4 h-4 text-plasma flex-shrink-0" />
                    <span className="text-ghost/50 flex-shrink-0">Assessment Version:</span>
                    <div className="flex items-center gap-1.5">
                        {assessments.map((a, idx) => (
                            <button
                                key={a.id || idx}
                                type="button"
                                onClick={() => onSelectIndex(idx)}
                                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                    selectedIndex === idx
                                        ? 'bg-plasma/20 text-plasma border border-plasma/40 font-bold'
                                        : 'bg-void text-ghost/60 hover:text-ghost border border-ghost/10'
                                }`}
                            >
                                #{assessments.length - idx} {idx === 0 ? '(Latest)' : ''}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Classification & Urgency Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-3.5 rounded-xl bg-graphite border border-ghost/10 text-xs font-data">
                <div>
                    <span className="text-ghost/40 block mb-0.5">Classified Type</span>
                    <span className="text-ghost font-bold uppercase">{ext.incident_type || report?.category || 'Unspecified'}</span>
                </div>
                <div>
                    <span className="text-ghost/40 block mb-0.5">Assessed Urgency</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border inline-block ${urgencyClass}`}>
                        {ext.urgency_level || 'Medium'}
                    </span>
                </div>
                <div>
                    <span className="text-ghost/40 block mb-0.5">Location</span>
                    <span className="text-ghost/90 truncate block">{report?.location_name || 'Ground Zero'}</span>
                </div>
                <div>
                    <span className="text-ghost/40 block mb-0.5">Civilian Severity</span>
                    <span className="text-ghost/60 uppercase">{report?.severity_claimed || 'Unspecified'}</span>
                </div>
            </div>

            {/* AI Executive Summary */}
            <div>
                <h4 className="text-xs font-heading font-semibold text-plasma uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Executive Summary
                </h4>
                <p className="text-ghost/90 font-sora text-sm leading-relaxed bg-graphite/70 p-4 rounded-xl border border-ghost/10">
                    {assessment.summary || 'Summary unavailable from the model.'}
                </p>
            </div>
        </div>
    );
};

/**
 * Section B: Claims vs Evidence Subcomponent
 */
export const ClaimsVsEvidence = ({ structuredExtraction }) => {
    const ext = structuredExtraction || {};
    const claims = Array.isArray(ext.reported_claims) ? ext.reported_claims : [];
    const evidence = Array.isArray(ext.observed_evidence) ? ext.observed_evidence : [];

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
                <Scale className="w-5 h-5 text-plasma" />
                <h3 className="font-heading font-bold text-ghost text-base">
                    Claims vs Directly Observed Evidence
                </h3>
            </div>
            <p className="text-ghost/50 text-xs font-sora mb-4">
                Gemma 4 objectively parses human testimonials from observable ground and satellite facts.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Side: Reported Claims */}
                <div className="bg-void/70 rounded-2xl p-4 md:p-5 border border-alert-orange/30">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-alert-orange/20">
                        <MessageSquare className="w-4 h-4 text-alert-orange" />
                        <h4 className="font-heading font-semibold text-alert-orange text-xs uppercase tracking-wider">
                            Reported Claims (Citizen Statements)
                        </h4>
                    </div>
                    <p className="text-[11px] font-sora text-ghost/50 mb-3">
                        Unverified claims submitted by ground observers:
                    </p>

                    {claims.length > 0 ? (
                        <ul className="space-y-2 text-xs font-sora">
                            {claims.map((claim, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-ghost/90 bg-graphite/50 p-2.5 rounded-xl border border-ghost/10">
                                    <span className="w-1.5 h-1.5 rounded-full bg-alert-orange mt-1.5 flex-shrink-0" />
                                    <span>{claim}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-xs font-data text-ghost/40 italic p-3 bg-graphite/30 rounded-xl">
                            Not available
                        </div>
                    )}
                </div>

                {/* Right Side: Observed Evidence */}
                <div className="bg-void/70 rounded-2xl p-4 md:p-5 border border-plasma/30">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-plasma/20">
                        <Eye className="w-4 h-4 text-plasma" />
                        <h4 className="font-heading font-semibold text-plasma text-xs uppercase tracking-wider">
                            Observed Evidence (Telemetry & Senses)
                        </h4>
                    </div>
                    <p className="text-[11px] font-sora text-ghost/50 mb-3">
                        Directly observable facts extracted from photo/telemetry:
                    </p>

                    {evidence.length > 0 ? (
                        <ul className="space-y-2 text-xs font-sora">
                            {evidence.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-ghost/90 bg-graphite/50 p-2.5 rounded-xl border border-ghost/10">
                                    <span className="w-1.5 h-1.5 rounded-full bg-plasma mt-1.5 flex-shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-xs font-data text-ghost/40 italic p-3 bg-graphite/30 rounded-xl">
                            Not available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Section C: Missing Information & Ground Verification Checklist Subcomponent
 */
export const VerificationChecklist = ({ structuredExtraction, missingOrOutdatedInfo }) => {
    const ext = structuredExtraction || {};
    const missing = Array.isArray(ext.missing_information) ? ext.missing_information : [];
    const outdated = Array.isArray(missingOrOutdatedInfo) ? missingOrOutdatedInfo : [];
    const allMissing = Array.from(new Set([...missing, ...outdated]));
    const needs = Array.isArray(ext.verification_needs) ? ext.verification_needs : [];

    return (
        <div className="bg-void/60 rounded-2xl p-5 border border-ghost/10 mb-6">
            <div className="flex items-center gap-2 mb-2">
                <ListChecks className="w-5 h-5 text-alert-yellow" />
                <h3 className="font-heading font-bold text-ghost text-base">
                    Further Ground Verification Required
                </h3>
            </div>
            <p className="text-ghost/50 text-xs font-sora mb-4">
                Information listed below remains unverified and requires ground checks by first responders.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Missing or Outdated Information */}
                <div>
                    <h4 className="text-xs font-heading font-semibold text-ghost/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-alert-yellow" />
                        Missing or Unconfirmed Data
                    </h4>
                    {allMissing.length > 0 ? (
                        <ul className="space-y-1.5 text-xs font-sora">
                            {allMissing.map((item, idx) => (
                                <li key={idx} className="p-2 rounded-xl bg-graphite/50 text-ghost/80 border border-ghost/10 flex items-start gap-2">
                                    <span className="text-alert-yellow">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-xs font-data text-ghost/40 italic">Not available</div>
                    )}
                </div>

                {/* Specific Verification Needs */}
                <div>
                    <h4 className="text-xs font-heading font-semibold text-ghost/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-alert-green" />
                        Verification Needs
                    </h4>
                    {needs.length > 0 ? (
                        <ul className="space-y-1.5 text-xs font-sora">
                            {needs.map((need, idx) => (
                                <li key={idx} className="p-2 rounded-xl bg-graphite/50 text-ghost/80 border border-ghost/10 flex items-start gap-2">
                                    <span className="text-alert-green">✓</span>
                                    <span>{need}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-xs font-data text-ghost/40 italic">Not available</div>
                    )}
                </div>
            </div>

            {/* Actionable Follow-up Question */}
            {ext.follow_up_question && (
                <div className="p-3.5 rounded-xl bg-alert-yellow/10 border border-alert-yellow/20 text-xs font-sora flex items-start gap-2.5">
                    <HelpCircle className="w-4 h-4 text-alert-yellow flex-shrink-0 mt-0.5" />
                    <div>
                        <strong className="text-alert-yellow uppercase tracking-wider text-[11px] block mb-0.5">
                            AI Follow-Up Clarification Question
                        </strong>
                        <p className="text-ghost/90 italic">"{ext.follow_up_question}"</p>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Section D: Evidence Links & Conflicts Subcomponent
 */
export const EvidenceConflicts = ({ supportingReportIds, conflictingClaims, onTrackReportId }) => {
    const supportingIds = Array.isArray(supportingReportIds) ? supportingReportIds : [];
    const conflicts = Array.isArray(conflictingClaims) ? conflictingClaims : [];
    const [copiedId, setCopiedId] = useState(null);

    const handleCopy = (id) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="mb-6 space-y-4">
            {/* Supporting Corroborating Reports */}
            <div className="bg-void/60 rounded-2xl p-5 border border-ghost/10">
                <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-5 h-5 text-plasma" />
                    <h3 className="font-heading font-bold text-ghost text-base">
                        Corroborating Evidence Links
                    </h3>
                </div>
                <p className="text-ghost/50 text-xs font-sora mb-3">
                    Nearby ground and municipal reports cross-referenced by the database investigation tool.
                </p>

                {supportingIds.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {supportingIds.map((id, idx) => (
                            <div
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-graphite border border-plasma/20 text-xs font-data"
                            >
                                <span className="text-ghost/60">Report:</span>
                                <span className="text-plasma font-bold">{id.slice(0, 8)}...</span>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(id)}
                                    className="p-1 rounded hover:bg-void text-ghost/40 hover:text-ghost transition-colors"
                                    title="Copy full UUID"
                                >
                                    {copiedId === id ? <Check className="w-3 h-3 text-alert-green" /> : <Copy className="w-3 h-3" />}
                                </button>
                                {onTrackReportId && (
                                    <button
                                        type="button"
                                        onClick={() => onTrackReportId(id)}
                                        className="text-[10px] uppercase font-bold text-plasma hover:underline ml-1"
                                    >
                                        Track
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs font-data text-ghost/40 italic">
                        No corroborating reports referenced yet.
                    </p>
                )}
            </div>

            {/* Conflicting Claims Section */}
            <div className="bg-void/60 rounded-2xl p-5 border border-ghost/10">
                <div className="flex items-center gap-2 mb-2">
                    <GitCompare className="w-5 h-5 text-alert-orange" />
                    <h3 className="font-heading font-bold text-ghost text-base">
                        Preserved Conflicting Claims
                    </h3>
                </div>
                <p className="text-ghost/50 text-xs font-sora mb-3">
                    Discrepancies identified between eyewitness statements and official status feeds:
                </p>

                {conflicts.length > 0 ? (
                    <div className="space-y-3">
                        {conflicts.map((conf, idx) => (
                            <div
                                key={idx}
                                className="p-4 rounded-xl bg-graphite/60 border border-alert-orange/30 text-xs font-sora space-y-2"
                            >
                                <div className="text-alert-orange font-bold font-heading text-xs uppercase flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>Conflict Discrepancy #{idx + 1}</span>
                                </div>
                                <p className="text-ghost/90 font-medium">
                                    {conf.conflict_summary || 'Identified statement discrepancy.'}
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-data text-[11px]">
                                    <div className="p-2.5 rounded-lg bg-void/70 border border-ghost/10">
                                        <span className="text-ghost/40 block mb-0.5">Claim A ({conf.source_report_id_a?.slice(0, 8) || 'Source A'}):</span>
                                        <span className="text-ghost/80 font-sora">{conf.claim_a}</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-void/70 border border-ghost/10">
                                        <span className="text-ghost/40 block mb-0.5">Claim B ({conf.source_report_id_b?.slice(0, 8) || 'Source B'}):</span>
                                        <span className="text-ghost/80 font-sora">{conf.claim_b}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs font-data text-ghost/40 italic">
                        No conflicting ground claims identified across nearby incidents.
                    </p>
                )}
            </div>
        </div>
    );
};

/**
 * Section E: AI Recommended Next Steps & Proposed Task Subcomponent
 */
export const RecommendedActions = ({ recommendedNextStep, proposedResponseTask }) => {
    const task = proposedResponseTask || {};
    const taskStatus = getTaskStatusBadge(task.status);

    return (
        <div className="bg-void/80 rounded-2xl p-5 md:p-6 border border-plasma/20 space-y-5">
            {/* Recommended Next Step */}
            <div>
                <h4 className="text-xs font-heading font-semibold text-plasma uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ArrowRight className="w-4 h-4" />
                    AI Recommended Next Step
                </h4>
                <p className="text-ghost/90 font-sora text-sm leading-relaxed bg-graphite/70 p-4 rounded-xl border border-ghost/10">
                    {recommendedNextStep || 'Awaiting emergency operator triage.'}
                </p>
            </div>

            {/* Proposed Response Task */}
            {task.task_title && (
                <div className="p-4 md:p-5 rounded-2xl bg-graphite border border-ghost/15 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-ghost/10">
                        <div>
                            <span className="text-[10px] font-data text-ghost/40 uppercase block">
                                Proposed Operational Task
                            </span>
                            <h5 className="font-heading font-bold text-ghost text-sm md:text-base">
                                {task.task_title}
                            </h5>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-data font-bold border ${taskStatus.classes}`}>
                            {taskStatus.label}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-data">
                        <div>
                            <span className="text-ghost/40 block mb-0.5">Priority Level</span>
                            <span className="text-alert-orange font-bold uppercase">{task.priority || 'medium'}</span>
                        </div>
                        <div>
                            <span className="text-ghost/40 block mb-0.5">Resource Needed</span>
                            <span className="text-plasma font-semibold">{task.resource_needed || 'Unspecified'}</span>
                        </div>
                    </div>

                    {task.suggested_action && (
                        <div className="text-xs font-sora text-ghost/80 pt-1">
                            <span className="text-ghost/40 font-data block mb-0.5">Suggested Action:</span>
                            <p className="bg-void/50 p-3 rounded-xl border border-ghost/10 leading-relaxed">
                                {task.suggested_action}
                            </p>
                        </div>
                    )}

                    {/* Strict Governance / Civilian Notice */}
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-void/80 border border-alert-yellow/20 text-xs font-sora text-ghost/70">
                        <Lock className="w-4 h-4 text-alert-yellow flex-shrink-0 mt-0.5" />
                        <div>
                            <strong className="text-alert-yellow block mb-0.5">
                                Civilian View Restriction Notice
                            </strong>
                            Proposed response tasks generated by Gemma 4 require human verification and dispatch approval by emergency response coordinators. Civilians cannot approve, reject, or dispatch rescue resources.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Main GemmaAssessmentViewer Component
 */
export const GemmaAssessmentViewer = ({ report, assessments = [], onTrackReportId }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Empty state: No assessments exist
    if (!assessments || assessments.length === 0) {
        return (
            <div className="bg-graphite rounded-3xl p-6 md:p-8 border border-ghost/10 text-center space-y-3">
                <Brain className="w-10 h-10 text-ghost/20 mx-auto" />
                <h3 className="font-heading font-semibold text-ghost text-base">
                    No AI Assessment Available Yet
                </h3>
                <p className="text-ghost/50 text-xs font-sora max-w-md mx-auto">
                    This incident is logged in the crisis ledger and queued for Gemma 4 evidence extraction and regional cross-referencing.
                </p>
            </div>
        );
    }

    const activeAssessment = assessments[selectedIndex] || assessments[0];

    return (
        <div className="space-y-6">
            {/* Section A: Overview */}
            <AssessmentOverview
                report={report}
                assessment={activeAssessment}
                assessments={assessments}
                selectedIndex={selectedIndex}
                onSelectIndex={setSelectedIndex}
            />

            {/* Section B: Claims vs Observed Evidence */}
            <ClaimsVsEvidence
                structuredExtraction={activeAssessment.structured_extraction}
            />

            {/* Section C: Missing Information & Ground Verification */}
            <VerificationChecklist
                structuredExtraction={activeAssessment.structured_extraction}
                missingOrOutdatedInfo={activeAssessment.missing_or_outdated_info}
            />

            {/* Section D: Evidence Links & Conflicts */}
            <EvidenceConflicts
                supportingReportIds={activeAssessment.supporting_report_ids}
                conflictingClaims={activeAssessment.conflicting_claims}
                onTrackReportId={onTrackReportId}
            />

            {/* Section E: Recommended Actions & Task Governance */}
            <RecommendedActions
                recommendedNextStep={activeAssessment.recommended_next_step}
                proposedResponseTask={activeAssessment.proposed_response_task}
            />
        </div>
    );
};

export default GemmaAssessmentViewer;
