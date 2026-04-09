import Papa from 'papaparse';
import JSON5 from 'json5';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

type AnalysisMode = 'gemini' | 'heuristic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';

export interface BiasAnalysisResult {
  analysis_mode?: AnalysisMode;
  bias_score: number; // 0-100, higher = more biased
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_attributes: AttributeBias[];
  flagged_decisions: FlaggedDecision[];
  explanation: string;
  root_cause: string;
  mitigation_steps: MitigationStep[];
  fairness_metrics: FairnessMetrics;
  confidence: number;
  dataset_stats: DatasetStats;
}

type CsvRow = Record<string, string>;

type ColumnAnalysis = {
  attribute: string;
  bias_score: number;
  disparity_ratio: number;
  affected_group: string;
  favored_group: string;
  impact_percentage: number;
  disadvantaged_rate: number;
  favored_rate: number;
  disadvantaged_rows: CsvRow[];
};

export interface AttributeBias {
  attribute: string;
  bias_score: number;
  disparity_ratio: number;
  affected_group: string;
  favored_group: string;
  impact_percentage: number;
}

export interface FlaggedDecision {
  id: string | number;
  decision: string;
  bias_type: string;
  severity: 'low' | 'medium' | 'high';
  explanation: string;
  protected_attribute: string;
}

export interface MitigationStep {
  step: number;
  title: string;
  description: string;
  technical_action: string;
  estimated_improvement: number;
}

export interface FairnessMetrics {
  demographic_parity: number;
  equal_opportunity: number;
  predictive_parity: number;
  individual_fairness: number;
}

export interface DatasetStats {
  total_records: number;
  biased_decisions: number;
  bias_percentage: number;
  primary_attribute: string;
}

export function getGeminiModelName(): string {
  return GEMINI_MODEL;
}

const BIAS_ANALYSIS_PROMPT = (csvData: string, datasetType: string) => `
You are an expert AI fairness researcher with 20 years of experience in algorithmic bias detection.
Analyze the following ${datasetType} dataset for bias in AI decision-making.

DATASET:
${csvData.slice(0, 8000)}

TASK: Perform a comprehensive bias audit and return ONLY valid JSON (no markdown, no explanation outside JSON).

Return this exact JSON structure:
{
  "bias_score": <integer 0-100, where 0=no bias, 100=extreme bias>,
  "severity": <"low"|"medium"|"high"|"critical">,
  "confidence": <integer 0-100>,
  "dataset_stats": {
    "total_records": <number>,
    "biased_decisions": <number>,
    "bias_percentage": <number 0-100>,
    "primary_attribute": <"the main biased attribute">
  },
  "affected_attributes": [
    {
      "attribute": <"attribute name">,
      "bias_score": <integer 0-100>,
      "disparity_ratio": <float, ratio of outcomes>,
      "affected_group": <"the disadvantaged group">,
      "favored_group": <"the advantaged group">,
      "impact_percentage": <integer, % of decisions affected>
    }
  ],
  "flagged_decisions": [
    {
      "id": <row id>,
      "decision": <"the decision made">,
      "bias_type": <"statistical|proxy|historical|measurement">,
      "severity": <"low"|"medium"|"high">,
      "explanation": <"1 sentence why this is biased">,
      "protected_attribute": <"which attribute is being discriminated against">
    }
  ],
  "explanation": <"3-4 sentence plain English explanation of the bias found, what patterns exist, and who is being harmed">,
  "root_cause": <"2-3 sentence technical explanation of why the model is biased - what proxy variables or historical patterns are causing it">,
  "fairness_metrics": {
    "demographic_parity": <integer 0-100>,
    "equal_opportunity": <integer 0-100>,
    "predictive_parity": <integer 0-100>,
    "individual_fairness": <integer 0-100>
  },
  "mitigation_steps": [
    {
      "step": 1,
      "title": <"short action title">,
      "description": <"2 sentence explanation">,
      "technical_action": <"specific technical implementation">,
      "estimated_improvement": <integer, expected bias_score reduction>
    },
    {
      "step": 2,
      "title": <"short action title">,
      "description": <"2 sentence explanation">,
      "technical_action": <"specific technical implementation">,
      "estimated_improvement": <integer>
    },
    {
      "step": 3,
      "title": <"short action title">,
      "description": <"2 sentence explanation">,
      "technical_action": <"specific technical implementation">,
      "estimated_improvement": <integer>
    }
  ]
}

Be specific, accurate, and honest. If bias is high (>60), say so clearly. Analyze real patterns in the data.
Return ONLY the JSON object, nothing else.
`;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function bucketValue(header: string, value: string): string {
  const normalizedHeader = header.toLowerCase();
  const trimmed = value.trim();

  if (!trimmed) return 'unknown';
  if (normalizedHeader.includes('age')) {
    const age = Number.parseInt(trimmed, 10);
    if (!Number.isNaN(age)) {
      if (age < 25) return 'under 25';
      if (age < 35) return '25-34';
      if (age < 50) return '35-49';
      return '50+';
    }
  }

  if (normalizedHeader.includes('zip')) return `${trimmed.slice(0, 3)}xx`;
  if (normalizedHeader.includes('income')) return trimmed;
  return trimmed;
}

function parseCsv(csvData: string): { headers: string[]; rows: CsvRow[] } {
  const parsed = Papa.parse<CsvRow>(csvData, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  const rows = (parsed.data || []).filter((row) =>
    Object.values(row || {}).some((value) => String(value ?? '').trim().length > 0)
  );

  return {
    headers: (parsed.meta.fields || []).filter(Boolean),
    rows,
  };
}

function getDecisionColumn(headers: string[]): string {
  const normalized = headers.map((header) => header.toLowerCase());
  const keywords = ['decision', 'status', 'outcome', 'result', 'approved', 'hired', 'denied', 'rejected', 'treatment', 'recommend'];

  for (const keyword of keywords) {
    const index = normalized.findIndex((header) => header.includes(keyword));
    if (index !== -1) return headers[index];
  }

  return headers[headers.length - 1] || 'decision';
}

function isPositiveOutcome(header: string, value: string): boolean {
  const normalizedHeader = header.toLowerCase();
  const normalizedValue = normalize(value);

  const positiveTokens = ['yes', 'true', 'approved', 'hired', 'accepted', 'pass', 'promoted', 'advance', 'advanced', 'comprehensive', 'standard'];
  const negativeTokens = ['no', 'false', 'denied', 'rejected', 'declined', 'basic', 'minimal', 'watchful waiting'];

  if (normalizedHeader.includes('treatment') || normalizedHeader.includes('plan')) {
    return ['comprehensive', 'advanced', 'standard'].some((token) => normalizedValue.includes(token));
  }

  if (positiveTokens.some((token) => normalizedValue.includes(token))) return true;
  if (negativeTokens.some((token) => normalizedValue.includes(token))) return false;

  return normalizedValue.length > 0 && !normalizedValue.includes('reject') && !normalizedValue.includes('deny');
}

function detectProtectedColumns(headers: string[]): string[] {
  const patterns = ['gender', 'sex', 'race', 'ethnicity', 'age', 'zip', 'insurance', 'disability', 'religion', 'national'];
  return headers.filter((header) => {
    const normalized = header.toLowerCase();
    return patterns.some((pattern) => normalized.includes(pattern));
  });
}

function analyzeColumns(rows: CsvRow[], headers: string[], decisionColumn: string): ColumnAnalysis[] {
  const protectedColumns = detectProtectedColumns(headers);

  return protectedColumns.map((attribute) => {
    const groupStats = new Map<string, { total: number; positive: number; samples: CsvRow[] }>();

    rows.forEach((row) => {
      const group = bucketValue(attribute, row[attribute] ?? row[attribute.toLowerCase()] ?? 'unknown');
      const outcome = isPositiveOutcome(decisionColumn, row[decisionColumn] ?? '');
      const existing = groupStats.get(group) ?? { total: 0, positive: 0, samples: [] };

      existing.total += 1;
      existing.positive += outcome ? 1 : 0;
      if (existing.samples.length < 3) existing.samples.push(row);
      groupStats.set(group, existing);
    });

    const groups = Array.from(groupStats.entries()).map(([group, stats]) => ({
      group,
      ...stats,
      rate: stats.total ? stats.positive / stats.total : 0,
    }));

    if (groups.length < 2) {
      return {
        attribute,
        bias_score: 0,
        disparity_ratio: 1,
        affected_group: 'unknown',
        favored_group: 'unknown',
        impact_percentage: 0,
        disadvantaged_rate: 0,
        favored_rate: 0,
        disadvantaged_rows: [],
      };
    }

    const sorted = [...groups].sort((a, b) => a.rate - b.rate);
    const disadvantaged = sorted[0];
    const favored = sorted[sorted.length - 1];
    const rateGap = favored.rate - disadvantaged.rate;
    const disparityRatio = disadvantaged.rate > 0 ? favored.rate / disadvantaged.rate : favored.rate > 0 ? 10 : 1;
    const biasScore = clamp(Math.round(rateGap * 120 + (disparityRatio - 1) * 8), 8, 96);
    const impactPercentage = clamp(Math.round((disadvantaged.total / rows.length) * 100), 0, 100);

    return {
      attribute,
      bias_score: biasScore,
      disparity_ratio: Number(disparityRatio.toFixed(2)),
      affected_group: disadvantaged.group,
      favored_group: favored.group,
      impact_percentage: impactPercentage,
      disadvantaged_rate: Number((disadvantaged.rate * 100).toFixed(1)),
      favored_rate: Number((favored.rate * 100).toFixed(1)),
      disadvantaged_rows: disadvantaged.samples,
    };
  }).filter((column) => column.bias_score > 0);
}

function severityFromScore(score: number): BiasAnalysisResult['severity'] {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function buildFallbackAnalysis(csvData: string, datasetType: string): BiasAnalysisResult {
  const { headers, rows } = parseCsv(csvData);
  const decisionColumn = getDecisionColumn(headers);
  const attributeAnalyses = analyzeColumns(rows, headers, decisionColumn).sort((a, b) => b.bias_score - a.bias_score);
  const topAttributes = attributeAnalyses.slice(0, 3);
  const primaryAttribute = topAttributes[0]?.attribute || headers[headers.length - 1] || 'unknown';
  const biasScore = topAttributes.length > 0
    ? clamp(Math.round(topAttributes.reduce((sum, item) => sum + item.bias_score, 0) / topAttributes.length), 12, 94)
    : 25;

  const severity = severityFromScore(biasScore);
  const topAttributeList = topAttributes.map((item) => item.attribute).join(', ') || 'the available decision fields';
  const leadAttribute = topAttributes[0];
  const explanation = leadAttribute
    ? `This ${datasetType} dataset shows measurable outcome gaps across ${topAttributeList}. ${leadAttribute.affected_group} records receive fewer positive decisions than ${leadAttribute.favored_group}, which suggests the decision process is using correlated proxy signals instead of treating comparable cases equally.`
    : `This ${datasetType} dataset looks broadly balanced at the row level, but the available sample is still too small for a high-confidence fairness conclusion.`;

  const rootCause = leadAttribute
    ? `The strongest pattern is tied to ${leadAttribute.attribute}, where the positive outcome rate drops from ${leadAttribute.favored_rate}% for ${leadAttribute.favored_group} to ${leadAttribute.disadvantaged_rate}% for ${leadAttribute.affected_group}. That pattern usually points to historical bias, proxy features, or a threshold that is not calibrated across groups.`
    : `No dominant protected attribute was detected, so the current heuristic audit cannot isolate a single technical root cause.`;

  const totalRows = rows.length || 1;
  const biasedDecisions = topAttributes.reduce((sum, item) => sum + Math.max(1, Math.round((item.impact_percentage / 100) * totalRows * (1 - item.disadvantaged_rate / 100))), 0) || Math.round(totalRows * (biasScore / 220));

  const flaggedDecisions = topAttributes.flatMap((item) =>
    item.disadvantaged_rows.slice(0, 2).map((row, index) => ({
      id: row.id ?? row.ID ?? `${item.attribute}-${index + 1}`,
      decision: row[decisionColumn] ?? 'Decision',
      bias_type: item.attribute.includes('zip') ? 'proxy' : 'historical',
      severity: (item.bias_score >= 70 ? 'high' : 'medium') as FlaggedDecision['severity'],
      explanation: `${item.attribute} value "${bucketValue(item.attribute, row[item.attribute] ?? row[item.attribute.toLowerCase()] ?? 'unknown')}" is associated with a lower positive rate in this dataset.`,
      protected_attribute: item.attribute,
    }))
  ).slice(0, 10);

  const fairnessBaseline = clamp(100 - biasScore, 12, 95);

  return {
    analysis_mode: 'heuristic',
    bias_score: biasScore,
    severity,
    confidence: clamp(rows.length >= 10 ? 78 : 54, 40, 92),
    affected_attributes: topAttributes.map((item) => ({
      attribute: item.attribute,
      bias_score: item.bias_score,
      disparity_ratio: item.disparity_ratio,
      affected_group: item.affected_group,
      favored_group: item.favored_group,
      impact_percentage: item.impact_percentage,
    })),
    flagged_decisions: flaggedDecisions,
    explanation,
    root_cause: rootCause,
    mitigation_steps: [
      {
        step: 1,
        title: 'Remove proxy signals',
        description: `Review ${topAttributes[0]?.attribute || 'the most sensitive'} and any highly correlated fields to ensure the model is not learning protected status indirectly.`,
        technical_action: 'Run feature importance and correlation checks, then remove or mask highly predictive proxy fields before retraining.',
        estimated_improvement: clamp(Math.round(biasScore * 0.28), 6, 28),
      },
      {
        step: 2,
        title: 'Rebalance outcomes',
        description: 'Adjust the training or decision thresholds so under-served groups do not get systematically lower scores from the same evidence.',
        technical_action: 'Apply reweighting, resampling, or group-aware thresholds on the decision boundary.',
        estimated_improvement: clamp(Math.round(biasScore * 0.24), 5, 24),
      },
      {
        step: 3,
        title: 'Monitor fairness drift',
        description: 'Add a fairness regression check so future model updates cannot silently reintroduce the same pattern.',
        technical_action: 'Track demographic parity and equal-opportunity gaps in CI and alert on score regressions.',
        estimated_improvement: clamp(Math.round(biasScore * 0.18), 4, 18),
      },
    ],
    fairness_metrics: {
      demographic_parity: fairnessBaseline,
      equal_opportunity: clamp(fairnessBaseline + 4, 10, 98),
      predictive_parity: clamp(fairnessBaseline + 2, 10, 98),
      individual_fairness: clamp(fairnessBaseline + 1, 10, 98),
    },
    dataset_stats: {
      total_records: rows.length,
      biased_decisions: clamp(biasedDecisions, 0, rows.length),
      bias_percentage: rows.length ? Number(((biasedDecisions / rows.length) * 100).toFixed(1)) : 0,
      primary_attribute: primaryAttribute,
    },
  };
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function analyzeBias(
  csvData: string,
  datasetType: string = 'decision-making'
): Promise<BiasAnalysisResult> {
  if (!isGeminiConfigured()) {
    return buildFallbackAnalysis(csvData, datasetType);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
      generationConfig: {
        temperature: 0.1,
        topP: 0.95,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    });

    const prompt = BIAS_ANALYSIS_PROMPT(csvData, datasetType);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Strip any markdown fences
    const cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let parsed: BiasAnalysisResult;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Attempt to extract JSON from the response, then parse leniently.
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Gemini returned invalid JSON');

      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        parsed = JSON5.parse(jsonMatch[0]) as BiasAnalysisResult;
      }
    }

    // Validate required fields with fallbacks
    return {
      analysis_mode: 'gemini',
      bias_score: parsed.bias_score ?? 50,
      severity: parsed.severity ?? 'medium',
      confidence: parsed.confidence ?? 80,
      affected_attributes: parsed.affected_attributes ?? [],
      flagged_decisions: (parsed.flagged_decisions ?? []).slice(0, 10),
      explanation: parsed.explanation ?? 'Analysis complete.',
      root_cause: parsed.root_cause ?? 'Root cause analysis unavailable.',
      mitigation_steps: parsed.mitigation_steps ?? [],
      fairness_metrics: parsed.fairness_metrics ?? {
        demographic_parity: 50,
        equal_opportunity: 50,
        predictive_parity: 50,
        individual_fairness: 50,
      },
      dataset_stats: parsed.dataset_stats ?? {
        total_records: 0,
        biased_decisions: 0,
        bias_percentage: 0,
        primary_attribute: 'unknown',
      },
    };
  } catch (error) {
    console.warn('[gemini] Falling back to heuristic analysis:', error);
    return buildFallbackAnalysis(csvData, datasetType);
  }
}

export function getSeverityColor(score: number): string {
  if (score >= 80) return '#FF4D6D';
  if (score >= 60) return '#FFB347';
  if (score >= 40) return '#FFD700';
  return '#00E5C3';
}

export function getSeverityLabel(score: number): string {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}
