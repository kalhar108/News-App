import React from 'react';
import { AgentType, ArticleStatus } from '../types';
import { Activity, Server, Database, Share2, ShieldAlert } from 'lucide-react';

interface PipelineProps {
  activeAgent: AgentType | null;
}

const PipelineVisualizer: React.FC<PipelineProps> = ({ activeAgent }) => {
  const getOpacity = (agent: AgentType) => activeAgent === agent ? 1 : 0.4;
  const getGlow = (agent: AgentType) => activeAgent === agent ? 'shadow-[0_0_15px_rgba(56,189,248,0.6)] border-sky-400' : 'border-slate-700';

  return (
    <div className="w-full glass-panel p-6 rounded-xl mb-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-20" />
      
      <h3 className="text-slate-400 text-xs uppercase tracking-widest mb-6 font-semibold">Distributed System Architecture (Simulated)</h3>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative">
        
        {/* Connecting Lines (Desktop) */}
        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -z-10" />

        {/* Step 1: Ingestion */}
        <div className={`transition-all duration-300 bg-slate-900 p-4 rounded-lg border ${getGlow(AgentType.INGESTION)} w-full md:w-auto flex flex-col items-center gap-2 z-10`}>
            <div className="p-3 bg-slate-800 rounded-full">
                <Activity size={24} className="text-emerald-400" />
            </div>
            <div className="text-center">
                <div className="font-bold text-slate-200">Ingestion</div>
                <div className="text-xs text-slate-500">Raw Stream</div>
            </div>
        </div>

        {/* Step 2: Clustering (Personalization Agent) */}
        <div className={`transition-all duration-300 bg-slate-900 p-4 rounded-lg border ${getGlow(AgentType.CLUSTERING)} w-full md:w-auto flex flex-col items-center gap-2 z-10`}>
             <div className="p-3 bg-slate-800 rounded-full">
                <Share2 size={24} className="text-purple-400" />
            </div>
            <div className="text-center">
                <div className="font-bold text-slate-200">Clustering Agent</div>
                <div className="text-xs text-slate-500">Deduplication</div>
            </div>
        </div>

        {/* Step 3: Analyst Agent */}
        <div className={`transition-all duration-300 bg-slate-900 p-4 rounded-lg border ${getGlow(AgentType.ANALYST)} w-full md:w-auto flex flex-col items-center gap-2 z-10`}>
             <div className="p-3 bg-slate-800 rounded-full">
                <ShieldAlert size={24} className="text-amber-400" />
            </div>
            <div className="text-center">
                <div className="font-bold text-slate-200">Analyst Agent</div>
                <div className="text-xs text-slate-500">LLM Enrichment</div>
            </div>
        </div>

        {/* Step 4: Indexer */}
        <div className={`transition-all duration-300 bg-slate-900 p-4 rounded-lg border ${getGlow(AgentType.INDEXER)} w-full md:w-auto flex flex-col items-center gap-2 z-10`}>
             <div className="p-3 bg-slate-800 rounded-full">
                <Database size={24} className="text-blue-400" />
            </div>
            <div className="text-center">
                <div className="font-bold text-slate-200">Indexer Agent</div>
                <div className="text-xs text-slate-500">Cloud SQL / OpenSearch</div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default PipelineVisualizer;