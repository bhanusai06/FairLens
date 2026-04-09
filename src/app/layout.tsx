import type { Metadata } from 'next';
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { PageTransition } from '@/components/layout/PageTransition';

export const metadata: Metadata = {
  title: 'FairLens — AI Bias Detection Platform',
  description: 'Audit, detect, and fix bias in AI decision systems using Gemini 1.5 Pro. Built for fairness at scale.',
  keywords: ['AI bias', 'fairness', 'Gemini', 'machine learning', 'ethics', 'audit'],
  authors: [{ name: 'FairLens Team' }],
  openGraph: {
    title: 'FairLens — AI Bias Detection Platform',
    description: 'Real-time AI bias auditing powered by Gemini 1.5 Pro',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <PageTransition>{children}</PageTransition>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1A1A24',
              color: '#E8E8F0',
              border: '1px solid rgba(0,229,195,0.2)',
              borderRadius: '12px',
              fontFamily: 'Manrope, sans-serif',
            },
            success: {
              iconTheme: { primary: '#00E5C3', secondary: '#0A0A0F' },
            },
            error: {
              iconTheme: { primary: '#FF4D6D', secondary: '#0A0A0F' },
            },
          }}
        />
      </body>
    </html>
  );
}
