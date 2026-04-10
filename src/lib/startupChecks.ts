const STARTUP_WARNING_FLAG = '__fairlens_startup_warning_emitted__';

export function runServerStartupChecks(): void {
  const state = globalThis as typeof globalThis & {
    [STARTUP_WARNING_FLAG]?: boolean;
  };

  if (state[STARTUP_WARNING_FLAG]) {
    return;
  }

  state[STARTUP_WARNING_FLAG] = true;

  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!geminiKey) {
    console.warn(
      '[startup-check] GEMINI_API_KEY is missing. Configure it in your deployment environment (for example Vercel Project Settings -> Environment Variables).'
    );
  }
}