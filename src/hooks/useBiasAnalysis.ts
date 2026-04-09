import { useState, useCallback } from 'react';
import { BiasAnalysisResult } from '@/lib/gemini';
import { getApiUrl } from '@/lib/api';
import toast from 'react-hot-toast';

interface AnalysisState {
  result: BiasAnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
  progressLabel: string;
}

export function useBiasAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    result: null,
    isLoading: false,
    error: null,
    progress: 0,
    progressLabel: '',
  });

  const analyze = useCallback(async (
    csvData: string,
    datasetType: string,
    datasetName: string
  ): Promise<BiasAnalysisResult | null> => {
    setState((s) => ({ ...s, isLoading: true, error: null, progress: 0 }));

    const steps = [
      { label: 'Parsing dataset structure...', pct: 15 },
      { label: 'Detecting protected attributes...', pct: 30 },
      { label: 'Sending to Gemini 1.5 Pro...', pct: 50 },
      { label: 'Analyzing bias patterns...', pct: 70 },
      { label: 'Computing fairness metrics...', pct: 85 },
      { label: 'Generating mitigation plan...', pct: 95 },
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setState((s) => ({
          ...s,
          progress: steps[stepIdx].pct,
          progressLabel: steps[stepIdx].label,
        }));
        stepIdx++;
      }
    }, 900);

    try {
      const res = await fetch(getApiUrl('/api/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData, datasetType, datasetName }),
      });

      clearInterval(interval);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const result: BiasAnalysisResult = await res.json();

      setState((s) => ({
        ...s,
        result,
        isLoading: false,
        progress: 100,
        progressLabel: 'Complete!',
      }));

      return result;
    } catch (err: unknown) {
      clearInterval(interval);
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setState((s) => ({ ...s, isLoading: false, error: message, progress: 0 }));
      toast.error(message);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ result: null, isLoading: false, error: null, progress: 0, progressLabel: '' });
  }, []);

  return { ...state, analyze, reset };
}
