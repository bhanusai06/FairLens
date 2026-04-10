'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { 
  Upload, FileText, Zap, AlertCircle, ArrowLeft,
  Shield, CheckCircle, X, Eye, ChevronRight
} from 'lucide-react';
import { DEMO_DATASETS, DatasetId } from '@/data/datasets';
import { cn } from '@/lib/utils';
import { getApiUrl } from '@/lib/api';
import { TiltCard } from '@/components/ui/TiltCard';
import { BackendStatusBadge } from '@/components/ui/BackendStatusBadge';
import { Suspense } from 'react';

interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  rawText: string;
}

function hasDecisionLikeHeader(headers: string[]): boolean {
  const decisionKeywords = ['decision', 'outcome', 'status', 'result', 'approved', 'hired', 'rejected', 'denied', 'treatment'];
  return headers.some((header) => {
    const normalized = header.toLowerCase();
    return decisionKeywords.some((keyword) => normalized.includes(keyword));
  });
}

function formatApiError(payload: unknown, fallback = 'Analysis failed'): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === 'string' && error.trim()) return error;
  }
  return fallback;
}

function isCsvInputError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('csv') ||
    normalized.includes('header') ||
    normalized.includes('row') ||
    normalized.includes('column') ||
    normalized.includes('dataset too small') ||
    normalized.includes('invalid request')
  );
}

function UploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoParam = searchParams.get('demo') as DatasetId | null;

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCSV | null>(null);
  const [selectedDemo, setSelectedDemo] = useState<DatasetId | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const parseCSV = (text: string): ParsedCSV => {
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    return {
      headers: result.meta.fields || [],
      rows: result.data as Record<string, string>[],
      rawText: text,
    };
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;

    // File size check (max 5MB)
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    // Type check
    if (!f.name.endsWith('.csv') && !f.name.endsWith('.txt')) {
      toast.error('Please upload a CSV file.');
      return;
    }

    setFile(f);
    setSelectedDemo(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const parsed = parseCSV(text);
        if (parsed.headers.length < 2) {
          toast.error('Dataset needs at least 2 columns.');
          return;
        }
        if (parsed.rows.length < 5) {
          toast.error('Dataset too small. Need at least 5 rows.');
          return;
        }
        if (!hasDecisionLikeHeader(parsed.headers)) {
          toast('Tip: Include a decision/outcome column for better analysis.', { icon: 'ℹ️' });
        }
        setParsedData(parsed);
        toast.success(`Loaded ${parsed.rows.length} records`);
      } catch {
        toast.error('Could not parse CSV. Please check your file format.');
      }
    };
    reader.readAsText(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'text/plain': ['.txt'] },
    multiple: false,
  });

  const handleDemoSelect = useCallback((id: DatasetId) => {
    setSelectedDemo(id);
    setFile(null);
    setError(null);
    const dataset = DEMO_DATASETS[id];
    const parsed = parseCSV(dataset.csvData);
    setParsedData(parsed);
    toast.success(`${dataset.name} dataset loaded — ${dataset.rows} records`);
  }, []);

  // Auto-select demo if query param provided
  useEffect(() => {
    if (demoParam && DEMO_DATASETS[demoParam]) {
      handleDemoSelect(demoParam);
    }
  }, [demoParam, handleDemoSelect]);

  async function runAnalysis() {
    if (!parsedData) return;

    setIsAnalyzing(true);
    setError(null);
    setProgress(0);

    const steps = [
      { label: 'Parsing dataset structure...', pct: 15 },
      { label: 'Detecting protected attributes...', pct: 30 },
      { label: 'Sending to the analysis engine...', pct: 50 },
      { label: 'Analyzing bias patterns...', pct: 70 },
      { label: 'Computing fairness metrics...', pct: 85 },
      { label: 'Generating mitigation plan...', pct: 95 },
    ];

    // Animate progress in parallel with the API call
    let stepIdx = 0;
    const progressInterval = setInterval(() => {
      if (stepIdx < steps.length) {
        setProgress(steps[stepIdx].pct);
        setProgressLabel(steps[stepIdx].label);
        stepIdx++;
      }
    }, 800);

    try {
      const dataset = selectedDemo ? DEMO_DATASETS[selectedDemo] : null;
      const datasetType = dataset?.name || 'decision-making';
      const datasetName = dataset?.name || file?.name || 'Custom Dataset';

      if (parsedData.headers.length < 2) {
        throw new Error('Dataset needs at least 2 columns to analyze.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await fetch(getApiUrl('/api/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          csvData: parsedData.rawText,
          datasetType,
          datasetName,
        }),
      });
      clearTimeout(timeoutId);

      clearInterval(progressInterval);

      if (!response.ok) {
        let errorBody: unknown;
        try {
          errorBody = await response.json();
        } catch {
          throw new Error(`Analysis failed (${response.status})`);
        }
        throw new Error(formatApiError(errorBody, `Analysis failed (${response.status})`));
      }

      const result = await response.json();
      const analysisRunId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

      setProgress(100);
      setProgressLabel('Analysis complete!');

      // Store result and navigate
      sessionStorage.setItem(`fairlens_result:${analysisRunId}`, JSON.stringify({
        ...result,
        datasetName,
        datasetType,
        demo_id: selectedDemo,
        analysisRunId,
      }));

      setTimeout(() => {
        router.push(`/dashboard?run=${encodeURIComponent(analysisRunId)}`);
      }, 600);
    } catch (err: unknown) {
      clearInterval(progressInterval);
      const message =
        err instanceof DOMException && err.name === 'AbortError'
          ? 'Analysis request timed out. Please try a smaller CSV or retry.'
          : err instanceof Error
          ? err.message
          : 'Analysis failed';
      setError(message);
      setIsAnalyzing(false);
      setProgress(0);
      toast.error(message);
    }
  }

  function clearData() {
    setFile(null);
    setParsedData(null);
    setSelectedDemo(null);
    setError(null);
  }

  return (
    <main className="min-h-screen bg-bg grid-bg">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-text-dim hover:text-text transition-colors text-sm font-body"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent" />
          <span className="font-display font-bold text-text">FairLens</span>
        </div>
        <BackendStatusBadge />
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 section-reveal">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-text mb-3 hero-copy tracking-tight">
            Upload Your Dataset
          </h1>
          <p className="text-text-dim font-body text-lg max-w-2xl mx-auto leading-relaxed">
            Upload a CSV or pick a demo dataset. The live backend analyzes it in seconds and shows you the active mode.
          </p>
        </div>

        {/* Demo Datasets */}
        <div className="mb-8">
          <p className="text-text-dim text-sm font-body mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            Quick Start — Try a Demo Dataset
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.values(DEMO_DATASETS) as typeof DEMO_DATASETS[DatasetId][]).map((ds) => (
              <TiltCard key={ds.id}>
                <button
                  onClick={() => handleDemoSelect(ds.id as DatasetId)}
                  className={cn(
                    'p-4 rounded-xl border text-left transition-all card-lift hover-tilt-3d h-full w-full soft-border card-shell interaction-pop',
                    selectedDemo === ds.id
                      ? 'border-accent/50 bg-accent/5 shadow-glow-sm'
                      : 'border-white/5 bg-surface hover:border-white/10'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{ds.icon}</span>
                    {selectedDemo === ds.id && (
                      <CheckCircle className="w-4 h-4 text-accent" />
                    )}
                  </div>
                  <p className="font-display text-sm font-semibold text-text mb-1">{ds.name}</p>
                  <p className="text-text-dim text-xs font-body">{ds.rows} records</p>
                  <div
                    className="mt-2 text-xs font-mono font-bold px-2 py-0.5 rounded-full inline-block"
                    style={{ color: ds.color, background: ds.color + '20' }}
                  >
                    DEMO
                  </div>
                </button>
              </TiltCard>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-text-dim text-sm font-body">or upload your own</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* Dropzone */}
        <TiltCard className="mb-8">
          <div
            {...getRootProps()}
            className={cn(
              'relative rounded-2xl border-2 border-dashed p-7 sm:p-10 text-center cursor-pointer transition-all interaction-pop hover-tilt-3d',
              isDragActive
                ? 'border-accent bg-accent/5 shadow-glow-sm'
                : parsedData && !selectedDemo
                ? 'border-accent/40 bg-accent/5'
                : 'border-white/10 bg-surface hover:border-white/20'
            )}
          >
            <input {...getInputProps()} />
            
            {file && parsedData && !selectedDemo ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="font-display font-semibold text-text">{file.name}</p>
                  <p className="text-text-dim text-sm font-body mt-1">
                    {parsedData.rows.length} records · {parsedData.headers.length} columns
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); clearData(); }}
                  className="text-text-dim hover:text-danger transition-colors mt-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                  isDragActive ? 'bg-accent/20' : 'bg-surface-2'
                )}>
                  <Upload className={cn('w-6 h-6', isDragActive ? 'text-accent' : 'text-text-dim')} />
                </div>
                <div>
                  <p className="font-display font-semibold text-text">
                    {isDragActive ? 'Drop it here' : 'Drag & drop your CSV'}
                  </p>
                  <p className="text-text-dim text-sm font-body mt-1">
                    or <span className="text-accent underline">browse files</span> · Max 5MB
                  </p>
                </div>
                <p className="text-text-dim text-xs font-mono">
                  Supports: CSV · TSV · TXT
                </p>
              </div>
            )}
          </div>
        </TiltCard>

        {/* Preview Table */}
        {parsedData && parsedData.rows.length > 0 && (
          <div className="mb-8 rounded-xl bg-surface border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-text-dim" />
                <span className="text-sm font-body text-text-dim">
                  Preview — {parsedData.rows.length} rows · {parsedData.headers.length} columns
                </span>
              </div>
              <span className="text-xs font-mono text-accent">
                {selectedDemo ? DEMO_DATASETS[selectedDemo].name : file?.name}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="bg-surface-2">
                    {parsedData.headers.slice(0, 7).map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-text-dim font-medium border-r border-white/5 last:border-0">
                        {h}
                      </th>
                    ))}
                    {parsedData.headers.length > 7 && (
                      <th className="px-3 py-2 text-text-dim">+{parsedData.headers.length - 7}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t border-white/5 hover:bg-surface-2 transition-colors">
                      {parsedData.headers.slice(0, 7).map((h) => (
                        <td key={h} className="px-3 py-2 text-text-dim border-r border-white/5 last:border-0 max-w-[120px] truncate">
                          {row[h] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-danger/10 border border-danger/20 mb-6 soft-border">
            <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-danger text-sm font-semibold font-body">Analysis Failed</p>
              <p className="text-danger/80 text-xs font-body mt-1">{error}</p>
              {isCsvInputError(error) ? (
                <p className="text-text-dim text-xs font-body mt-2">
                  Check CSV headers and ensure there are at least 5 rows and a decision/outcome column.
                </p>
              ) : (
                <p className="text-text-dim text-xs font-body mt-2">
                  The dataset looks valid. This is likely a temporary provider-side issue. Retry in a few seconds.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={runAnalysis}
          disabled={!parsedData || isAnalyzing}
          className={cn(
            'w-full py-4 rounded-xl font-semibold text-base font-body transition-all flex items-center justify-center gap-3',
            parsedData && !isAnalyzing
              ? 'bg-accent text-bg hover:bg-accent-dim hover:shadow-glow-md cursor-pointer'
              : 'bg-surface-2 text-muted cursor-not-allowed'
          )}
        >
          {isAnalyzing ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                <span className="text-bg">{progressLabel || 'Analyzing...'}</span>
              </div>
              <div className="w-full max-w-xs bg-bg/30 rounded-full h-1.5 mt-1">
                <div
                  className="h-1.5 bg-bg rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              {parsedData ? 'Run Bias Analysis with Gemini' : 'Select a Dataset to Analyze'}
              {parsedData && <ChevronRight className="w-4 h-4" />}
            </>
          )}
        </button>

        {parsedData && !isAnalyzing && (
          <p className="text-center text-text-dim text-xs font-body mt-3 display-micro">
            Analysis uses Gemini when configured, with a local fallback for development
          </p>
        )}
      </div>
    </main>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <UploadContent />
    </Suspense>
  );
}
