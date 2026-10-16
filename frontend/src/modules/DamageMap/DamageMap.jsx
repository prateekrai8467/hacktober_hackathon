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

const DamageMap = () => {
    const mapRef = useRef(null);
    const containerRef = useRef(null);
    const layerGrpRef = useRef(null);
    const { activeEventId, events, analysisData } = useStore();

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

        return () => {
            if (mapRef.current) mapRef.current.remove();
        };
    }, []);

    // Render Buildings overlay
    useEffect(() => {
        if (!activeEventId || !mapRef.current || !events.length) return;

        const event = events.find(e => e.id === activeEventId);
        if (event && event.lat && event.lon) {
            // Only fly if we are far away to prevent jitter on data load
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
};

export default DamageMap;
