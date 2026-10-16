import React, { useState } from 'react';
import { useStore } from '../../store';

const BeforeAfterSlider = () => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const { activeEventId } = useStore();

    if (!activeEventId) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-10">
            {/* Invisible overlay to capture dragging only when shift is held or a specific mode is active.
          For now, just a visual indicator UI on top of map.
      */}
            <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-auto">
                <div className="bg-void/80 backdrop-blur-md border border-gray-700 px-6 py-3 rounded-2xl flex items-center gap-4">
                    <span className="text-xs font-mono text-gray-400">BASELINE</span>
                    <input
                        type="range"
                        min="0" max="100"
                        value={sliderPosition}
                        onChange={(e) => setSliderPosition(e.target.value)}
                        className="w-48 appearance-none bg-gray-800 h-1 rounded outline-none slider-thumb"
                    />
                    <span className="text-xs font-mono text-plasma">POST-EVENT</span>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #7B61FF;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(123, 97, 255, 0.5);
        }
      `}} />
        </div>
    );
};

export default BeforeAfterSlider;
