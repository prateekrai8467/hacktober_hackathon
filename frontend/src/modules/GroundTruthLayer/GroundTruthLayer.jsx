import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';

// This is a logical component; 
// in a full implementation, it would use react-leaflet <Marker> or just L.marker on the map instance.
// Since DamageMap controls the Leaflet instance directly in this scaffold, 
// we'll just mock it as a toggleable state for now.

const GroundTruthLayer = () => {
    const { activeEventId } = useStore();
    const [visible, setVisible] = useState(true);

    if (!activeEventId) return null;

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
                    <span className="text-xs font-sora font-semibold text-ghost">Field Reports (14)</span>
                </label>

                <div className="flex gap-1 border-l border-gray-700 pl-3">
                    <div className="w-3 h-3 rounded-full bg-alert-red" title="Destroyed / Major"></div>
                    <div className="w-3 h-3 rounded-full bg-alert-yellow" title="Disputed Assessment"></div>
                </div>
            </div>
        </div>
    );
};

export default GroundTruthLayer;
