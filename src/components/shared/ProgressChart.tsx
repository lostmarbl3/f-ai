import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ProgressDataPoint, WeightUnit } from '../../types';
import { kgToLbs } from '../../utils/conversions';
import Card from '../ui/Card';

interface ProgressChartProps {
    data: ProgressDataPoint[];
    exerciseName: string;
    unit: WeightUnit;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ data, exerciseName, unit }) => {
    const formattedData = data.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString(),
        weight: unit === 'lbs' ? Math.round(kgToLbs(d.weight)) : d.weight,
    }));
    
    // Check if the page is in dark mode to adjust chart colors
    const isDarkMode = document.documentElement.classList.contains('dark');
    const tickColor = isDarkMode ? '#94a3b8' : '#475569';
    const gridColor = isDarkMode ? '#334155' : '#e2e8f0';


    return (
        <Card>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">{exerciseName} Progress</h3>
            {formattedData.length > 1 ? (
                 <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={formattedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="date" tick={{ fill: tickColor }} />
                        <YAxis tick={{ fill: tickColor }} label={{ value: `Weight (${unit})`, angle: -90, position: 'insideLeft', fill: tickColor }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                                border: `1px solid ${gridColor}`
                            }}
                            labelStyle={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
                         />
                        <Legend wrapperStyle={{ color: tickColor }} />
                        <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-72">
                    <p className="text-slate-500 dark:text-slate-400">Not enough data to display a chart. Log at least two workouts for this exercise.</p>
                </div>
            )}
        </Card>
    );
};

export default ProgressChart;