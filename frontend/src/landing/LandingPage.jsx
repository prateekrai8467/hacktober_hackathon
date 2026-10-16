import React from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import PhilosophySection from './components/PhilosophySection';
import ProtocolSection from './components/ProtocolSection';
import FooterSection from './components/FooterSection';

/* ── Landing Page — Preset D: Vapor Clinic ──────────────
   Self-contained page. No styles leak to dashboard.
   ─────────────────────────────────────────────────────── */

export const LandingPage = () => {
    return (
        <main className="w-full min-h-screen bg-[#F0EFF4] text-[#18181B] font-sora relative overflow-x-hidden">
            <Navbar />
            <HeroSection />
            <FeaturesSection />
            <PhilosophySection />
            <ProtocolSection />
            <FooterSection />
        </main>
    );
};

export default LandingPage;
