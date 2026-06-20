import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SalesTrendChart = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-80 w-full">
      <h3 className="text-lg font-medium text-white mb-4">Sales Trend</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="week_start" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
          />
          <Legend />
          <Line type="monotone" dataKey="sales" name="Total Sales" stroke="#10b981" activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="organic_sales" name="Organic Sales" stroke="#3b82f6" />
          <Line type="monotone" dataKey="spend" name="Spend" stroke="#ef4444" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesTrendChart;