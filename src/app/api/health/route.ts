import { NextResponse } from 'next/server';
import { getGeminiModelName, isGeminiConfigured } from '@/lib/gemini';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'fairlens-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      gemini: isGeminiConfigured() ? 'configured' : 'missing',
      analysis_mode: isGeminiConfigured() ? 'gemini' : 'heuristic',
      model: getGeminiModelName(),
    },
    { status: 200 }
  );
}
