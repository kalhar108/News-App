import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface Props {
  logs: LogEntry[];
}

const LogConsole: React.FC<Props> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLevelColor = (l: string) => {
    switch(l) {
        case 'info': return 'text-slate-400';
        case 'warn': return 'text-amber-400';
        case 'error': return 'text-rose-400';
        case 'success': return 'text-emerald-400';
        default: return 'text-slate-400';
    }
  };

  return (
    <div className="glass-panel rounded-xl h-[300px] flex flex-col font-mono text-xs">
        <div className="p-2 border-b border-slate-800 bg-slate-950 text-slate-400 uppercase tracking-widest text-[10px] flex justify-between">
            <span>System Logs (Cloud Run / PubSub)</span>
            <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-950/80">
            {logs.map((log) => (
                <div key={log.id} className="flex gap-2">
                    <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                    <span className="text-indigo-400 font-bold shrink-0 w-24">[{log.agent}]</span>
                    <span className={`${getLevelColor(log.level)} break-all`}>{log.message}</span>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    </div>
  );
};

export default LogConsole;