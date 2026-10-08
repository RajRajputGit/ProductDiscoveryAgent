import { apiClient } from './client';
import { RecommendationResult, PipelineStage, SourceStatus } from '../types/shopping';
import { generateMockResult } from '../mock/shoppingData';

const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

// In-memory simulation cache for demo mode
interface ActiveSearchSession {
  search_id: string;
  query: string;
  startTime: number;
  result: RecommendationResult;
}

const activeSessions = new Map<string, ActiveSearchSession>();

export async function searchProducts(query: string): Promise<{ search_id: string }> {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, live: true }),
    });

    if (response.ok) {
      const liveData: RecommendationResult = await response.json();
      activeSessions.set(liveData.search_id, {
        search_id: liveData.search_id,
        query,
        startTime: Date.now(),
        result: liveData,
      });
      return { search_id: liveData.search_id };
    }
  } catch (err) {
    // If backend is not reached, smoothly fall back to local mock generator
  }

  // Fallback demo session
  const search_id = 'srch_' + Math.random().toString(36).substring(2, 9);
  const mockResult = generateMockResult(query);
  activeSessions.set(search_id, {
    search_id,
    query,
    startTime: Date.now(),
    result: mockResult,
  });
  return { search_id };
}


export interface SearchStatusResponse {
  search_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  current_stage: string;
  stages: PipelineStage[];
  sources: Record<string, SourceStatus>;
  progress_percent: number;
}

export async function getSearchStatus(search_id: string): Promise<SearchStatusResponse> {
  if (IS_DEMO_MODE) {
    const session = activeSessions.get(search_id);
    if (!session) {
      throw new Error(`Search session ${search_id} not found.`);
    }

    const elapsed = Date.now() - session.startTime;
    // Total simulated timeline duration = ~3.2 seconds
    const totalDuration = 3200;
    const progress = Math.min(100, Math.floor((elapsed / totalDuration) * 100));

    // Determine active stage based on elapsed time
    const rawStages = session.result.execution_stages;
    const stageCount = rawStages.length;
    const activeStageIndex = Math.min(
      stageCount - 1,
      Math.floor((elapsed / totalDuration) * stageCount)
    );

    const isComplete = elapsed >= totalDuration;

    const dynamicStages: PipelineStage[] = rawStages.map((stage, idx) => {
      if (isComplete) {
        return { ...stage, status: 'completed' };
      }
      if (idx < activeStageIndex) {
        return { ...stage, status: 'completed' };
      } else if (idx === activeStageIndex) {
        return { ...stage, status: 'running' };
      } else {
        return { ...stage, status: 'pending' };
      }
    });

    const sources: Record<string, SourceStatus> = {
      amazon: {
        site: 'Amazon',
        status: elapsed > 1200 ? 'completed' : elapsed > 600 ? 'running' : 'pending',
        products_found: elapsed > 1200 ? 10 : elapsed > 600 ? 5 : 0,
        valid_products: elapsed > 2400 ? 5 : 0,
      },
    };

    return {
      search_id,
      status: isComplete ? 'completed' : 'running',
      current_stage: dynamicStages[activeStageIndex].id,
      stages: dynamicStages,
      sources,
      progress_percent: progress,
    };
  }

  return apiClient<SearchStatusResponse>(`/api/search/${search_id}/status`);
}

export async function getSearchResults(search_id: string): Promise<RecommendationResult> {
  if (IS_DEMO_MODE) {
    const session = activeSessions.get(search_id);
    if (!session) {
      throw new Error(`Search session ${search_id} not found.`);
    }
    return session.result;
  }

  return apiClient<RecommendationResult>(`/api/search/${search_id}/results`);
}
