import React, { useEffect } from 'react';
import { useStore } from '../../store';

import EventSidebar from '../../modules/EventSidebar/EventSidebar';
import DamageMap from '../../modules/DamageMap/DamageMap';
import GroundTruthLayer from '../../modules/GroundTruthLayer/GroundTruthLayer';
import StatCards from '../../modules/StatCards/StatCards';
import AIChat from '../../modules/AIChat/AIChat';
import AIReportPanel from '../../modules/AIReportPanel/AIReportPanel';
import SeverityChart from '../../modules/SeverityChart/SeverityChart';
import InfraRiskPanel from '../../modules/InfraRiskPanel/InfraRiskPanel';
import RecoveryChart from '../../modules/RecoveryChart/RecoveryChart';
import BeforeAfterSlider from '../../modules/BeforeAfterSlider/BeforeAfterSlider';
import Timeline from '../../modules/Timeline/Timeline';

// Layout: Live Monitor Module
export const LiveMonitorModule = () => {
  return (
    <div className="min-h-screen pt-24 pb-6 px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-6 max-w-[1920px] mx-auto animate-fade-in">
      <div className="md:col-span-1 h-[calc(100vh-8rem)]">
        <EventSidebar />
      </div>
      <div className="md:col-span-3 h-[calc(100vh-8rem)] relative rounded-3xl overflow-hidden border border-gray-800 shadow-glow">
        <DamageMap />
        <GroundTruthLayer />
        <div className="absolute top-4 right-4 z-[400] pointer-events-none">
          <StatCards />
        </div>
      </div>
      <AIChat />
    </div>
  );
};

// Layout: Damage Intelligence Module
export const DamageIntelligenceModule = () => {
  return (
    <div className="min-h-screen pt-24 pb-6 px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[1400px] mx-auto animate-fade-in">
      <div className="flex flex-col gap-6 h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pr-2">
        <AIReportPanel />
      </div>
      <div className="flex flex-col gap-6 h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pr-2">
        <div className="bg-graphite rounded-3xl p-5 border border-gray-800 shadow-glow">
          <SeverityChart />
        </div>
        <div className="h-96">
          <InfraRiskPanel />
        </div>
        <div className="bg-graphite rounded-3xl p-5 border border-gray-800 flex-1">
          <RecoveryChart />
        </div>
      </div>
      <AIChat />
    </div>
  );
};

// Layout: Satellite Operations Module
export const SatelliteOpsModule = () => {
  return (
    <div className="min-h-screen pt-24 pb-6 px-4 md:px-8 flex flex-col gap-6 max-w-[1920px] mx-auto animate-fade-in">
      <div className="flex-1 relative rounded-3xl overflow-hidden border border-gray-800 shadow-glow min-h-[500px]">
        <BeforeAfterSlider />
      </div>
      <div className="h-56 rounded-3xl bg-graphite border border-gray-800 p-4">
        <Timeline />
      </div>
      <AIChat />
    </div>
  );
};

// Layout: Assess Module
export const AssessModule = () => {
  const { toggleAssessModal } = useStore();
  useEffect(() => {
    toggleAssessModal(true);
  }, [toggleAssessModal]);

  return (
    <div className="min-h-screen pt-32 px-8 max-w-[1400px] mx-auto text-center animate-fade-in">
      <h1 className="text-4xl font-sora font-semibold text-ghost mb-4">Field Assessment Module</h1>
      <p className="text-gray-400 font-mono">Opening civilian submission interface...</p>
    </div>
  );
};
