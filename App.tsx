import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  EnrichedArticle, 
  AgentType, 
  SystemMetrics, 
  LogEntry, 
  ArticleStatus, 
  RawArticle 
} from './types';
import * as geminiService from './services/geminiService';
import PipelineVisualizer from './components/PipelineVisualizer';
import MetricsDashboard from './components/SystemMetrics';
import ArticleFeed from './components/ArticleFeed';
import LogConsole from './components/LogConsole';
import { Play, Pause, RefreshCw, Terminal, Shield } from 'lucide-react';

const SESSION_LIMIT = 15; // Hard limit to prevent API exhaustion during demo

const App: React.FC = () => {
  // --- State ---
  const [isRunning, setIsRunning] = useState(false);
  const [articles, setArticles] = useState<EnrichedArticle[]>([]);
  const [activeAgent, setActiveAgent] = useState<AgentType | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalIngested: 0,
    totalIndexed: 0,
    duplicatesBlocked: 0,
    apiCallsSaved: 0,
    avgLatencyMs: 0,
    uptime: 0
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [chartData, setChartData] = useState<{time: string, processed: number}[]>([]);

  // Refs for loop control and processing queues
  const isRunningRef = useRef(false);
  const processingQueue = useRef<RawArticle[]>([]);
  const totalIngestedRef = useRef(0); // Synchronous tracker for limit
  
  // --- Helpers ---
  const addLog = (agent: AgentType, message: string, level: LogEntry['level'] = 'info') => {
    const entry: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString(),
        agent,
        message,
        level
    };
    setLogs(prev => [...prev.slice(-49), entry]); // Keep last 50 logs
  };

  const handleReset = () => {
    setIsRunning(false);
    setArticles([]);
    setMetrics({
        totalIngested: 0,
        totalIndexed: 0,
        duplicatesBlocked: 0,
        apiCallsSaved: 0,
        avgLatencyMs: 0,
        uptime: 0
    });
    setLogs([]);
    setChartData([]);
    processingQueue.current = [];
    totalIngestedRef.current = 0;
    addLog(AgentType.INGESTION, "System reset complete.", "success");
  };

  // --- Core Pipeline Logic ---
  
  // 1. Ingestion Loop
  const runIngestion = useCallback(async () => {
    if (!isRunningRef.current) return;

    // Check Limit
    if (totalIngestedRef.current >= SESSION_LIMIT) {
        setIsRunning(false);
        addLog(AgentType.INGESTION, `Safe Mode: Session limit of ${SESSION_LIMIT} articles reached. Stopping to conserve API quota.`, "warn");
        return;
    }

    setActiveAgent(AgentType.INGESTION);
    addLog(AgentType.INGESTION, "Polling sources for new content...", "info");
    
    // Simulate finding news (1 article per tick to be conservative)
    const newRawArticles = await geminiService.generateSyntheticHeadlines(1);
    
    if (newRawArticles.length > 0) {
        totalIngestedRef.current += newRawArticles.length;
        addLog(AgentType.INGESTION, `Ingested ${newRawArticles.length} new signals`, "success");
        setMetrics(m => ({ ...m, totalIngested: m.totalIngested + newRawArticles.length }));

        // Push to processing queue (simulating Pub/Sub)
        processingQueue.current.push(...newRawArticles);
    }

    // Schedule next ingestion
    if (isRunningRef.current) {
        setTimeout(runIngestion, 6000); // Poll every 6 seconds (slowed down slightly)
    }
  }, []);

  // 2. Processing Loop (Consumer)
  const processQueue = useCallback(async () => {
    if (!isRunningRef.current) return;

    if (processingQueue.current.length > 0) {
        const raw = processingQueue.current.shift()!;
        
        // --- Step A: Clustering Agent (Deduplication) ---
        setActiveAgent(AgentType.CLUSTERING);
        addLog(AgentType.CLUSTERING, `Checking redundancy for: "${raw.headline.substring(0, 30)}..."`, "info");
        
        // Check against currently indexed articles in state
        const { isDuplicate } = await geminiService.checkForRedundancy(raw, articles.filter(a => a.status === ArticleStatus.INDEXED));
        
        if (isDuplicate) {
            addLog(AgentType.CLUSTERING, `Duplicate detected. Dropping article.`, "warn");
            setMetrics(m => ({ 
                ...m, 
                duplicatesBlocked: m.duplicatesBlocked + 1,
                apiCallsSaved: m.apiCallsSaved + 1
            }));
            
            // Add as skipped to feed for visibility
            const skipped: EnrichedArticle = { ...raw, status: ArticleStatus.CLUSTERED_DUPLICATE };
            setArticles(prev => [skipped, ...prev]);

        } else {
            // --- Step B: Analyst Agent (Enrichment) ---
            setActiveAgent(AgentType.ANALYST);
            addLog(AgentType.ANALYST, `Enriching: "${raw.headline.substring(0, 30)}..."`, "info");
            
            // Add placeholder to UI
            const pending: EnrichedArticle = { ...raw, status: ArticleStatus.PROCESSING };
            setArticles(prev => [pending, ...prev]);

            // Call LLM
            const analysis = await geminiService.analyzeArticle(raw);
            
            // --- Step C: Indexer Agent (Storage) ---
            setActiveAgent(AgentType.INDEXER);
            addLog(AgentType.INDEXER, `Indexing data to Cloud SQL & OpenSearch`, "success");

            // Update UI with result
            setArticles(prev => prev.map(a => 
                a.id === raw.id 
                ? { ...a, ...analysis, status: ArticleStatus.INDEXED } 
                : a
            ));

            // Update Metrics
            setMetrics(m => ({
                ...m,
                totalIndexed: m.totalIndexed + 1,
                avgLatencyMs: (m.avgLatencyMs * m.totalIndexed + (analysis.processingTimeMs || 0)) / (m.totalIndexed + 1)
            }));
            
            // Update Chart
            setChartData(prev => [...prev.slice(-19), {
                time: new Date().toLocaleTimeString(),
                processed: 1
            }]);
        }
    } else {
        setActiveAgent(null);
    }

    // Processing loop is faster than ingestion to drain queue
    if (isRunningRef.current) {
        setTimeout(processQueue, 1500); 
    }
  }, [articles]); // Dependency on articles for redundancy check

  // --- Effects ---

  // Handle Start/Stop
  useEffect(() => {
    isRunningRef.current = isRunning;
    if (isRunning) {
        runIngestion();
        processQueue();
    }
  }, [isRunning, runIngestion, processQueue]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-6">
        <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent flex items-center gap-3">
                <Terminal className="text-sky-400" />
                NewsFlow AI Platform
            </h1>
            <p className="text-slate-500 mt-2 max-w-2xl">
                End-to-End Simulation of the Resume Project. Features a multi-agent system (Ingestion, Clustering, Analyst) 
                orchestrated to process real-time news with Gemini 2.5 Flash.
            </p>
        </div>
        
        <div className="flex flex-col items-end gap-2 mt-4 md:mt-0">
            <div className="flex gap-4">
                <button 
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg font-bold transition-all bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                    title="Reset Simulation"
                >
                    <RefreshCw size={18} />
                </button>
                
                <button 
                    onClick={() => {
                        if (metrics.totalIngested >= SESSION_LIMIT && !isRunning) {
                            alert("Session limit reached. Please Reset to start over.");
                            return;
                        }
                        setIsRunning(!isRunning);
                    }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
                        isRunning 
                        ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/50' 
                        : metrics.totalIngested >= SESSION_LIMIT
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                    }`}
                >
                    {isRunning ? <><Pause size={18}/> Stop Simulation</> : <><Play size={18}/> Start Simulation</>}
                </button>
            </div>
            
            {/* Safe Mode Indicator */}
            <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
                <Shield size={12} className={metrics.totalIngested >= SESSION_LIMIT ? "text-rose-400" : "text-emerald-400"} />
                <span className="text-slate-400">Safe Mode Limit:</span>
                <span className={metrics.totalIngested >= SESSION_LIMIT ? "text-rose-400 font-bold" : "text-white"}>
                    {metrics.totalIngested} / {SESSION_LIMIT}
                </span>
            </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Visuals & Metrics */}
        <div className="lg:col-span-2 space-y-6">
            <PipelineVisualizer activeAgent={activeAgent} />
            <MetricsDashboard metrics={metrics} history={chartData} />
            <LogConsole logs={logs} />
        </div>

        {/* Right Column: Feed */}
        <div className="lg:col-span-1">
             <ArticleFeed articles={articles} />
        </div>

      </div>
    </div>
  );
};

export default App;