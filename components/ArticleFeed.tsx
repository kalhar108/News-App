import React from 'react';
import { EnrichedArticle, Sentiment, ArticleStatus } from '../types';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface Props {
  articles: EnrichedArticle[];
}

const ArticleFeed: React.FC<Props> = ({ articles }) => {
  
  const getSentimentColor = (s?: Sentiment) => {
    switch(s) {
        case Sentiment.POSITIVE: return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
        case Sentiment.NEGATIVE: return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
        default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden h-[600px] flex flex-col">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <h3 className="font-semibold text-slate-200">Live Index Feed (OpenSearch Simulation)</h3>
        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">{articles.length} documents</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {articles.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-600 italic">
                Waiting for ingestion stream...
            </div>
        )}

        {articles.map((article) => (
          <div key={article.id} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-blue-400">{new Date(article.timestamp).toLocaleTimeString()}</span>
                    <span className="text-xs text-slate-500">via {article.source}</span>
                </div>
                <div className="flex items-center gap-2">
                    {article.status === ArticleStatus.PROCESSING && <Loader2 size={14} className="animate-spin text-amber-500"/>}
                    {article.status === ArticleStatus.INDEXED && <CheckCircle2 size={14} className="text-emerald-500"/>}
                    {article.status === ArticleStatus.CLUSTERED_DUPLICATE && <XCircle size={14} className="text-slate-500"/>}
                </div>
            </div>
            
            <h4 className={`font-medium mb-2 ${article.status === ArticleStatus.CLUSTERED_DUPLICATE ? 'text-slate-500 line-through decoration-slate-600' : 'text-slate-200'}`}>
                {article.headline}
            </h4>

            {article.status === ArticleStatus.CLUSTERED_DUPLICATE && (
                <div className="text-xs text-slate-500 italic border-l-2 border-slate-700 pl-2 mt-2">
                    Duplicate event detected by Personalization Agent. Skipped enrichment.
                </div>
            )}

            {article.status === ArticleStatus.INDEXED && (
                <div className="mt-3 space-y-2 animate-in fade-in duration-500">
                    <p className="text-sm text-slate-400 leading-relaxed">{article.summary}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-bold ${getSentimentColor(article.sentiment)}`}>
                            {article.sentiment}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded border border-indigo-400/20 bg-indigo-400/10 text-indigo-400 uppercase tracking-wider font-bold">
                            {article.category}
                        </span>
                        {article.entities?.map((e, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {e}
                            </span>
                        ))}
                    </div>
                     <div className="mt-2 text-[10px] text-slate-600 font-mono text-right">
                        Latency: {article.processingTimeMs}ms
                    </div>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticleFeed;