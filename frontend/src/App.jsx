import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Landing
import LandingPage from './landing/LandingPage';

// Login
import LoginOrganization from './login/LoginOrganization';
import LoginCivilian from './login/LoginCivilian';

// Dashboards
import CivilianDashboard from './dashboards/civilian/CivilianDashboard';
import DashboardNavbar from './dashboards/responder/DashboardNavbar';
import { LiveMonitorModule, DamageIntelligenceModule, SatelliteOpsModule, AssessModule } from './dashboards/responder/layouts';

// Modules
import Hub from './modules/Hub/Hub';
import PublicReport from './modules/PublicReport/PublicReport';
import AlertPanel from './modules/AlertPanel/AlertPanel';
import AssessMyArea from './modules/AssessMyArea/AssessMyArea';

gsap.registerPlugin(ScrollTrigger);

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Landing Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login/civilian" element={<LoginCivilian />} />
        <Route path="/responder-login" element={<LoginOrganization />} />
        <Route path="/dashboard/civilian" element={<CivilianDashboard />} />
        <Route path="/dashboard/organization" element={
          <>
            <DashboardNavbar />
            <Hub />
            <AlertPanel />
            <AssessMyArea />
          </>
        } />

        {/* Dashboard Routes (with Navbar and Overlays) */}
        <Route path="/dashboard/*" element={
          <>
            <DashboardNavbar />
            <Routes>
              <Route path="hub" element={<Hub />} />
              <Route path="monitor" element={<LiveMonitorModule />} />
              <Route path="intelligence" element={<DamageIntelligenceModule />} />
              <Route path="satellite" element={<SatelliteOpsModule />} />
              <Route path="assess" element={<AssessModule />} />
            </Routes>
            <AlertPanel />
            <AssessMyArea />
          </>
        } />

        {/* Legacy routes */}
        <Route path="/hub" element={<><DashboardNavbar /><Hub /><AlertPanel /><AssessMyArea /></>} />
        <Route path="/monitor" element={<><DashboardNavbar /><LiveMonitorModule /><AlertPanel /><AssessMyArea /></>} />
        <Route path="/intelligence" element={<><DashboardNavbar /><DamageIntelligenceModule /><AlertPanel /><AssessMyArea /></>} />
        <Route path="/satellite" element={<><DashboardNavbar /><SatelliteOpsModule /><AlertPanel /><AssessMyArea /></>} />
        <Route path="/assess" element={<><DashboardNavbar /><AssessModule /><AlertPanel /><AssessMyArea /></>} />

        <Route path="/report/:slug" element={<PublicReport />} />
      </Routes>
    </Router>
  );
};

export default App;
