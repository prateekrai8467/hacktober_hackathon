import React, { useState } from 'react';
import {
    AlertTriangle,
    ShieldAlert,
    MapPin,
    Camera,
    Send,
    CheckCircle2,
    Loader2,
    RefreshCw,
    Copy,
    Check,
    Navigation,
    Info
} from 'lucide-react';
import { submitIncidentReport } from '../../services/sahayak';

const CATEGORIES = [
    { value: 'flood', label: 'Flood / Waterlogging' },
    { value: 'earthquake', label: 'Earthquake' },
    { value: 'landslide', label: 'Landslide / Rockfall' },
    { value: 'cyclone', label: 'Cyclone / Storm' },
    { value: 'fire', label: 'Wildfire / Building Fire' },
    { value: 'medical', label: 'Medical Emergency' },
    { value: 'other', label: 'Other Disaster / Hazard' }
];

const SEVERITIES = [
    { value: 'low', label: 'Low', desc: 'Minor impact, monitoring', color: 'border-alert-green/40 text-alert-green bg-alert-green/10' },
    { value: 'medium', label: 'Medium', desc: 'Moderate disruption / assistance needed', color: 'border-alert-yellow/40 text-alert-yellow bg-alert-yellow/10' },
    { value: 'high', label: 'High', desc: 'Severe danger, road blocked, property damage', color: 'border-alert-orange/40 text-alert-orange bg-alert-orange/10' },
    { value: 'critical', label: 'Critical', desc: 'Immediate threat to life, persons trapped', color: 'border-alert-red/40 text-alert-red bg-alert-red/10' }
];

export const IncidentReportForm = ({ onReportSubmitted }) => {
    // Form fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('flood');
    const [severity, setSeverity] = useState('medium');
    const [locationName, setLocationName] = useState('');
    const [lat, setLat] = useState('');
    const [lon, setLon] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');

    // UI state
    const [isLocating, setIsLocating] = useState(false);
    const [locationMessage, setLocationMessage] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submittedReport, setSubmittedReport] = useState(null);
    const [copiedId, setCopiedId] = useState(false);

    // Fetch user geolocation
    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            setLocationMessage({ type: 'error', text: 'Geolocation is not supported by your browser.' });
            return;
        }

        setIsLocating(true);
        setLocationMessage(null);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const detectedLat = Number(pos.coords.latitude.toFixed(6));
                const detectedLon = Number(pos.coords.longitude.toFixed(6));
                setLat(detectedLat.toString());
                setLon(detectedLon.toString());
                setIsLocating(false);
                setLocationMessage({
                    type: 'success',
                    text: `GPS coordinates captured (accuracy ~${Math.round(pos.coords.accuracy)}m)`
                });
            },
            (err) => {
                setIsLocating(false);
                setLocationMessage({
                    type: 'error',
                    text: `Could not retrieve GPS: ${err.message}. You may enter coordinates manually.`
                });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    };

    // Client-side validation
    const validateForm = () => {
        const errors = {};

        if (!description.trim() || description.trim().length < 5) {
            errors.description = 'Incident description must be at least 5 characters long.';
        }

        if (!locationName.trim() || locationName.trim().length < 2) {
            errors.locationName = 'Location or landmark must be at least 2 characters long.';
        }

        if (lat !== '' && (isNaN(Number(lat)) || Number(lat) < -90 || Number(lat) > 90)) {
            errors.lat = 'Latitude must be a valid number between -90 and 90.';
        }

        if (lon !== '' && (isNaN(Number(lon)) || Number(lon) < -180 || Number(lon) > 180)) {
            errors.lon = 'Longitude must be a valid number between -180 and 180.';
        }

        if (photoUrl.trim()) {
            try {
                new URL(photoUrl.trim());
            } catch {
                errors.photoUrl = 'Please enter a valid HTTP/HTTPS image URL.';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError(null);

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const reportData = {
                title: title.trim() || null,
                description: description.trim(),
                location_name: locationName.trim(),
                category,
                severity_claimed: severity,
                photo_url: photoUrl.trim() || null,
                lat: lat !== '' ? Number(lat) : null,
                lon: lon !== '' ? Number(lon) : null,
                additional_info: {
                    source: 'civilian_dashboard_web',
                    browser_timestamp: new Date().toISOString()
                }
            };

            const response = await submitIncidentReport(reportData);
            setSubmittedReport(response);

            if (onReportSubmitted) {
                onReportSubmitted(response);
            }
        } catch (err) {
            setSubmitError(err.message || 'An unexpected error occurred while communicating with the Sahayak AI API.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset for another submission
    const handleReset = () => {
        setTitle('');
        setDescription('');
        setCategory('flood');
        setSeverity('medium');
        setLocationName('');
        setLat('');
        setLon('');
        setPhotoUrl('');
        setValidationErrors({});
        setSubmitError(null);
        setSubmittedReport(null);
        setLocationMessage(null);
        setCopiedId(false);
    };

    const handleCopyId = () => {
        if (submittedReport?.id) {
            navigator.clipboard.writeText(submittedReport.id);
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2500);
        }
    };

    // -------------------------------------------------------------
    // SUCCESS CONFIRMATION VIEW
    // -------------------------------------------------------------
    if (submittedReport) {
        return (
            <div className="bg-graphite rounded-3xl p-6 md:p-8 border border-plasma/30 shadow-glow transition-all">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-alert-green/20 border border-alert-green/30 text-alert-green flex-shrink-0">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-data bg-alert-green/10 text-alert-green border border-alert-green/20 mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-alert-green animate-pulse" />
                            INTAKE CONFIRMED
                        </div>
                        <h3 className="text-xl md:text-2xl font-heading font-bold text-ghost">
                            Incident Report Recorded
                        </h3>
                        <p className="text-ghost/60 font-sora text-sm mt-1">
                            Your ground observation has been immutably logged into the Sahayak crisis intelligence ledger.
                        </p>
                    </div>
                </div>

                <div className="bg-void/80 rounded-2xl p-5 border border-ghost/10 space-y-3 mb-6 font-data text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-ghost/10">
                        <span className="text-ghost/50 text-xs uppercase tracking-wider">Report Identifier (UUID)</span>
                        <div className="flex items-center gap-2">
                            <code className="text-plasma font-bold text-xs sm:text-sm break-all">
                                {submittedReport.id}
                            </code>
                            <button
                                type="button"
                                onClick={handleCopyId}
                                className="p-1 rounded hover:bg-graphite text-ghost/70 hover:text-ghost transition-colors"
                                title="Copy ID"
                            >
                                {copiedId ? <Check className="w-4 h-4 text-alert-green" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                        <div>
                            <span className="text-ghost/50 block mb-0.5">Category</span>
                            <span className="text-ghost font-semibold uppercase">{submittedReport.category}</span>
                        </div>
                        <div>
                            <span className="text-ghost/50 block mb-0.5">Severity</span>
                            <span className="text-alert-orange font-semibold uppercase">{submittedReport.severity_claimed}</span>
                        </div>
                        <div>
                            <span className="text-ghost/50 block mb-0.5">Intake Status</span>
                            <span className="text-plasma font-semibold uppercase">{submittedReport.status}</span>
                        </div>
                        <div>
                            <span className="text-ghost/50 block mb-0.5">Recorded At</span>
                            <span className="text-ghost/80">
                                {submittedReport.created_at ? new Date(submittedReport.created_at).toLocaleTimeString() : 'Just now'}
                            </span>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-ghost/10 text-xs">
                        <span className="text-ghost/50 block mb-0.5">Reported Location</span>
                        <span className="text-ghost">{submittedReport.location_name}</span>
                        {submittedReport.lat && submittedReport.lon && (
                            <span className="text-ghost/60 ml-2">
                                ({Number(submittedReport.lat).toFixed(4)}°, {Number(submittedReport.lon).toFixed(4)}°)
                            </span>
                        )}
                    </div>
                </div>

                <div className="bg-alert-orange/10 border border-alert-orange/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
                    <Info className="w-5 h-5 text-alert-orange flex-shrink-0 mt-0.5" />
                    <p className="text-ghost/80 text-xs font-sora leading-relaxed">
                        <strong className="text-ghost">Next Steps:</strong> The Sahayak intelligence engine is correlating this report against regional feeds, historical incidents, and available resources. A civil defense operator will review proposed actions before dispatch.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleReset}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-plasma/20 hover:bg-plasma/30 border border-plasma/40 text-plasma font-heading font-semibold text-sm transition-all hover:shadow-glow cursor-pointer"
                >
                    <RefreshCw className="w-4 h-4" />
                    Submit Another Report
                </button>
            </div>
        );
    }

    // -------------------------------------------------------------
    // INCIDENT REPORTING FORM VIEW
    // -------------------------------------------------------------
    return (
        <div className="bg-graphite rounded-3xl p-6 md:p-8 border border-plasma/20 shadow-float">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert className="w-6 h-6 text-plasma" />
                        <h2 className="text-xl md:text-2xl font-heading font-bold text-ghost">
                            Report Crisis Incident
                        </h2>
                    </div>
                    <p className="text-ghost/60 font-sora text-sm">
                        Submit real-time ground truth observations directly to the Sahayak crisis intelligence system.
                    </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-data bg-plasma/10 text-plasma border border-plasma/20">
                    <span className="w-2 h-2 rounded-full bg-plasma animate-ping" />
                    INTAKE ACTIVE
                </div>
            </div>

            {/* Emergency Services Notice (Requirement 5) */}
            <div className="bg-alert-red/10 border border-alert-red/30 rounded-2xl p-4 mb-6 flex items-start gap-3 text-xs font-sora leading-relaxed text-ghost/90">
                <AlertTriangle className="w-5 h-5 text-alert-red flex-shrink-0 mt-0.5" />
                <div>
                    <strong className="text-alert-red uppercase tracking-wider block mb-0.5">
                        Emergency Notice — Not a 911 / Direct Dispatch Replacement
                    </strong>
                    Submitting this form records evidence for crisis intelligence analysts and automated disaster correlation.
                    It <span className="underline font-bold text-ghost">does not automatically dispatch</span> local emergency police, fire, or ambulance services. If you or someone nearby is in immediate life-threatening danger, contact your official emergency phone number immediately.
                </div>
            </div>

            {/* Network / Submission Error Banner */}
            {submitError && (
                <div className="bg-alert-red/15 border border-alert-red/40 rounded-2xl p-4 mb-6 flex items-start gap-3 text-sm text-ghost font-sora">
                    <AlertTriangle className="w-5 h-5 text-alert-red flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <strong className="text-alert-red block mb-0.5">Submission Error</strong>
                        <p className="text-ghost/80 text-xs">{submitError}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSubmitError(null)}
                        className="text-ghost/40 hover:text-ghost text-xs underline cursor-pointer"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Incident Title & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-heading font-semibold text-ghost/80 mb-1.5">
                            Incident Title <span className="text-ghost/40 font-normal">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Flash Flood along River Causeway"
                            disabled={isSubmitting}
                            className="w-full bg-void rounded-xl border border-ghost/15 px-4 py-2.5 text-sm text-ghost placeholder:text-ghost/30 focus:outline-none focus:border-plasma focus:ring-1 focus:ring-plasma font-sora disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-heading font-semibold text-ghost/80 mb-1.5">
                            Disaster Category <span className="text-alert-red">*</span>
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full bg-void rounded-xl border border-ghost/15 px-4 py-2.5 text-sm text-ghost focus:outline-none focus:border-plasma focus:ring-1 focus:ring-plasma font-sora disabled:opacity-50"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value} className="bg-graphite text-ghost">
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 2. Reported Severity Level */}
                <div>
                    <label className="block text-xs font-heading font-semibold text-ghost/80 mb-2">
                        Reported Severity Level <span className="text-alert-red">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {SEVERITIES.map(sev => {
                            const isSelected = severity === sev.value;
                            return (
                                <button
                                    key={sev.value}
                                    type="button"
                                    onClick={() => setSeverity(sev.value)}
                                    disabled={isSubmitting}
                                    className={`text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                                        isSelected
                                            ? `${sev.color} ring-1 ring-ghost/40`
                                            : 'border-ghost/10 bg-void/50 text-ghost/60 hover:border-ghost/20'
                                    } disabled:opacity-50`}
                                >
                                    <div className="font-heading font-bold text-xs uppercase">{sev.label}</div>
                                    <div className="text-[11px] font-sora opacity-75 mt-0.5 line-clamp-2">{sev.desc}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Location / Landmark & GPS Coordinates */}
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-heading font-semibold text-ghost/80 mb-1.5">
                            Location or Landmark <span className="text-alert-red">*</span>
                        </label>
                        <div className="relative">
                            <MapPin className="w-4 h-4 text-ghost/40 absolute left-3.5 top-3 pointer-events-none" />
                            <input
                                type="text"
                                value={locationName}
                                onChange={(e) => {
                                    setLocationName(e.target.value);
                                    if (validationErrors.locationName) {
                                        setValidationErrors(prev => ({ ...prev, locationName: null }));
                                    }
                                }}
                                placeholder="e.g., Gandhi Setu, North Causeway, Patna"
                                disabled={isSubmitting}
                                className={`w-full bg-void rounded-xl border ${
                                    validationErrors.locationName ? 'border-alert-red' : 'border-ghost/15'
                                } pl-10 pr-4 py-2.5 text-sm text-ghost placeholder:text-ghost/30 focus:outline-none focus:border-plasma focus:ring-1 focus:ring-plasma font-sora disabled:opacity-50`}
                            />
                        </div>
                        {validationErrors.locationName && (
                            <p className="text-alert-red text-xs mt-1 font-sora">{validationErrors.locationName}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-heading font-semibold text-ghost/70 mb-1">
                                Latitude <span className="text-ghost/40 font-normal">(-90 to 90)</span>
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={lat}
                                onChange={(e) => {
                                    setLat(e.target.value);
                                    if (validationErrors.lat) setValidationErrors(prev => ({ ...prev, lat: null }));
                                }}
                                placeholder="e.g., 25.6120"
                                disabled={isSubmitting}
                                className={`w-full bg-void rounded-xl border ${
                                    validationErrors.lat ? 'border-alert-red' : 'border-ghost/15'
                                } px-3.5 py-2 text-xs text-ghost placeholder:text-ghost/30 focus:outline-none focus:border-plasma font-data disabled:opacity-50`}
                            />
                            {validationErrors.lat && (
                                <p className="text-alert-red text-xs mt-1 font-sora">{validationErrors.lat}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-heading font-semibold text-ghost/70 mb-1">
                                Longitude <span className="text-ghost/40 font-normal">(-180 to 180)</span>
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={lon}
                                onChange={(e) => {
                                    setLon(e.target.value);
                                    if (validationErrors.lon) setValidationErrors(prev => ({ ...prev, lon: null }));
                                }}
                                placeholder="e.g., 85.1432"
                                disabled={isSubmitting}
                                className={`w-full bg-void rounded-xl border ${
                                    validationErrors.lon ? 'border-alert-red' : 'border-ghost/15'
                                } px-3.5 py-2 text-xs text-ghost placeholder:text-ghost/30 focus:outline-none focus:border-plasma font-data disabled:opacity-50`}
                            />
                            {validationErrors.lon && (
                                <p className="text-alert-red text-xs mt-1 font-sora">{validationErrors.lon}</p>
                            )}
                        </div>
                    </div>

                    {/* Geolocation Button & Message */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <button
                            type="button"
                            onClick={handleDetectLocation}
                            disabled={isLocating || isSubmitting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ghost/5 hover:bg-ghost/10 border border-ghost/15 text-ghost/80 hover:text-ghost text-xs font-data transition-colors disabled:opacity-50 cursor-pointer w-fit"
                        >
                            {isLocating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-plasma" />
                            ) : (
                                <Navigation className="w-3.5 h-3.5 text-plasma" />
                            )}
                            {isLocating ? 'Acquiring GPS...' : 'Use My Current Location'}
                        </button>

                        {locationMessage && (
                            <span className={`text-xs font-sora ${
                                locationMessage.type === 'success' ? 'text-alert-green' : 'text-alert-orange'
                            }`}>
                                {locationMessage.text}
                            </span>
                        )}
                    </div>
                </div>

                {/* 4. Detailed Description */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-heading font-semibold text-ghost/80">
                            Detailed Description <span className="text-alert-red">*</span>
                        </label>
                        <span className={`text-xs font-data ${
                            description.trim().length >= 5 ? 'text-alert-green' : 'text-ghost/40'
                        }`}>
                            {description.trim().length} chars (min 5)
                        </span>
                    </div>
                    <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => {
                            setDescription(e.target.value);
                            if (validationErrors.description) {
                                setValidationErrors(prev => ({ ...prev, description: null }));
                            }
                        }}
                        placeholder="Describe exact conditions: flood water level, collapsed structures, trapped persons, road accessibility, hazardous materials, or medical needs..."
                        disabled={isSubmitting}
                        className={`w-full bg-void rounded-xl border ${
                            validationErrors.description ? 'border-alert-red' : 'border-ghost/15'
                        } px-4 py-2.5 text-sm text-ghost placeholder:text-ghost/30 focus:outline-none focus:border-plasma focus:ring-1 focus:ring-plasma font-sora leading-relaxed disabled:opacity-50`}
                    />
                    {validationErrors.description && (
                        <p className="text-alert-red text-xs mt-1 font-sora">{validationErrors.description}</p>
                    )}
                </div>

                {/* 5. Photograph URL (Optional) */}
                <div>
                    <label className="block text-xs font-heading font-semibold text-ghost/80 mb-1.5">
                        Photograph or Media URL <span className="text-ghost/40 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                        <Camera className="w-4 h-4 text-ghost/40 absolute left-3.5 top-3 pointer-events-none" />
                        <input
                            type="url"
                            value={photoUrl}
                            onChange={(e) => {
                                setPhotoUrl(e.target.value);
                                if (validationErrors.photoUrl) setValidationErrors(prev => ({ ...prev, photoUrl: null }));
                            }}
                            placeholder="https://example.com/photos/flood-damage-01.jpg"
                            disabled={isSubmitting}
                            className={`w-full bg-void rounded-xl border ${
                                validationErrors.photoUrl ? 'border-alert-red' : 'border-ghost/15'
                            } pl-10 pr-4 py-2.5 text-sm text-ghost placeholder:text-ghost/30 focus:outline-none focus:border-plasma focus:ring-1 focus:ring-plasma font-sora disabled:opacity-50`}
                        />
                    </div>
                    {validationErrors.photoUrl && (
                        <p className="text-alert-red text-xs mt-1 font-sora">{validationErrors.photoUrl}</p>
                    )}
                    {photoUrl.trim() && !validationErrors.photoUrl && (
                        <div className="mt-2 p-2 bg-void rounded-xl border border-ghost/10 w-fit max-w-xs">
                            <span className="text-[10px] text-ghost/40 uppercase font-data block mb-1">Image Preview</span>
                            <img
                                src={photoUrl.trim()}
                                alt="Incident preview"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                                className="max-h-32 rounded-lg object-cover"
                            />
                        </div>
                    )}
                </div>

                {/* 6. Submit Button */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-plasma hover:bg-plasma/90 text-void font-heading font-bold text-sm tracking-wide transition-all hover:shadow-glow disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin text-void" />
                                <span>Transmitting Incident to Sahayak AI...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 text-void" />
                                <span>Submit Incident Report</span>
                            </>
                        )}
                    </button>
                    <p className="text-center text-ghost/40 text-[11px] font-sora mt-2">
                        Reports are cryptographically ingested into the incident intake ledger.
                    </p>
                </div>
            </form>
        </div>
    );
};

export default IncidentReportForm;
