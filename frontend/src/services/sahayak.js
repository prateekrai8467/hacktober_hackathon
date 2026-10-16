/**
 * Sahayak AI Crisis Intelligence API Service
 * 
 * Provides client methods to interact with the Sahayak AI backend endpoints.
 * Strictly adheres to Pydantic schemas (IncidentCreateRequest, IncidentResponse, ReportDetailResponse).
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const TRACKED_IDS_STORAGE_KEY = 'sahayak_device_tracked_report_ids';

/**
 * Submit a civilian disaster incident report to the Sahayak crisis intelligence intake.
 *
 * @param {Object} reportData
 * @param {string} [reportData.title] - Optional title or brief summary
 * @param {string} reportData.description - Full incident description (min 5 chars)
 * @param {string} reportData.location_name - Location, landmark or district (min 2 chars)
 * @param {string} [reportData.category='other'] - Category (flood, earthquake, landslide, cyclone, fire, medical, other)
 * @param {string} [reportData.severity_claimed='medium'] - Severity (low, medium, high, critical)
 * @param {number|string} [reportData.lat] - Latitude (-90 to 90)
 * @param {number|string} [reportData.lon] - Longitude (-180 to 180)
 * @param {string} [reportData.photo_url] - Optional image URL
 * @param {Object} [reportData.additional_info] - Structured metadata
 * @returns {Promise<Object>} IncidentResponse from backend
 */
export async function submitIncidentReport(reportData) {
    const payload = {
        title: reportData.title && reportData.title.trim() ? reportData.title.trim() : null,
        description: reportData.description ? reportData.description.trim() : '',
        location_name: reportData.location_name ? reportData.location_name.trim() : '',
        category: reportData.category || 'other',
        severity_claimed: reportData.severity_claimed || 'medium',
        photo_url: reportData.photo_url && reportData.photo_url.trim() ? reportData.photo_url.trim() : null,
        additional_info: reportData.additional_info || {},
        is_synthetic: false
    };

    if (reportData.lat !== undefined && reportData.lat !== null && reportData.lat !== '') {
        const parsedLat = typeof reportData.lat === 'number' ? reportData.lat : parseFloat(reportData.lat);
        if (!isNaN(parsedLat)) {
            payload.lat = parsedLat;
        }
    }

    if (reportData.lon !== undefined && reportData.lon !== null && reportData.lon !== '') {
        const parsedLon = typeof reportData.lon === 'number' ? reportData.lon : parseFloat(reportData.lon);
        if (!isNaN(parsedLon)) {
            payload.lon = parsedLon;
        }
    }

    const response = await fetch(`${API_BASE_URL}/sahayak/reports`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        let errorDetail = `HTTP ${response.status}: Failed to submit incident report`;
        try {
            const errorJson = await response.json();
            if (errorJson && errorJson.detail) {
                if (Array.isArray(errorJson.detail)) {
                    errorDetail = errorJson.detail
                        .map(err => err.msg || `${err.loc?.join('.')}: ${err.type}`)
                        .join(', ');
                } else {
                    errorDetail = errorJson.detail;
                }
            }
        } catch {
            // Keep status code message
        }
        throw new Error(errorDetail);
    }

    const createdReport = await response.json();
    
    // Automatically record newly submitted ID in device storage
    if (createdReport && createdReport.id) {
        addTrackedReportId(createdReport.id);
    }

    return createdReport;
}

/**
 * Fetch an incident report's details and associated evidence assessments by ID.
 *
 * @param {string} reportId
 * @returns {Promise<Object>} ReportDetailResponse { report, assessments, tool_activities, reviews }
 */
export async function getIncidentReportDetail(reportId) {
    if (!reportId || typeof reportId !== 'string') {
        throw new Error('A valid Report ID string is required');
    }

    const cleanId = reportId.trim();
    const response = await fetch(`${API_BASE_URL}/sahayak/reports/${encodeURIComponent(cleanId)}`, {
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`Report ID '${cleanId}' was not found in the crisis ledger.`);
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch report details`);
    }

    return await response.json();
}

/**
 * Fetch a list of incident reports with optional filtering.
 *
 * @param {Object} [filters]
 * @param {string} [filters.category]
 * @param {string} [filters.status]
 * @param {number} [filters.limit=50]
 * @returns {Promise<Array>} List of IncidentResponse
 */
export async function listIncidentReports(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/sahayak/reports${qs}`, {
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to list incident reports`);
    }

    return await response.json();
}

// --------------------------------------------------------------------
// DEVICE-SPECIFIC PRIVACY-PRESERVING REPORT ID TRACKING (localStorage)
// Storing IDs only — NO sensitive descriptions, photos or coordinates.
// --------------------------------------------------------------------

/**
 * Retrieve the list of report UUIDs saved on this device.
 * @returns {string[]}
 */
export function getTrackedReportIds() {
    try {
        const stored = localStorage.getItem(TRACKED_IDS_STORAGE_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
            return parsed.filter(id => typeof id === 'string' && id.trim().length > 0);
        }
        return [];
    } catch (e) {
        console.warn('Failed to read tracked report IDs from localStorage:', e);
        return [];
    }
}

/**
 * Add a report UUID to this device's tracked list.
 * @param {string} reportId
 */
export function addTrackedReportId(reportId) {
    if (!reportId || typeof reportId !== 'string') return;
    const cleanId = reportId.trim();
    try {
        const existing = getTrackedReportIds();
        if (!existing.includes(cleanId)) {
            const updated = [cleanId, ...existing].slice(0, 50); // Keep latest 50
            localStorage.setItem(TRACKED_IDS_STORAGE_KEY, JSON.stringify(updated));
        }
    } catch (e) {
        console.warn('Failed to save tracked report ID to localStorage:', e);
    }
}

/**
 * Remove a report UUID from this device's tracked list.
 * @param {string} reportId
 */
export function removeTrackedReportId(reportId) {
    if (!reportId) return;
    try {
        const existing = getTrackedReportIds();
        const updated = existing.filter(id => id !== reportId.trim());
        localStorage.setItem(TRACKED_IDS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.warn('Failed to remove tracked report ID from localStorage:', e);
    }
}

/**
 * Clear all tracked report IDs from this device.
 */
export function clearTrackedReportIds() {
    try {
        localStorage.removeItem(TRACKED_IDS_STORAGE_KEY);
    } catch (e) {
        console.warn('Failed to clear tracked report IDs from localStorage:', e);
    }
}
