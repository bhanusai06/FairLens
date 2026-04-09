import { NextRequest, NextResponse } from 'next/server';
import { analyzeBias, getGeminiModelName } from '@/lib/gemini';
import { sanitizeCSV, detectDatasetType } from '@/lib/utils';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { z } from 'zod';

const BodySchema = z.object({
  csvData: z.string().min(10).max(60000),
  datasetType: z.string().optional(),
  datasetName: z.string().optional(),
});

function countNonEmptyLines(text: string): number {
  return text.split('\n').filter((line) => line.trim().length > 0).length;
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'fairlens-api',
      route: '/api/analyze',
      method: 'POST',
      message: 'Send a POST request with csvData, datasetType, and datasetName to analyze a dataset.',
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        Allow: 'GET, POST, OPTIONS',
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, OPTIONS',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(req);
    if (!rateLimit(ip, 10, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before analyzing again.' },
        { status: 429 }
      );
    }

    // Parse & validate body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request: ' + parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { csvData, datasetType, datasetName } = parsed.data;

    // Sanitize input
    const cleanedCSV = sanitizeCSV(csvData);
    if (cleanedCSV.length < 10) {
      return NextResponse.json(
        { error: 'CSV content is empty after sanitization.' },
        { status: 400 }
      );
    }
    
    // Auto-detect dataset type if not provided
    const firstLine = cleanedCSV.split('\n')[0] || '';
    const headers = firstLine
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);

    if (headers.length < 2) {
      return NextResponse.json(
        { error: 'CSV must include at least 2 header columns.' },
        { status: 400 }
      );
    }

    const rowCount = countNonEmptyLines(cleanedCSV) - 1;
    if (rowCount < 5) {
      return NextResponse.json(
        { error: 'Dataset too small. Need at least 5 data rows.' },
        { status: 400 }
      );
    }

    const detectedType = datasetType || detectDatasetType(headers);

    // Run analysis
    const result = await analyzeBias(cleanedCSV, detectedType);

    // Add metadata
    const response = {
      ...result,
      metadata: {
        dataset_name: datasetName || 'Custom Dataset',
        dataset_type: detectedType,
        analysis_mode: result.analysis_mode ?? 'gemini',
        model: getGeminiModelName(),
        analyzed_at: new Date().toISOString(),
        headers,
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: unknown) {
    console.error('[/api/analyze] Error:', err);
    
    const message =
      err instanceof Error ? err.message : 'Unknown error occurred';

    // Gemini quota exceeded
    if (message.includes('quota') || message.includes('429')) {
      return NextResponse.json(
        { error: 'Gemini API quota exceeded. Please try again later or check your API key.' },
        { status: 429 }
      );
    }

    // Gemini API key invalid
    if (message.includes('API_KEY') || message.includes('401')) {
      return NextResponse.json(
        { error: 'Invalid Gemini API key. Please check your GEMINI_API_KEY environment variable.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Analysis failed: ' + message },
      { status: 500 }
    );
  }
}
