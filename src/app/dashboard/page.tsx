'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, AlertTriangle, CheckCircle, Download,
  ArrowLeft, RefreshCw, TrendingDown, Users, BarChart2,
  AlertCircle, ChevronDown, ChevronUp, Info, Zap
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts';
import { BiasAnalysisResult, getSeverityColor, getSeverityLabel } from '@/lib/gemini';
import { cn, getScoreGrade } from '@/lib/utils';
import CountUp from 'react-countup';
import { TiltCard } from '@/components/ui/TiltCard';
import { BackendStatusBadge } from '@/components/ui/BackendStatusBadge';

// Circular gauge component
function BiasGauge({ score }: { score: number }) {
  const [animated, setAnimated] = useState(false);
  const size = 200;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - ((animated ? score : 0) / 100) * circumference;
  const color = getSeverityColor(score);
  const grade = getScoreGrade(score);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-20"
        style={{ background: color }}
      />

      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-xs font-medium" style={{ color }}>BIAS SCORE</span>
        <span className="font-display text-5xl font-extrabold" style={{ color }}>
          {animated ? <CountUp end={score} duration={2} /> : 0}
        </span>
        <span className="font-display text-sm font-bold text-text-dim">/ 100</span>
        <div
          className="mt-2 px-3 py-0.5 rounded-full text-xs font-mono font-bold"
          style={{ color, background: color + '20' }}
        >
          {getSeverityLabel(score)} BIAS
        </div>
      </div>
    </div>
  );
}

// Mini metric card
function MetricCard({ label, value, max = 100, color = '#00E5C3' }: {
  label: string; value: number; max?: number; color?: string;
}) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW((value / max) * 100), 400);
    return () => clearTimeout(t);
  }, [value, max]);

  return (
    <div className="p-4 rounded-xl bg-surface-2 border border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-body text-text-dim">{label}</span>
        <span className="text-sm font-mono font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 bg-bg rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${w}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [result, setResult] = useState<BiasAnalysisResult & {
    datasetName?: string;
    datasetType?: string;
    metadata?: { analyzed_at?: string; analysis_mode?: string; model?: string };
  } | null>(null);
  const [expandedFlag, setExpandedFlag] = useState<number | null>(null);
  const [showAllFlags, setShowAllFlags] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const currentRunId = searchParams.get('run');

    if (!currentRunId) {
      router.push('/upload');
      return;
    }

    const stored = sessionStorage.getItem(`fairlens_result:${currentRunId}`);

    if (!stored) {
      router.push('/upload');
      return;
    }
    try {
      setResult(JSON.parse(stored));
    } catch {
      router.push('/upload');
    }
  }, [router]);

  if (!result) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const primaryColor = getSeverityColor(result.bias_score);
  const visibleFlags = showAllFlags
    ? result.flagged_decisions
    : result.flagged_decisions.slice(0, 4);

  const radarData = result.fairness_metrics
    ? [
        { subject: 'Demographic Parity', value: result.fairness_metrics.demographic_parity },
        { subject: 'Equal Opportunity', value: result.fairness_metrics.equal_opportunity },
        { subject: 'Predictive Parity', value: result.fairness_metrics.predictive_parity },
        { subject: 'Individual Fairness', value: result.fairness_metrics.individual_fairness },
      ]
    : [];

  const attributeChartData = result.affected_attributes.map((a) => ({
    name: a.attribute,
    bias: a.bias_score,
    impact: a.impact_percentage,
  }));

  const topAttribute = result.affected_attributes[0];
  const topMitigation = result.mitigation_steps[0];
  const riskLabel = result.bias_score >= 75 ? 'critical' : result.bias_score >= 45 ? 'elevated' : 'contained';

  function handleDownload() {
    const report = `
FAIRLENS BIAS AUDIT REPORT
===========================
Dataset: ${result?.datasetName || 'Unknown'}
Analyzed: ${result?.metadata?.analyzed_at ? new Date(result.metadata.analyzed_at).toLocaleString() : 'N/A'}

BIAS SCORE: ${result?.bias_score}/100 (${getSeverityLabel(result?.bias_score || 0)} BIAS)
Confidence: ${result?.confidence}%

DATASET STATISTICS
Total Records: ${result?.dataset_stats?.total_records}
Biased Decisions: ${result?.dataset_stats?.biased_decisions}
Bias Rate: ${result?.dataset_stats?.bias_percentage?.toFixed(1)}%
Primary Attribute: ${result?.dataset_stats?.primary_attribute}

EXPLANATION
${result?.explanation}

ROOT CAUSE
${result?.root_cause}

AFFECTED ATTRIBUTES
${result?.affected_attributes?.map((a) =>
  `- ${a.attribute}: Score ${a.bias_score}/100, ${a.affected_group} disadvantaged vs ${a.favored_group} (${a.impact_percentage}% of decisions)`
).join('\n')}

FAIRNESS METRICS
- Demographic Parity: ${result?.fairness_metrics?.demographic_parity}/100
- Equal Opportunity: ${result?.fairness_metrics?.equal_opportunity}/100
- Predictive Parity: ${result?.fairness_metrics?.predictive_parity}/100
- Individual Fairness: ${result?.fairness_metrics?.individual_fairness}/100

MITIGATION STEPS
${result?.mitigation_steps?.map((s) =>
  `${s.step}. ${s.title}\n   ${s.description}\n   Action: ${s.technical_action}\n   Est. Improvement: -${s.estimated_improvement} bias points`
).join('\n\n')}

---
Generated by FairLens - AI Bias Detection Platform
Powered by Gemini 1.5 Pro
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fairlens-audit-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-bg" ref={reportRef}>
      {/* Top gradient */}
      <div
        className="fixed top-0 left-0 right-0 h-1 z-50"
        style={{ background: `linear-gradient(90deg, ${primaryColor}, transparent)` }}
      />

      {/* Nav */}
      <nav className="sticky top-0 z-40 glass border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/upload')}
            className="flex items-center gap-2 text-text-dim hover:text-text transition-colors text-sm font-body"
          >
            <ArrowLeft className="w-4 h-4" />
            New Analysis
          </button>

          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <span className="font-display font-bold text-text">FairLens</span>
            <span className="text-text-dim text-sm font-body">- Audit Report</span>
          </div>

          <div className="flex items-center gap-3">
            <BackendStatusBadge />
            <button
              onClick={() => router.push('/upload')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-2 border border-white/5 text-text-dim hover:text-text text-xs font-body transition-colors interaction-pop hover-tilt-3d"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-analyze
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-bg text-xs font-semibold font-body hover:bg-accent-dim transition-all hover:shadow-glow-sm interaction-pop hover-tilt-3d"
            >
              <Download className="w-3.5 h-3.5" />
              Export Report
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Dataset header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-text hero-copy tracking-tight">
              {result.datasetName || 'Bias Audit'}
            </h1>
            <p className="text-text-dim text-sm font-body mt-1">
              {result.datasetType} · {result.dataset_stats?.total_records} records analyzed ·{' '}
              {result.metadata?.analyzed_at
                ? new Date(result.metadata.analyzed_at).toLocaleString()
                : 'Just now'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="px-4 py-2 rounded-full text-sm font-mono font-bold"
              style={{ color: primaryColor, background: primaryColor + '20' }}
            >
              {getSeverityLabel(result.bias_score)} BIAS
            </div>
            <div className="px-3 py-2 rounded-full bg-surface-2 text-xs font-mono text-text-dim">
              {result.confidence}% confidence
            </div>
            <div className="px-3 py-2 rounded-full bg-surface-2 text-xs font-mono text-text-dim capitalize">
              {result.metadata?.analysis_mode || result.analysis_mode || 'gemini'} mode
            </div>
          </div>
        </div>

        {(result.metadata?.analysis_mode === 'heuristic' || result.analysis_mode === 'heuristic') && (
          <div className="mb-6 rounded-2xl border border-warning/20 bg-warning/10 p-4 soft-border">
            <p className="text-warning text-sm font-semibold font-body">Heuristic analysis mode active</p>
            <p className="text-text-dim text-sm font-body mt-1 leading-relaxed">
              This result was generated with the deterministic heuristic audit instead of Gemini.
              The backend is still working and the dashboard remains usable.
            </p>
          </div>
        )}

        {/* Executive summary */}
        <div className="mb-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="p-6 rounded-2xl bg-surface border border-white/5 soft-border card-shell hover-tilt-3d">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-accent text-xs font-mono font-bold mb-2">Executive summary</p>
                <h2 className="font-display text-2xl font-bold text-text">This dataset is {riskLabel} risk.</h2>
              </div>
              <div className="px-3 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-mono font-bold">
                {result.bias_score}/100
              </div>
            </div>
            <p className="text-text-dim text-sm font-body leading-relaxed mb-4">
              {topAttribute
                ? `The strongest signal is ${topAttribute.attribute}, where ${topAttribute.affected_group} is disadvantaged versus ${topAttribute.favored_group}.`
                : 'The analysis detected multiple bias signals, but no dominant attribute surfaced.'}
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-bg/60 border border-white/5">
                <p className="text-text-dim text-xs font-body mb-1">Primary risk</p>
                <p className="text-text font-display font-semibold capitalize">{result.dataset_stats?.primary_attribute || 'Unknown'}</p>
              </div>
              <div className="p-4 rounded-xl bg-bg/60 border border-white/5">
                <p className="text-text-dim text-xs font-body mb-1">Top impact</p>
                <p className="text-text font-display font-semibold">
                  {topAttribute ? `${topAttribute.impact_percentage}%` : 'N/A'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-bg/60 border border-white/5">
                <p className="text-text-dim text-xs font-body mb-1">Best next step</p>
                <p className="text-text font-display font-semibold">{topMitigation?.title || 'Review'}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="p-5 rounded-2xl bg-surface border border-white/5 soft-border card-shell hover-tilt-3d">
              <p className="text-text-dim text-xs font-body mb-2">Recommended action</p>
              <p className="text-text font-display text-lg font-bold mb-2">Apply mitigation before model release</p>
              <p className="text-text-dim text-sm font-body leading-relaxed">
                The fastest way to reduce exposure is to review the flagged group, remove or transform proxy features, and retest the decision path.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-white/5 soft-border card-shell hover-tilt-3d">
              <p className="text-text-dim text-xs font-body mb-2">Accountability note</p>
              <p className="text-text font-display text-lg font-bold mb-2">Every result is exportable</p>
              <p className="text-text-dim text-sm font-body leading-relaxed">
                The report is designed for engineering, compliance, and leadership handoff without extra formatting work.
              </p>
            </div>
          </div>
        </div>

        {/* TOP ROW: Gauge + Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Gauge */}
          <TiltCard className="md:col-span-1">
            <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-surface border border-white/5 soft-border card-shell h-full hover-tilt-3d shimmer-sweep">
              <BiasGauge score={result.bias_score} />
              <div className="mt-4 text-center">
                <p className="font-display text-2xl font-bold text-text">
                  Grade: {getScoreGrade(result.bias_score)}
                </p>
                <p className="text-text-dim text-xs font-body mt-1">Fairness Grade</p>
              </div>
            </div>
          </TiltCard>

          {/* Stats grid */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <TiltCard>
              <div className="p-5 rounded-2xl bg-surface border border-white/5 flex flex-col justify-between soft-border card-shell h-full hover-tilt-3d">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-text-dim" />
                  <span className="text-text-dim text-xs font-body">Biased Decisions</span>
                </div>
                <div>
                  <span className="font-display text-4xl font-bold" style={{ color: primaryColor }}>
                    <CountUp end={result.dataset_stats?.biased_decisions || 0} duration={2} />
                  </span>
                  <span className="text-text-dim text-sm font-body ml-2">
                    / {result.dataset_stats?.total_records || 0} total
                  </span>
                </div>
                <div className="mt-3 h-1.5 bg-surface-2 rounded-full">
                  <div
                    className="h-1.5 rounded-full transition-all duration-1000"
                    style={{
                      width: `${result.dataset_stats?.bias_percentage || 0}%`,
                      background: primaryColor,
                    }}
                  />
                </div>
              </div>
            </TiltCard>

            <TiltCard>
              <div className="p-5 rounded-2xl bg-surface border border-white/5 soft-border card-shell h-full hover-tilt-3d">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 className="w-4 h-4 text-text-dim" />
                  <span className="text-text-dim text-xs font-body">Attributes Affected</span>
                </div>
                <span className="font-display text-4xl font-bold text-text">
                  {result.affected_attributes?.length || 0}
                </span>
                <div className="mt-3 flex flex-wrap gap-1">
                  {result.affected_attributes?.slice(0, 4).map((a) => (
                    <span
                      key={a.attribute}
                      className="px-2 py-0.5 rounded text-xs font-mono"
                      style={{ color: getSeverityColor(a.bias_score), background: getSeverityColor(a.bias_score) + '20' }}
                    >
                      {a.attribute}
                    </span>
                  ))}
                </div>
              </div>
            </TiltCard>

            <TiltCard>
              <div className="p-5 rounded-2xl bg-surface border border-white/5 soft-border card-shell h-full hover-tilt-3d">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-text-dim" />
                  <span className="text-text-dim text-xs font-body">Primary Issue</span>
                </div>
                <p className="font-display text-sm font-bold text-text capitalize">
                  {result.dataset_stats?.primary_attribute || 'Unknown'}
                </p>
                <p className="text-text-dim text-xs font-body mt-1">Most biased attribute</p>
              </div>
            </TiltCard>

            <TiltCard>
              <div className="p-5 rounded-2xl bg-surface border border-white/5 soft-border card-shell h-full hover-tilt-3d">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-text-dim" />
                  <span className="text-text-dim text-xs font-body">Potential Reduction</span>
                </div>
                <span className="font-display text-4xl font-bold text-accent">
                  -{result.mitigation_steps?.reduce((s, m) => s + m.estimated_improvement, 0) || 0}
                </span>
                <p className="text-text-dim text-xs font-body mt-1">points if mitigated</p>
              </div>
            </TiltCard>
          </div>
        </div>

        {/* EXPLANATION */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="p-6 rounded-2xl bg-surface border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                <Info className="w-3.5 h-3.5 text-accent" />
              </div>
              <h2 className="font-display text-base font-semibold text-text">What the analysis engine found</h2>
            </div>
            <p className="text-text-dim text-sm font-body leading-relaxed">{result.explanation}</p>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-danger/10 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-danger" />
              </div>
              <h2 className="font-display text-base font-semibold text-text">Root Cause</h2>
            </div>
            <p className="text-text-dim text-sm font-body leading-relaxed">{result.root_cause}</p>
          </div>
        </div>

        {/* CHARTS ROW */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Attribute Bias Chart */}
          <div className="p-6 rounded-2xl bg-surface border border-white/5">
            <h2 className="font-display text-base font-semibold text-text mb-4">
              Bias by Attribute
            </h2>
            {attributeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={attributeChartData} barSize={24}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#9090B0', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#9090B0', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1A1A24',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '8px',
                      color: '#E8E8F0',
                      fontFamily: 'Manrope',
                      fontSize: 12,
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar
                    dataKey="bias"
                    radius={[4, 4, 0, 0]}
                    animationDuration={900}
                    animationEasing="ease-out"
                    activeBar={{ stroke: '#E8E8F0', strokeOpacity: 0.35, strokeWidth: 1 }}
                  >
                    {attributeChartData.map((entry, i) => (
                      <Cell key={i} fill={getSeverityColor(entry.bias)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-text-dim text-sm font-body">
                No attribute data
              </div>
            )}
          </div>

          {/* Fairness Radar */}
          <div className="p-6 rounded-2xl bg-surface border border-white/5">
            <h2 className="font-display text-base font-semibold text-text mb-4">
              Fairness Metrics Radar
            </h2>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#9090B0', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                  />
                  <Radar
                    name="Fairness"
                    dataKey="value"
                    stroke="#00E5C3"
                    fill="#00E5C3"
                    fillOpacity={0.1}
                    dot={{ r: 3, fill: '#00E5C3' }}
                    isAnimationActive
                    animationDuration={950}
                    animationEasing="ease-out"
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-text-dim text-sm">No data</div>
            )}
          </div>
        </div>

        {/* FAIRNESS METRICS */}
        {result.fairness_metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Demographic Parity', value: result.fairness_metrics.demographic_parity },
              { label: 'Equal Opportunity', value: result.fairness_metrics.equal_opportunity },
              { label: 'Predictive Parity', value: result.fairness_metrics.predictive_parity },
              { label: 'Individual Fairness', value: result.fairness_metrics.individual_fairness },
            ].map((m) => (
              <MetricCard
                key={m.label}
                label={m.label}
                value={m.value}
                color={getSeverityColor(m.value)}
              />
            ))}
          </div>
        )}

        {/* FLAGGED DECISIONS */}
        {result.flagged_decisions && result.flagged_decisions.length > 0 && (
          <div className="mb-6 rounded-2xl bg-surface border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-danger" />
                <h2 className="font-display text-base font-semibold text-text">
                  Flagged Decisions ({result.flagged_decisions.length})
                </h2>
              </div>
              <span className="text-text-dim text-xs font-mono">
                Showing {visibleFlags.length} of {result.flagged_decisions.length}
              </span>
            </div>

            <div className="divide-y divide-white/5">
              {visibleFlags.map((flag, i) => {
                const severityColor = flag.severity === 'high' ? '#FF4D6D'
                  : flag.severity === 'medium' ? '#FFB347' : '#FFD700';
                return (
                  <div key={i} className="px-6 py-4 hover:bg-surface-2 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: severityColor + '20' }}
                        >
                          <span className="text-xs font-mono font-bold" style={{ color: severityColor }}>
                            {flag.id}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-body text-sm font-semibold text-text capitalize">
                              {flag.decision}
                            </span>
                            <span
                              className="px-2 py-0.5 rounded text-xs font-mono uppercase"
                              style={{ color: severityColor, background: severityColor + '20' }}
                            >
                              {flag.severity}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-surface-3 text-xs font-mono text-text-dim">
                              {flag.bias_type}
                            </span>
                          </div>
                          <p className="text-text-dim text-xs font-body">{flag.explanation}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setExpandedFlag(expandedFlag === i ? null : i)}
                        className="text-text-dim hover:text-text transition-colors flex-shrink-0"
                      >
                        {expandedFlag === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {expandedFlag === i && (
                      <div className="mt-3 pl-9 p-3 rounded-lg bg-surface-2 border border-white/5">
                        <p className="text-xs font-mono text-text-dim">
                          Protected attribute: <span className="text-accent">{flag.protected_attribute}</span>
                        </p>
                        <p className="text-xs font-body text-text-dim mt-1">{flag.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {result.flagged_decisions.length > 4 && (
              <div className="px-6 py-3 border-t border-white/5">
                <button
                  onClick={() => setShowAllFlags(!showAllFlags)}
                  className="text-accent text-sm font-body hover:text-accent-dim transition-colors"
                >
                  {showAllFlags
                    ? 'Show fewer'
                    : `Show all ${result.flagged_decisions.length} flagged decisions`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* MITIGATION STEPS */}
        {result.mitigation_steps && result.mitigation_steps.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display text-lg font-bold text-text mb-4">
              Mitigation Roadmap
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {result.mitigation_steps.map((step) => (
                <div
                  key={step.step}
                  className="p-6 rounded-2xl bg-surface border border-white/5 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent to-transparent" />
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                      <span className="font-mono text-sm font-bold text-accent">{step.step}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-mono text-accent">
                      <TrendingDown className="w-3.5 h-3.5" />
                      -{step.estimated_improvement} pts
                    </div>
                  </div>

                  <h3 className="font-display text-sm font-bold text-text mb-2">{step.title}</h3>
                  <p className="text-text-dim text-xs font-body leading-relaxed mb-3">
                    {step.description}
                  </p>
                  <div className="p-2.5 rounded-lg bg-surface-2 border border-white/5">
                    <p className="text-xs font-mono text-text-dim leading-relaxed">
                      {step.technical_action}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-accent text-bg font-semibold rounded-xl hover:bg-accent-dim transition-all hover:shadow-glow-sm font-body"
          >
            <Download className="w-4 h-4" />
            Download Full Report
          </button>
          <button
            onClick={() => router.push('/upload')}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-surface-2 border border-white/5 text-text rounded-xl hover:border-white/10 transition-all font-body"
          >
            <RefreshCw className="w-4 h-4" />
            Analyze Another Dataset
          </button>
        </div>

        {/* Powered by */}
        <div className="flex items-center justify-center gap-3 mt-8 pt-8 border-t border-white/5">
          <CheckCircle className="w-4 h-4 text-accent" />
          <p className="text-text-dim text-xs font-body">
            Analysis powered by <span className="text-accent font-semibold">{result.metadata?.analysis_mode === 'gemini' ? (result.metadata?.model || 'Gemini') : 'local heuristic mode'}</span> ·
            Built for continuous AI fairness operations
          </p>
        </div>
      </div>
    </main>
  );
}
