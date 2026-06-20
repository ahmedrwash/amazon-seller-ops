import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const RoasTrendChart = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-80 w-full">
      <h3 className="text-lg font-medium text-white mb-4">ROAS Trend</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="week_start" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
          />
          <Legend />
          <ReferenceLine y={3} label="Target" stroke="#10b981" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="roas" name="ROAS" stroke="#10b981" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RoasTrendChart;