export interface ShoppingQuery {
  product: string;
  material?: string;
  min_price?: number;
  max_price?: number;
  sizes: string[];
  category?: string;
  sites: string[];
  rating_requirement?: number;
  color?: string;
  gender?: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  sizes: string[];
  material?: string;
  rating?: number;
  shipping_cost: number;
  source: 'amazon' | 'ebay' | 'walmart' | string;
  url: string;
  availability: boolean;
  description?: string;
  image_url?: string;
}

export interface ValidatedProduct {
  product: Product;
  hard_filter_passed: boolean;
  material_score: number;
  price_score: number;
  shipping_score: number;
  rating_score: number;
  final_score: number;
  validation_reasons: string[];
}

export interface RankingWeights {
  material: number;
  price: number;
  shipping: number;
  rating: number;
}

export interface SearchSummary {
  total_collected: number;
  valid_count: number;
  rejected_count: number;
  sources_count: number;
  top_score: number;
  site_counts: Record<string, number>;
}

export type ExecutionState = 'pending' | 'running' | 'completed' | 'failed';

export interface SourceStatus {
  site: string;
  status: ExecutionState;
  products_found: number;
  valid_products: number;
  error?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  layer: 'IGNA' | 'CUA';
  status: ExecutionState;
  description: string;
  details?: string[];
}

export interface ExecutionTaskInfo {
  site: string;
  search_query: string;
  filters?: Record<string, any>;
}

export interface RecommendationResult {
  search_id: string;
  raw_query?: string;
  playwright_query?: string;
  execution_tasks?: ExecutionTaskInfo[];
  query: ShoppingQuery;
  summary: SearchSummary;
  top_products: ValidatedProduct[];
  best_product: ValidatedProduct | null;
  rejected_products: ValidatedProduct[];
  explanation: string;
  execution_stages: PipelineStage[];
  sources_status: Record<string, SourceStatus>;
  weights: RankingWeights;
}

export interface SearchFilterState {
  sources: string[];
  maxPrice?: number;
  minRating?: number;
  material?: string;
  sortBy: 'score' | 'price-asc' | 'price-desc' | 'rating';
}
