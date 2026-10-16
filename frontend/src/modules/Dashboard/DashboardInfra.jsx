import React from 'react';
import { Hospital, School, Droplets, Zap, Building, Wifi, AlertTriangle } from 'lucide-react';

const infraTypes = [
  { id: 'hospital', name: 'Hospitals', icon: Hospital, critical: true },
  { id: 'school', name: 'Schools', icon: School, critical: false },
  { id: 'water', name: 'Water Systems', icon: Droplets, critical: true },
  { id: 'power', name: 'Power Grid', icon: Zap, critical: true },
  { id: 'shelter', name: 'Shelters', icon: Building, critical: false },
  { id: 'comms', name: 'Communications', icon: Wifi, critical: true },
];

const StatusBadge = ({ status }) => {
  const colors = {
    operational: 'bg-alert-green/20 text-alert-green border-alert-green/30',
    impaired: 'bg-alert-yellow/20 text-alert-yellow border-alert-yellow/30',
    critical: 'bg-alert-orange/20 text-alert-orange border-alert-orange/30',
    offline: 'bg-alert-red/20 text-alert-red border-alert-red/30',
  };

  return (
    <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${colors[status]}`}>
      {status}
    </span>
  );
};

const DashboardInfra = ({ disaster }) => {
  // Generate mock infrastructure status based on disaster severity
  const generateInfraStatus = () => {
    const severityFactor = (disaster.stats.destroyed_pct || 30) / 100;
    return infraTypes.map((infra) => {
      const rand = Math.random();
      let status;
      if (rand < severityFactor * 0.5) status = 'offline';
      else if (rand < severityFactor) status = 'critical';
      else if (rand < severityFactor + 0.3) status = 'impaired';
      else status = 'operational';
      
      return {
        ...infra,
        status,
        affected: Math.floor(Math.random() * 50) + (severityFactor * 100),
        capacity: `${Math.floor((1 - severityFactor) * 100 + Math.random() * 20)}%`,
      };
    });
  };

  const [infraStatus] = React.useState(generateInfraStatus);
  const criticalCount = infraStatus.filter(i => i.status === 'critical' || i.status === 'offline').length;

  return (
    <div className="bg-graphite rounded-3xl border border-gray-800 p-4 shadow-glow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-sora font-semibold text-ghost text-sm">Infrastructure Status</h3>
          <p className="text-xs font-mono text-gray-500 mt-1">Critical facility monitoring</p>
        </div>
        {criticalCount > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-alert-red/10 rounded-lg border border-alert-red/20">
            <AlertTriangle className="w-3 h-3 text-alert-red" />
            <span className="text-[10px] font-mono text-alert-red">{criticalCount} CRITICAL</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {infraStatus.map((infra) => {
          const Icon = infra.icon;
          return (
            <div 
              key={infra.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                infra.status === 'offline' || infra.status === 'critical'
                  ? 'bg-alert-red/5 border-alert-red/20'
                  : 'bg-void border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  infra.critical ? 'bg-plasma/20' : 'bg-gray-800'
                }`}>
                  <Icon className={`w-4 h-4 ${infra.critical ? 'text-plasma' : 'text-gray-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-ghost">{infra.name}</span>
                    {infra.critical && (
                      <span className="text-[8px] font-mono text-plasma bg-plasma/10 px-1.5 py-0.5 rounded">
                        CRITICAL
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-gray-500">
                    {Math.floor(infra.affected)} facilities affected
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] font-mono text-gray-500">Capacity</div>
                  <div className="text-xs font-mono text-ghost">{infra.capacity}</div>
                </div>
                <StatusBadge status={infra.status} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
        <span className="text-[10px] font-mono text-gray-500">
          Last updated: {disaster.date}
        </span>
        <div className="flex gap-2">
          <span className="text-[9px] font-mono text-alert-green">● Operational</span>
          <span className="text-[9px] font-mono text-alert-yellow">● Impaired</span>
          <span className="text-[9px] font-mono text-alert-red">● Critical/Offline</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardInfra;
