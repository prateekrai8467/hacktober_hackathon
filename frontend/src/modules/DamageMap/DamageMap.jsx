import React, { useEffect, useRef } from 'react';
import { useStore } from '../../store';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leafet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

/**
 * DamageMap — Full-bleed Leaflet map with building damage GeoJSON overlay.
 * Exposes mapRef via forwardRef so GroundTruthLayer can attach markers.
 */
const DamageMap = React.forwardRef((props, ref) => {
    const mapRef = useRef(null);
    const containerRef = useRef(null);
    const layerGrpRef = useRef(null);
    const { activeEventId, events, analysisData } = useStore();

    // Expose mapRef to parent
    useEffect(() => {
        if (ref) {
            ref.current = mapRef.current;
        }
    });

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize map
        mapRef.current = L.map(containerRef.current, {
            center: [20, 0],
            zoom: 3,
            zoomControl: false,
            attributionControl: false
        });

        // Dark Vapor theme tiles (CartoDB Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
        }).addTo(mapRef.current);

        // Add zoom control top right
        L.control.zoom({ position: 'topright' }).addTo(mapRef.current);

        layerGrpRef.current = L.layerGroup().addTo(mapRef.current);

        if (ref) {
            ref.current = mapRef.current;
        }

        return () => {
            if (mapRef.current) mapRef.current.remove();
        };
    }, []);

    // Render event markers for all active events
    useEffect(() => {
        if (!mapRef.current || !events.length) return;

        // Add event location markers
        const eventMarkers = L.layerGroup();
        events.forEach(ev => {
            if (!ev.lat || !ev.lon) return;

            const severityColor = ev.severity === 'red' ? '#FF3B30' :
                                  ev.severity === 'orange' ? '#FF9500' : '#34C759';

            const marker = L.circleMarker([ev.lat, ev.lon], {
                radius: activeEventId === ev.id ? 12 : 7,
                color: severityColor,
                fillColor: severityColor,
                fillOpacity: activeEventId === ev.id ? 0.8 : 0.4,
                weight: activeEventId === ev.id ? 3 : 1,
            });

            marker.bindTooltip(
                `<div style="font-family:'Sora',sans-serif;font-size:12px;font-weight:600;">${ev.title || 'Event'}</div>
                 <div style="font-family:'Fira Code',monospace;font-size:10px;color:${severityColor};text-transform:uppercase;">${ev.event_type} · ${ev.severity}</div>`,
                { direction: 'top', offset: [0, -10] }
            );

            marker.on('click', () => {
                useStore.getState().setActiveEventId(ev.id);
            });

            marker.addTo(eventMarkers);
        });

        eventMarkers.addTo(mapRef.current);

        return () => {
            eventMarkers.remove();
        };
    }, [events, activeEventId]);

    // Fly to active event + render building damage overlay
    useEffect(() => {
        if (!activeEventId || !mapRef.current || !events.length) return;

        const event = events.find(e => e.id === activeEventId);
        if (event && event.lat && event.lon) {
            mapRef.current.flyTo([event.lat, event.lon], 14, {
                duration: 1.5,
                easeLinearity: 0.25
            });

            if (layerGrpRef.current) {
                layerGrpRef.current.clearLayers();
            }

            if (analysisData && analysisData.buildings_geojson) {
                L.geoJSON(analysisData.buildings_geojson, {
                    style: (feature) => {
                        const level = feature.properties.damage_level;
                        let color = '#34C759'; // intact
                        if (level === 'destroyed') color = '#FF3B30';
                        else if (level === 'major') color = '#FF9500';
                        else if (level === 'minor') color = '#FFCC00';

                        return {
                            color: color,
                            weight: 1,
                            fillOpacity: 0.5
                        };
                    },
                    onEachFeature: (feature, layer) => {
                        const lvl = feature.properties.damage_level.toUpperCase();
                        layer.bindPopup(`<div class="font-sora text-sm"><b class="text-plasma">Building</b><br/>Status: ${lvl}</div>`);
                    }
                }).addTo(layerGrpRef.current);
            }
        }
    }, [activeEventId, events, analysisData]);

    return (
        <div ref={containerRef} className="absolute inset-0 bg-void z-0" />
    );
});

DamageMap.displayName = 'DamageMap';

export default DamageMap;
