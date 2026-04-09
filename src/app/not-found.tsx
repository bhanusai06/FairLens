import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-accent" />
        </div>
        <h1 className="font-display text-6xl font-extrabold text-text mb-4">404</h1>
        <p className="text-text-dim font-body text-lg mb-8">
          This page doesn&apos;t exist. The bias was real though.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-bg font-semibold rounded-xl hover:bg-accent-dim transition-all font-body"
        >
          Back to FairLens
        </Link>
      </div>
    </main>
  );
}
