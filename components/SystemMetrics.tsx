import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { SystemMetrics } from '../types';
import { Zap, Archive, Filter, DollarSign } from 'lucide-react';

interface Props {
  metrics: SystemMetrics;
  history: { time: string; processed: number }[];
}

const MetricsDashboard: React.FC<Props> = ({ metrics, history }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      
      {/* Stat Card 1 */}
      <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs uppercase font-bold">Total Ingested</span>
            <Archive size={16} className="text-slate-500" />
        </div>
        <div className="text-2xl font-mono text-white">{metrics.totalIngested}</div>
        <div className="text-xs text-emerald-400 mt-1">Live updates</div>
      </div>

      {/* Stat Card 2 */}
      <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs uppercase font-bold">API Calls Saved</span>
            <DollarSign size={16} className="text-slate-500" />
        </div>
        <div className="text-2xl font-mono text-white">{metrics.apiCallsSaved}</div>
        <div className="text-xs text-purple-400 mt-1">
            {metrics.totalIngested > 0 ? ((metrics.duplicatesBlocked / metrics.totalIngested) * 100).toFixed(1) : 0}% reduction
        </div>
      </div>

       {/* Stat Card 3 */}
       <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs uppercase font-bold">Avg Latency</span>
            <Zap size={16} className="text-slate-500" />
        </div>
        <div className="text-2xl font-mono text-white">{metrics.avgLatencyMs.toFixed(0)} ms</div>
        <div className="text-xs text-blue-400 mt-1">Target: &lt;2000ms</div>
      </div>

      {/* Chart */}
      <div className="glass-panel p-4 rounded-xl md:col-span-1 h-32 md:h-auto">
         <div className="text-slate-400 text-xs uppercase font-bold mb-2">Throughput (TPS)</div>
         <div className="h-20 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                    <defs>
                        <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="processed" stroke="#10b981" fillOpacity={1} fill="url(#colorPv)" />
                </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

    </div>
  );
};

export default MetricsDashboard;