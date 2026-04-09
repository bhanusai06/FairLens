'use client';

import { useEffect } from 'react';
import { Shield, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[FairLens Global Error]', error);
  }, [error]);

  return (
    <html>
      <body style={{ background: '#0A0A0F', color: '#E8E8F0', fontFamily: 'Manrope, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Shield style={{ width: 32, height: 32, color: '#FF4D6D' }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Something went wrong</h1>
            <p style={{ color: '#9090B0', marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
              {error.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <button
              onClick={reset}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', background: '#00E5C3', color: '#0A0A0F',
                border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer', fontSize: 14,
              }}
            >
              <RefreshCw style={{ width: 16, height: 16 }} />
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
