export enum AgentType {
  INGESTION = 'INGESTION',
  ANALYST = 'ANALYST',
  CLUSTERING = 'CLUSTERING',
  INDEXER = 'INDEXER'
}

export enum Sentiment {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
  NEUTRAL = 'NEUTRAL'
}

export enum ArticleStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  ENRICHED = 'ENRICHED',
  CLUSTERED_DUPLICATE = 'CLUSTERED_DUPLICATE',
  INDEXED = 'INDEXED'
}

export interface RawArticle {
  id: string;
  headline: string;
  source: string;
  timestamp: number;
}

export interface EnrichedArticle extends RawArticle {
  summary?: string;
  sentiment?: Sentiment;
  entities?: string[];
  category?: string;
  confidenceScore?: number;
  status: ArticleStatus;
  processingTimeMs?: number;
}

export interface SystemMetrics {
  totalIngested: number;
  totalIndexed: number;
  duplicatesBlocked: number;
  apiCallsSaved: number;
  avgLatencyMs: number;
  uptime: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  agent: AgentType;
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
}