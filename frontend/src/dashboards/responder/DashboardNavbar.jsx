import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { Activity, ShieldAlert } from 'lucide-react';
import { useStore } from '../../store';

const DashboardNavbar = () => {
  const navRef = useRef(null);
  const { toggleAlertPanel } = useStore();
  const location = useLocation();

  useEffect(() => {
    const nav = navRef.current;
    const isHub = location.pathname === '/hub' || location.pathname === '/dashboard/hub';

    const onScroll = () => {
      if (!isHub || window.scrollY > 50) {
        gsap.to(nav, {
          backgroundColor: 'rgba(5, 5, 10, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          padding: '0.75rem 2rem',
          y: 0,
          duration: 0.4,
          ease: 'power3.out'
        });
      } else {
        gsap.to(nav, {
          backgroundColor: 'transparent',
          backdropFilter: 'blur(0px)',
          border: '1px solid transparent',
          padding: '1.5rem 2rem',
          y: 10,
          duration: 0.4,
          ease: 'power3.out'
        });
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  return (
    <nav ref={navRef} className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-12 rounded-full transition-all mt-4">
      <div className="flex items-center gap-3">
        <Activity className="text-plasma w-6 h-6" />
        <span className="font-sora font-bold text-xl tracking-tight">TeraScope</span>
      </div>

      <div className="hidden md:flex items-center gap-6 font-mono text-sm opacity-80">
        <a href="/hub" className="hover:text-plasma transition-colors">HUB</a>
        <a href="/monitor" className="hover:text-plasma transition-colors">MONITOR</a>
        <a href="#alerts" className="hover:text-plasma transition-colors" onClick={(e) => { e.preventDefault(); toggleAlertPanel(); }}>ALERTS</a>
      </div>

      <button onClick={toggleAlertPanel} className="relative text-ghost hover:text-plasma transition-colors">
        <ShieldAlert className="w-5 h-5" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-alert-red rounded-full shadow-[0_0_10px_rgba(255,59,48,0.8)] animate-pulse"></span>
      </button>
    </nav>
  );
};

export default DashboardNavbar;
