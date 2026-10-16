import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const DashboardCharts = ({ disaster }) => {
  const { stats } = disaster;

  const damageData = [
    { name: 'Intact', value: stats.intact_pct || 0, color: '#22c55e' },
    { name: 'Minor', value: stats.minor_damage_pct || 0, color: '#eab308' },
    { name: 'Major', value: stats.major_damage_pct || 0, color: '#f97316' },
    { name: 'Destroyed', value: stats.destroyed_pct || 0, color: '#ef4444' },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-void/95 backdrop-blur-md border border-gray-700 rounded-xl px-4 py-3 shadow-glow">
          <p className="text-xs font-mono text-gray-400 uppercase mb-1">{data.name}</p>
          <p className="text-lg font-sora font-bold text-ghost">{data.value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-graphite rounded-3xl border border-gray-800 p-4 shadow-glow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-sora font-semibold text-ghost text-sm">Damage Analysis</h3>
          <p className="text-xs font-mono text-gray-500 mt-1">AI-classified structure assessment</p>
        </div>
        <div className="flex gap-1">
          {damageData.map((item) => (
            <div 
              key={item.name}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: item.color }}
              title={item.name}
            />
          ))}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-[180px] mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={damageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'Space Mono' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'Space Mono' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }} />
            <Bar 
              dataKey="value" 
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            >
              {damageData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mini Pie Chart */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-800">
        <div className="w-20 h-20">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={damageData}
                cx="50%"
                cy="50%"
                innerRadius={20}
                outerRadius={35}
                paddingAngle={2}
                dataKey="value"
              >
                {damageData.map((entry, index) => (
                  <Cell key={`pie-cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2">
          {damageData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[10px] font-mono text-gray-400">
                {item.name}: <span className="text-ghost">{item.value}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
