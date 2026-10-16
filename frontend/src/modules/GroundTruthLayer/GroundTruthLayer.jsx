import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import L from 'leaflet';

/**
 * GroundTruthLayer — Renders citizen-submitted field reports as map markers.
 * Connects to GET /api/ground-truth/submissions/:eventId and plots GeoJSON features
 * on the DamageMap Leaflet instance. Shows damage class coloring and photo popups.
 */

const DAMAGE_COLORS = {
    0: '#34C759', // Intact
    1: '#FFCC00', // Minor
    2: '#FF9500', // Major
    3: '#FF3B30', // Destroyed
};

const DAMAGE_LABELS = {
    0: 'Intact',
    1: 'Minor Damage',
    2: 'Major Damage',
    3: 'Destroyed',
};

const GroundTruthLayer = ({ mapRef }) => {
    const { activeEventId, groundTruthReports, groundTruthStats } = useStore();
    const [visible, setVisible] = useState(true);
    const [layerGroup] = useState(() => L.layerGroup());

    // Attach/detach layer group to map
    useEffect(() => {
        if (mapRef?.current && visible) {
            layerGroup.addTo(mapRef.current);
        }
        return () => {
            layerGroup.remove();
        };
    }, [mapRef, visible, layerGroup]);

    // Render ground truth markers
    useEffect(() => {
        layerGroup.clearLayers();

        if (!visible || !groundTruthReports?.features?.length) return;

        groundTruthReports.features.forEach(feature => {
            const { coordinates } = feature.geometry;
            const props = feature.properties;
            const color = DAMAGE_COLORS[props.damage_class] || '#7B61FF';
            const label = DAMAGE_LABELS[props.damage_class] || 'Unknown';

            const marker = L.circleMarker([coordinates[1], coordinates[0]], {
                radius: 8,
                color: color,
                fillColor: color,
                fillOpacity: 0.7,
                weight: 2,
            });

            // Build popup HTML
            const photoHtml = props.photo_url
                ? `<img src="${props.photo_url}" alt="Field photo" style="width:100%;max-height:120px;object-fit:cover;border-radius:8px;margin-bottom:6px;" />`
                : '';

            const disputedBadge = props.disputed
                ? '<span style="background:#FFCC00;color:#111;font-size:9px;padding:1px 6px;border-radius:4px;font-weight:bold;">DISPUTED</span>'
                : '';

            const agreementBadge = props.agreement
                ? '<span style="background:#34C759;color:#fff;font-size:9px;padding:1px 6px;border-radius:4px;">✓ Agrees w/ satellite</span>'
                : '<span style="background:#FF9500;color:#fff;font-size:9px;padding:1px 6px;border-radius:4px;">⚡ Differs from satellite</span>';

            marker.bindPopup(`
                <div style="font-family:'Sora',sans-serif;min-width:180px;">
                    ${photoHtml}
                    <div style="font-weight:600;font-size:13px;margin-bottom:4px;color:${color};">${label}</div>
                    ${props.damage_type ? `<div style="font-size:11px;color:#888;margin-bottom:4px;">${props.damage_type}</div>` : ''}
                    ${props.description ? `<div style="font-size:11px;color:#ccc;margin-bottom:6px;">"${props.description}"</div>` : ''}
                    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:4px;">
                        ${agreementBadge}
                        ${disputedBadge}
                    </div>
                    ${props.confidence ? `<div style="font-family:'Fira Code',monospace;font-size:10px;color:#7B61FF;">AI Confidence: ${(props.confidence * 100).toFixed(0)}%</div>` : ''}
                </div>
            `);

            marker.addTo(layerGroup);
        });
    }, [groundTruthReports, visible, layerGroup]);

    if (!activeEventId) return null;

    const totalReports = groundTruthStats?.total || groundTruthReports?.features?.length || 0;

    return (
        <div className="absolute top-4 left-4 z-[400]">
            <div className="bg-void/80 backdrop-blur-md border border-gray-700 px-3 py-2 rounded-xl flex items-center gap-3 shadow-float">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={visible}
                        onChange={(e) => setVisible(e.target.checked)}
                        className="w-4 h-4 rounded appearance-none border border-gray-500 checked:bg-plasma checked:border-plasma outline-none transition-colors 
              after:content-['✓'] after:text-white after:text-[10px] after:flex after:justify-center after:items-center after:h-full after:opacity-0 checked:after:opacity-100"
                    />
                    <span className="text-xs font-sora font-semibold text-ghost">
                        Field Reports ({totalReports})
                    </span>
                </label>

                <div className="flex gap-1 border-l border-gray-700 pl-3">
                    <div className="w-3 h-3 rounded-full bg-alert-red" title="Destroyed"></div>
                    <div className="w-3 h-3 rounded-full bg-alert-orange" title="Major"></div>
                    <div className="w-3 h-3 rounded-full bg-alert-yellow" title="Minor"></div>
                    <div className="w-3 h-3 rounded-full bg-alert-green" title="Intact"></div>
                </div>

                {groundTruthStats?.agreement_rate != null && (
                    <div className="border-l border-gray-700 pl-3 text-[10px] font-mono text-plasma">
                        {(groundTruthStats.agreement_rate * 100).toFixed(0)}% agree
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroundTruthLayer;
