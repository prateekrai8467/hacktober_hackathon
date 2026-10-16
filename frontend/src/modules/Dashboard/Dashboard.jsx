import React, { useState, useEffect } from 'react';
import { historicalDisasters } from './historicalData';
import BeforeAfterViewer from './BeforeAfterViewer';
import DashboardStats from './DashboardStats';
import DashboardCharts from './DashboardCharts';
import DashboardInfra from './DashboardInfra';
import DashboardSummary from './DashboardSummary';
import DisasterSelector from './DisasterSelector';
import { Activity, Flame, Waves, Wind, MountainSnow, AlertTriangle } from 'lucide-react';

const TypeIcon = ({ type }) => {
  switch (type) {
    case 'WF': return <Flame className="w-5 h-5 text-alert-orange" />;
    case 'FL': return <Waves className="w-5 h-5 text-blue-400" />;
    case 'EQ': return <Activity className="w-5 h-5 text-alert-red" />;
    case 'TC': return <Wind className="w-5 h-5 text-gray-400" />;
    case 'VO': return <MountainSnow className="w-5 h-5 text-alert-red" />;
    default: return <AlertTriangle className="w-5 h-5 text-alert-yellow" />;
  }
};

const Dashboard = () => {
  const [selectedDisaster, setSelectedDisaster] = useState(historicalDisasters[0]);
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-[1920px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <TypeIcon type={selectedDisaster.type} />
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
              selectedDisaster.severity === 'red' ? 'bg-alert-red/20 text-alert-red' :
              selectedDisaster.severity === 'orange' ? 'bg-alert-orange/20 text-alert-orange' :
              'bg-alert-green/20 text-alert-green'
            }`}>
              {selectedDisaster.severity} severity
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-sora font-bold text-ghost mb-2">
            {selectedDisaster.title}
          </h1>
          <p className="text-gray-400 font-mono text-sm">
            {selectedDisaster.location} • {new Date(selectedDisaster.date).toLocaleDateString('en-US', { 
              year: 'numeric', month: 'long', day: 'numeric' 
            })}
          </p>
        </div>

        <DisasterSelector 
          disasters={historicalDisasters}
          selected={selectedDisaster}
          onSelect={setSelectedDisaster}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Before/After Viewer */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <BeforeAfterViewer 
            disaster={selectedDisaster}
            sliderPosition={sliderPosition}
            setSliderPosition={setSliderPosition}
          />
          
          {/* Stats Row */}
          <DashboardStats disaster={selectedDisaster} />
        </div>

        {/* Right Column - Details */}
        <div className="flex flex-col gap-6">
          <DashboardSummary disaster={selectedDisaster} />
          <DashboardCharts disaster={selectedDisaster} />
          <DashboardInfra disaster={selectedDisaster} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
