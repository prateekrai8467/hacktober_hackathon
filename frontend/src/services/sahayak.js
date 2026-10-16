/**
 * Sahayak AI Crisis Intelligence API Service
 * 
 * Provides client methods to interact with the Sahayak AI backend endpoints.
 * Strictly adheres to Pydantic schemas (IncidentCreateRequest, IncidentResponse).
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
    // Sanitize and shape according to Pydantic IncidentCreateRequest
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

    return await response.json();
}

/**
 * Fetch an incident report's details and associated evidence assessments by ID.
 *
 * @param {string} reportId
 * @returns {Promise<Object>} ReportDetailResponse
 */
export async function getIncidentReportDetail(reportId) {
    const response = await fetch(`${API_BASE_URL}/sahayak/reports/${reportId}`, {
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch report details`);
    }

    return await response.json();
}
