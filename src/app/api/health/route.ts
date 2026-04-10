import { NextRequest, NextResponse } from 'next/server';
import { getGeminiKeyFingerprint, getGeminiModelName, isGeminiConfigured, probeGeminiConnection } from '@/lib/gemini';
import { runServerStartupChecks } from '@/lib/startupChecks';

runServerStartupChecks();

export async function GET(req: NextRequest) {
  const probeRequested = req.nextUrl.searchParams.get('probe') === '1';
  const probe = probeRequested ? await probeGeminiConnection() : null;

  return NextResponse.json(
    {
      status: 'ok',
      service: 'fairlens-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      gemini: isGeminiConfigured() ? 'configured' : 'missing',
      analysis_mode: isGeminiConfigured() ? 'gemini' : 'heuristic',
      model: getGeminiModelName(),
      ...(probeRequested ? { key_fingerprint: getGeminiKeyFingerprint() } : {}),
      ...(probe ? { gemini_probe: probe } : {}),
    },
    { status: 200 }
  );
}
