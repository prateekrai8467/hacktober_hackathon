import React from 'react';
import { useStore } from '../../store';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const mockData = [
    { day: 'D+0', score: 0, high_sev_km2: 120 },
    { day: 'D+3', score: 15, high_sev_km2: 102 },
    { day: 'D+7', score: 32, high_sev_km2: 81 },
    { day: 'D+14', score: 58, high_sev_km2: 50 },
    { day: 'D+21', score: 71, high_sev_km2: 34 },
];

const RecoveryChart = () => {
    const { activeEventId } = useStore();

    if (!activeEventId) return null;

    return (
        <div className="h-40 flex flex-col group">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-sora font-semibold text-sm flex items-center gap-2 text-ghost">
                    <TrendingUp className="w-4 h-4 text-plasma" />
                    Recovery Trajectory
                </h3>
                <span className="text-xs font-mono text-alert-green">71% RECOVERED</span>
            </div>

            <div className="flex-1 -ml-6 -mb-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'Fira Code' }}
                            dy={10}
                        />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#18181B', borderColor: '#2A2A35', borderRadius: '12px' }}
                            itemStyle={{ color: '#34C759', fontFamily: 'Fira Code', fontSize: '12px' }}
                            labelStyle={{ color: '#9CA3AF', fontFamily: 'Fira Code', fontSize: '10px', marginBottom: '4px' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#34C759"
                            strokeWidth={3}
                            dot={{ fill: '#0A0A14', stroke: '#34C759', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: '#34C759' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RecoveryChart;
