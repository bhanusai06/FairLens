'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Shield, ArrowLeft, Chrome } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    if (!auth || !googleProvider) {
      toast.error('Google sign-in is not configured in this build.');
      return;
    }

    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Signed in successfully!');
      router.push('/upload');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      if (!message.includes('popup-closed')) {
        toast.error('Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg grid-bg flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-text-dim hover:text-text text-sm font-body mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>

        <div className="p-8 rounded-2xl bg-surface border border-white/5">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-accent" />
            </div>
            <h1 className="font-display text-2xl font-bold text-text mb-2">Sign in to FairLens</h1>
            <p className="text-text-dim text-sm font-body">
              Save your audit history and access reports anytime.
            </p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading || !auth || !googleProvider}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-white/10 bg-surface-2 text-text hover:border-accent/20 hover:bg-accent/5 transition-all font-body text-sm font-medium"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-text-dim border-t-transparent rounded-full animate-spin" />
            ) : (
              <Chrome className="w-5 h-5 text-[#4285F4]" />
            )}
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/upload')}
              className="text-text-dim hover:text-text text-xs font-body transition-colors underline"
            >
              Continue without signing in →
            </button>
          </div>
        </div>

        <p className="text-center text-text-dim text-xs font-body mt-6">
          Sign-in is optional. FairLens works without an account.
        </p>
      </div>
    </main>
  );
}
