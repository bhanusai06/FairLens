'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getApiUrl } from '@/lib/api';

type HealthResponse = {
  status?: string;
  gemini?: 'configured' | 'missing';
  analysis_mode?: 'gemini' | 'heuristic';
  model?: string;
};

type BadgeState = {
  label: string;
  tone: 'accent' | 'warning' | 'muted';
  detail: string;
};

function mapHealthToState(health: HealthResponse | null): BadgeState {
  if (!health) {
    return {
      label: 'Checking backend',
      tone: 'muted',
      detail: 'Live status',
    };
  }

  if (health.analysis_mode === 'gemini' && health.gemini === 'configured') {
    return {
      label: 'Gemini live',
      tone: 'accent',
      detail: health.model ? health.model : 'Cloud analysis',
    };
  }

  if (health.analysis_mode === 'heuristic') {
    return {
      label: 'Heuristic mode',
      tone: 'warning',
      detail: health.gemini === 'missing' ? 'Gemini not configured' : 'Fallback analysis',
    };
  }

  return {
    label: 'Backend status',
    tone: 'warning',
    detail: health.model ? health.model : 'Unavailable',
  };
}

export function BackendStatusBadge() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(getApiUrl('/api/health'), { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => setHealth(data as HealthResponse))
      .catch(() => setHealth(null));

    return () => controller.abort();
  }, []);

  const state = mapHealthToState(health);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold font-body transition-colors',
        state.tone === 'accent' && 'border-accent/20 bg-accent/10 text-accent',
        state.tone === 'warning' && 'border-warning/20 bg-warning/10 text-warning',
        state.tone === 'muted' && 'border-white/10 bg-surface-2 text-text-dim'
      )}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      <span>{state.label}</span>
      <span className="opacity-70">{state.detail}</span>
    </div>
  );
}