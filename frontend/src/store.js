import { create } from 'zustand';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const useStore = create((set, get) => ({
    // Core state
    activeEventId: null,
    isAnalyzing: false,

    // Data caches
    events: [],
    alerts: [],
    activeEventDetails: null,
    analysisData: null,
    wsConnected: false,

    // Ground Truth data
    groundTruthReports: null,
    groundTruthStats: null,

    // AI Report data
    aiReport: null,
    aiReportLoading: false,

    // System health
    systemHealth: null,

    // UI State
    timelineBaselinePassId: null,
    timelinePostPassId: null,
    sidebarFilter: 'ALL',
    isAlertPanelOpen: false,
    isChatOpen: false,

    // Actions
    setActiveEventId: (id) => {
        set({ activeEventId: id, analysisData: null, groundTruthReports: null, groundTruthStats: null, aiReport: null });
        if (id) {
            get().fetchIntelligenceData(id);
            get().fetchGroundTruth(id);
        }
    },
    setAnalyzing: (status) => set({ isAnalyzing: status }),
    setEvents: (events) => set({ events }),
    setActiveEventDetails: (details) => set({ activeEventDetails: details }),
    setAnalysisData: (data) => set({ analysisData: data }),
    setTimelinePasses: (baseline, post) => set({ timelineBaselinePassId: baseline, timelinePostPassId: post }),
    setSidebarFilter: (filter) => set({ sidebarFilter: filter }),
    toggleAlertPanel: () => set((state) => ({ isAlertPanelOpen: !state.isAlertPanelOpen })),
    toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),

    // ─── REST: Fetch events (fallback when WS is slow) ───
    fetchEvents: async () => {
        try {
            const res = await fetch(`${API_URL}/events`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const features = data.features || [];
            // Normalize: extract properties for flat access
            const normalized = features.map(f => ({
                id: f.properties?.id || f.id,
                ...f.properties,
                lat: f.geometry?.coordinates?.[1] || f.properties?.lat,
                lon: f.geometry?.coordinates?.[0] || f.properties?.lon,
            }));
            set({ events: normalized });
            return normalized;
        } catch (err) {
            console.error("[Store] Failed to fetch events via REST:", err);
            return [];
        }
    },

    // ─── REST: Ground Truth reports for an event ───
    fetchGroundTruth: async (eventId) => {
        try {
            const [reportsRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/ground-truth/submissions/${eventId}`),
                fetch(`${API_URL}/ground-truth/stats/${eventId}`)
            ]);
            if (reportsRes.ok) {
                const reports = await reportsRes.json();
                set({ groundTruthReports: reports });
            }
            if (statsRes.ok) {
                const stats = await statsRes.json();
                set({ groundTruthStats: stats });
            }
        } catch (err) {
            console.error("[Store] Ground truth fetch failed:", err);
        }
    },

    // ─── REST: Generate AI situation report ───
    generateAIReport: async (eventId) => {
        set({ aiReportLoading: true, aiReport: null });
        try {
            const res = await fetch(`${API_URL}/reports/generate/${eventId}`, { method: 'POST' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            set({ aiReport: data, aiReportLoading: false });
            return data;
        } catch (err) {
            console.error("[Store] AI report generation failed:", err);
            set({ aiReportLoading: false });
            return null;
        }
    },

    // ─── REST: System diagnostics ───
    fetchSystemHealth: async () => {
        try {
            const res = await fetch(`${API_URL}/system/diagnostics`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            set({ systemHealth: data });
            return data;
        } catch (err) {
            console.error("[Store] System health check failed:", err);
            return null;
        }
    },

    // WebSocket Client with exponential backoff
    connectWebSocket: () => {
        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/ws';
        let retryDelay = 2000;
        const maxRetry = 30000;

        const connect = () => {
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log("[WS] Connected");
                set({ wsConnected: true });
                retryDelay = 2000; // Reset backoff on success
            };

            ws.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    if (payload.type === 'events_update') {
                        const features = payload.data?.features || payload.data || [];
                        const normalized = features.map(f => {
                            if (f.properties) {
                                return {
                                    id: f.properties?.id || f.id,
                                    ...f.properties,
                                    lat: f.geometry?.coordinates?.[1] || f.properties?.lat,
                                    lon: f.geometry?.coordinates?.[0] || f.properties?.lon,
                                };
                            }
                            return f;
                        });
                        set({ events: normalized });
                    } else if (payload.type === 'alerts_update') {
                        set({ alerts: payload.data });
                    }
                } catch (err) {
                    console.error("[WS] Parse error:", err);
                }
            };

            ws.onclose = () => {
                console.log(`[WS] Disconnected. Retrying in ${retryDelay / 1000}s...`);
                set({ wsConnected: false });
                setTimeout(() => {
                    retryDelay = Math.min(retryDelay * 1.5, maxRetry);
                    connect();
                }, retryDelay);
            };

            ws.onerror = (err) => {
                console.error("[WS] Error:", err);
                ws.close();
            };
        };

        connect();

        // Also do an immediate REST fetch so UI doesn't wait for WS
        get().fetchEvents();
    },

    // REST API Actions
    fetchIntelligenceData: async (eventId) => {
        try {
            // 1. Get latest analysis for this event
            const analysesRes = await fetch(`${API_URL}/satellite/analyses/${eventId}`);
            const analyses = await analysesRes.json();

            if (!analyses || analyses.length === 0) {
                set({ analysisData: null });
                return;
            }

            const latestAnalysis = analyses[0];

            // 2. Fetch full intelligence report for that analysis
            const intelRes = await fetch(`${API_URL}/intelligence/${latestAnalysis.id}`);
            const intelData = await intelRes.json();

            // 3. Fetch building GeoJSON directly
            const bldRes = await fetch(`${API_URL}/intelligence/buildings/${eventId}`);
            const buildings = await bldRes.json();

            set({
                analysisData: {
                    ...intelData,
                    buildings_geojson: buildings
                }
            });

        } catch (err) {
            console.error("[Store] Failed to fetch intelligence data:", err);
            set({ analysisData: null });
        }
    }
}));
