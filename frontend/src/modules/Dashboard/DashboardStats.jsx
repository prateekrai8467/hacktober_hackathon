import React from 'react';
import { MapPin, Building2, Users, TrendingDown } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, subtext, color }) => (
  <div className="bg-void rounded-2xl border border-gray-800 p-4 hover:border-plasma/30 transition-all duration-300 group">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} transition-all duration-300`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">VERIFIED</span>
    </div>
    <div className="space-y-1">
      <div className="text-2xl font-sora font-bold text-ghost group-hover:text-plasma transition-colors">{value}</div>
      <div className="text-xs font-medium text-gray-400">{label}</div>
      {subtext && <div className="text-[10px] font-mono text-gray-600">{subtext}</div>}
    </div>
  </div>
);

const DashboardStats = ({ disaster }) => {
  const { stats } = disaster;

  return (
    <div className="bg-graphite rounded-3xl border border-gray-800 p-4 shadow-glow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-sora font-semibold text-ghost text-sm">Impact Statistics</h3>
          <p className="text-xs font-mono text-gray-500 mt-1">Aggregated damage metrics</p>
        </div>
        <span className="text-[10px] font-mono text-plasma px-2 py-1 bg-plasma/10 rounded-full border border-plasma/20">
          HISTORICAL DATA
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={MapPin}
          label="Area Affected"
          value={stats.area_affected}
          subtext="Satellite coverage analysis"
          color="bg-gradient-to-br from-plasma to-plasma/70"
        />
        <StatCard
          icon={Building2}
          label="Structures Destroyed"
          value={stats.structures_destroyed?.toLocaleString() || 'N/A'}
          subtext="AI-detected damage"
          color="bg-gradient-to-br from-alert-red to-alert-red/70"
        />
        <StatCard
          icon={Users}
          label="Casualties"
          value={stats.casualties?.toLocaleString() || 'N/A'}
          subtext="Official reported figures"
          color="bg-gradient-to-br from-alert-yellow to-alert-yellow/70"
        />
        <StatCard
          icon={TrendingDown}
          label="Economic Loss"
          value={stats.economic_loss || 'N/A'}
          subtext="Estimated total damage"
          color="bg-gradient-to-br from-gray-600 to-gray-700"
        />
      </div>

      {/* Progress Bar for Damage Distribution */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="flex items-center justify-between text-[10px] font-mono mb-2">
          <span className="text-gray-500">DAMAGE DISTRIBUTION</span>
          <span className="text-gray-400">100% surveyed</span>
        </div>
        <div className="h-3 rounded-full bg-void flex overflow-hidden">
          <div 
            className="h-full bg-alert-green transition-all duration-500"
            style={{ width: `${stats.intact_pct || 0}%` }}
            title={`Intact: ${stats.intact_pct || 0}%`}
          />
          <div 
            className="h-full bg-alert-yellow transition-all duration-500"
            style={{ width: `${stats.minor_damage_pct || 0}%` }}
            title={`Minor: ${stats.minor_damage_pct || 0}%`}
          />
          <div 
            className="h-full bg-alert-orange transition-all duration-500"
            style={{ width: `${stats.major_damage_pct || 0}%` }}
            title={`Major: ${stats.major_damage_pct || 0}%`}
          />
          <div 
            className="h-full bg-alert-red transition-all duration-500"
            style={{ width: `${stats.destroyed_pct || 0}%` }}
            title={`Destroyed: ${stats.destroyed_pct || 0}%`}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-mono">
          <span className="text-alert-green">Intact {stats.intact_pct}%</span>
          <span className="text-alert-yellow">Minor {stats.minor_damage_pct}%</span>
          <span className="text-alert-orange">Major {stats.major_damage_pct}%</span>
          <span className="text-alert-red">Destroyed {stats.destroyed_pct}%</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
