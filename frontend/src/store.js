import { create } from 'zustand';

export const useStore = create((set) => ({
    // Core state
    activeEventId: null,
    isAnalyzing: false,

    // Data caches
    events: [],
    alerts: [],
    activeEventDetails: null,
    analysisData: null,
    wsConnected: false,

    // UI State
    timelineBaselinePassId: null,
    timelinePostPassId: null,
    sidebarFilter: 'ALL',
    isAlertPanelOpen: false,
    isChatOpen: false,

    // Actions
    setActiveEventId: (id) => {
        set({ activeEventId: id, analysisData: null });
        if (id) {
            useStore.getState().fetchIntelligenceData(id);
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

    // WebSocket Client
    connectWebSocket: () => {
        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/ws';
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("WebSocket Connected");
            set({ wsConnected: true });
        };

        ws.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === 'events_update') {
                    set({ events: payload.data.features || payload.data });
                } else if (payload.type === 'alerts_update') {
                    set({ alerts: payload.data });
                }
            } catch (err) {
                console.error("Failed to parse WS message", err);
            }
        };

        ws.onclose = () => {
            console.log("WebSocket Disconnected. Reconnecting in 5s...");
            set({ wsConnected: false });
            setTimeout(() => {
                useStore.getState().connectWebSocket();
            }, 5000);
        };

        ws.onerror = (err) => {
            console.error("WebSocket Error:", err);
            ws.close();
        };
    },

    // REST API Actions
    fetchIntelligenceData: async (eventId) => {
        try {
            const url = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            // 1. Get latest analysis for this event
            const analysesRes = await fetch(`${url}/satellite/analyses/${eventId}`);
            const analyses = await analysesRes.json();

            if (!analyses || analyses.length === 0) {
                set({ analysisData: null });
                return;
            }

            const latestAnalysis = analyses[0];

            // 2. Fetch full intelligence report for that analysis
            const intelRes = await fetch(`${url}/intelligence/${latestAnalysis.id}`);
            const intelData = await intelRes.json();

            // 3. Fetch building GeoJSON directly
            const bldRes = await fetch(`${url}/intelligence/buildings/${eventId}`);
            const buildings = await bldRes.json();

            set({
                analysisData: {
                    ...intelData,
                    buildings_geojson: buildings
                }
            });

        } catch (err) {
            console.error("Failed to fetch intelligence data", err);
            set({ analysisData: null });
        }
    }
}));
