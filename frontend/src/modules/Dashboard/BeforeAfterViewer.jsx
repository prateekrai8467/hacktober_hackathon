import React, { useState, useRef } from 'react';
import { Maximize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const BeforeAfterViewer = ({ disaster, sliderPosition, setSliderPosition }) => {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen && containerRef.current) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="bg-graphite rounded-3xl border border-gray-800 p-4 shadow-glow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-sora font-semibold text-ghost text-sm">Before / After Comparison</h3>
          <p className="text-xs font-mono text-gray-500 mt-1">Drag the slider to compare imagery</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setSliderPosition(50)}
            className="p-2 rounded-xl bg-void border border-gray-700 text-gray-400 hover:text-plasma hover:border-plasma/50 transition-all"
            title="Reset slider"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-void border border-gray-700 text-gray-400 hover:text-plasma hover:border-plasma/50 transition-all"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Viewer */}
      <div
        ref={containerRef}
        className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden cursor-ew-resize select-none"
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* Before Image (Full) */}
        <div className="absolute inset-0">
          <img
            src={disaster.before_image}
            alt="Before disaster"
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute top-4 left-4 bg-void/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-700">
            <span className="text-xs font-mono text-gray-300">BEFORE</span>
          </div>
        </div>

        {/* After Image (Clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
        >
          <img
            src={disaster.after_image}
            alt="After disaster"
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute top-4 right-4 bg-alert-red/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-alert-red/50">
            <span className="text-xs font-mono text-white">AFTER</span>
          </div>
        </div>

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-plasma z-20 pointer-events-none"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-plasma rounded-full flex items-center justify-center shadow-glow pointer-events-auto cursor-ew-resize">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M18 8L22 12L18 16" />
              <path d="M6 8L2 12L6 16" />
            </svg>
          </div>
          
          {/* Vertical glow line */}
          <div className="absolute inset-0 w-[2px] bg-gradient-to-b from-plasma/0 via-plasma to-plasma/0 blur-sm" />
        </div>

        {/* Instructions Overlay (fades on interaction) */}
        <div className={`absolute inset-0 flex items-center justify-center bg-void/40 backdrop-blur-[2px] transition-opacity duration-500 pointer-events-none ${isDragging ? 'opacity-0' : 'opacity-100'}`}>
          <div className="bg-void/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-gray-700 text-center">
            <p className="text-sm font-sora text-ghost mb-1">Drag to Compare</p>
            <p className="text-xs font-mono text-gray-500">Move slider left/right to reveal damage</p>
          </div>
        </div>
      </div>

      {/* Timeline Bar */}
      <div className="flex items-center justify-between mt-4 px-2">
        <div className="text-center">
          <div className="text-[10px] font-mono text-gray-500 uppercase mb-1">Pre-Event</div>
          <div className="text-xs font-mono text-ghost">Baseline Imagery</div>
        </div>
        <div className="flex-1 mx-6 h-1 bg-gradient-to-r from-alert-green via-alert-yellow to-alert-red rounded-full relative">
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-plasma rounded-full border-2 border-white shadow-glow"
            style={{ left: `${sliderPosition}%`, transform: `translateX(-50%) translateY(-50%)` }}
          />
        </div>
        <div className="text-center">
          <div className="text-[10px] font-mono text-alert-red uppercase mb-1">Post-Event</div>
          <div className="text-xs font-mono text-ghost">Damage Assessment</div>
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterViewer;
