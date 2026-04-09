'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Shield, Zap, BarChart3, ArrowRight,
  CheckCircle, AlertTriangle, ChevronRight, Star,
  Eye, Lock, Globe, Users
} from 'lucide-react';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import { TiltCard } from '@/components/ui/TiltCard';
import { BackendStatusBadge } from '@/components/ui/BackendStatusBadge';

const STATS = [
  { value: 94, suffix: '%', label: 'Bias Detection Accuracy', icon: Shield },
  { value: 8, suffix: 's', label: 'Avg. Analysis Time', icon: Zap },
  { value: 500, suffix: '+', label: 'Datasets Audited', icon: BarChart3 },
  { value: 23, suffix: '%', label: 'Avg. Bias Reduction', icon: CheckCircle },
];

const FEATURES = [
  {
    icon: Eye,
    title: 'Real-Time Bias Detection',
    desc: 'The live analysis engine audits your dataset in seconds, catching bias patterns humans miss.',
    color: '#00E5C3',
  },
  {
    icon: BarChart3,
    title: 'Intersectional Analysis',
    desc: 'Detect bias across multiple protected attributes simultaneously — gender × race × age.',
    color: '#FFB347',
  },
  {
    icon: Globe,
    title: 'Plain-English Explanations',
    desc: 'No jargon. The analysis engine explains exactly what the bias is and why it exists.',
    color: '#9B59B6',
  },
  {
    icon: Lock,
    title: 'Mitigation Roadmap',
    desc: 'Get 3 specific, actionable steps to reduce bias — with expected score improvements.',
    color: '#FF4D6D',
  },
  {
    icon: Users,
    title: 'Multi-Domain Support',
    desc: 'Hiring, loans, healthcare, credit scoring — FairLens handles any decision dataset.',
    color: '#3498DB',
  },
  {
    icon: Shield,
    title: 'Audit Trail Export',
    desc: 'Download complete bias reports for compliance documentation and stakeholder review.',
    color: '#2ECC71',
  },
];

const USE_CASES = [
  { emoji: '💼', label: 'Hiring', bias: 73, color: '#FF4D6D' },
  { emoji: '🏦', label: 'Loans', bias: 68, color: '#FFB347' },
  { emoji: '🏥', label: 'Healthcare', bias: 81, color: '#9B59B6' },
];

const IMPACT_AREAS = [
  {
    title: 'Hiring fairness',
    icon: Users,
    desc: 'Spot proxy variables, unequal rejection rates, and screening models that quietly exclude qualified candidates.',
    color: '#FF4D6D',
  },
  {
    title: 'Credit decisions',
    icon: BarChart3,
    desc: 'Check approval gaps, model drift, and location-based bias before it turns into compliance risk.',
    color: '#FFB347',
  },
  {
    title: 'Healthcare triage',
    icon: Eye,
    desc: 'Expose treatment under-allocation, symptom misweighting, and demographic differences in urgency scoring.',
    color: '#9B59B6',
  },
  {
    title: 'Policy review',
    icon: Shield,
    desc: 'Create a documented fairness audit trail for teams that need defensible decisions and stakeholder trust.',
    color: '#2ECC71',
  },
];

const WORKFLOW = [
  {
    step: '01',
    title: 'Upload data',
    desc: 'CSV import or demo dataset selection, with built-in checks for structure and minimum sample size.',
  },
  {
    step: '02',
    title: 'Run audit',
    desc: 'Gemini analysis or local heuristic fallback evaluates bias score, root cause, and affected groups.',
  },
  {
    step: '03',
    title: 'Act fast',
    desc: 'Export a report, review mitigation steps, and hand the result to engineering, legal, or leadership.',
  },
];

// Animated background particles
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; color: string;
    }> = [];

    const colors = ['#00E5C3', '#00E5C3', '#FFB347', '#FF4D6D'];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animFrame: number;

    function animate() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
      });

      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0,229,195,${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animFrame = requestAnimationFrame(animate);
    }

    animate();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}

// Bias score orb component
function BiasOrb({ score, color, label }: { score: number; color: string; label: string }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle
            cx="48" cy="48" r="40"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold font-display" style={{ color }}>{score}</span>
          <span className="text-xs text-text-dim font-mono">BIAS</span>
        </div>
      </div>
      <span className="text-sm text-text-dim font-body">{label}</span>
    </div>
  );
}

function Hero3DCore() {
  return (
    <div
      className="hero-3d-stage relative w-52 h-52 sm:w-64 sm:h-64 mx-auto my-10 float-slow"
    >
      <div className="hero-3d-orbit halo absolute inset-[6%] float-drift" />
      <div className="hero-3d-ring absolute inset-[14%] float-drift" />
      <div className="hero-3d-ring hero-3d-ring-secondary absolute inset-[22%] float-slow" />
      <div className="hero-3d-orbit rail absolute inset-[34%]" />
      <span className="hero-3d-satellite hero-3d-satellite-a" />
      <span className="hero-3d-satellite hero-3d-satellite-b" />
      <span className="hero-3d-satellite hero-3d-satellite-c" />
      <div className="hero-3d-core absolute inset-[37%] rounded-full shimmer-sweep" />
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { ref: statsRef, inView: statsInView } = useInView({ triggerOnce: true, threshold: 0.2 });
  const { ref: featuresRef, inView: featuresInView } = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-bg relative overflow-hidden">
      {mounted && <Particles />}

      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/5 rounded-full blur-3xl hero-orb float-drift" />
        <div className="absolute bottom-1/3 right-0 w-[400px] h-[400px] bg-danger/5 rounded-full blur-3xl hero-orb-rose float-slow" />
      </div>

      {/* NAV */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-accent" />
          </div>
          <span className="font-display font-bold text-xl text-text">FairLens</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Demo', 'Architecture'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-text-dim text-sm hover:text-accent transition-colors font-body"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <BackendStatusBadge />
          <button
            onClick={() => router.push('/upload')}
            className="px-4 py-2 bg-accent text-bg text-sm font-semibold rounded-lg hover:bg-accent-dim transition-all hover:shadow-glow-sm font-body"
          >
            Try Free
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24">
        <div
          className="text-center max-w-4xl mx-auto section-reveal"
        >
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/20 bg-accent/5 mb-8 animate-fade-in"
          >
            <Star className="w-3.5 h-3.5 text-accent fill-accent" />
            <span className="text-xs text-accent font-body font-medium display-micro">
              Real-Time AI Fairness Intelligence
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-display text-5xl md:text-7xl font-extrabold leading-[0.92] tracking-tight mb-6 hero-copy headline-glow"
          >
            <span className="text-text">Your AI is </span>
            <span className="text-gradient-rose">biased.</span>
            <br />
            <span className="text-text">We prove it.</span>
          </h1>

          <p
            className="text-text-dim text-lg md:text-xl font-body leading-relaxed max-w-2xl mx-auto mb-12"
          >
            FairLens uses a live AI analysis engine to audit decision systems for bias in real time —
            hiring, loans, healthcare, any domain.
            Get a Fairness Score, root cause analysis, and a mitigation roadmap in under 10 seconds.
          </p>

          <Hero3DCore />

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <button
              onClick={() => router.push('/upload')}
              className="group flex items-center gap-3 px-8 py-4 bg-accent text-bg font-semibold rounded-xl hover:bg-accent-dim transition-all hover:shadow-glow-md text-base font-body"
            >
              Audit Your AI Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => router.push('/upload?demo=hiring')}
              className="flex items-center gap-2 px-8 py-4 border border-white/10 text-text rounded-xl hover:border-accent/30 hover:bg-accent/5 transition-all text-base font-body"
            >
              <Zap className="w-4 h-4 text-accent" />
              Live Demo
            </button>
          </div>

          {/* Live bias orbs */}
          <TiltCard className="max-w-md mx-auto">
            <div className="flex items-center justify-center gap-8 md:gap-16 p-8 rounded-2xl bg-surface/55 border border-white/5 backdrop-blur-sm soft-border card-shell">
              {USE_CASES.map((uc) => (
                <BiasOrb key={uc.label} score={uc.bias} color={uc.color} label={uc.label} />
              ))}
            </div>
          </TiltCard>
          <p className="text-text-dim text-xs mt-3 font-mono">
            ↑ Real bias scores from our demo datasets
          </p>
        </div>
      </section>

      {/* STATS */}
      <section ref={statsRef} className="relative z-10 max-w-7xl mx-auto px-6 py-16 section-reveal-delayed">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="p-6 rounded-2xl bg-surface border border-white/5 text-center card-lift hover-tilt-3d shimmer-sweep"
              style={{
              }}
            >
              <stat.icon className="w-5 h-5 text-accent mx-auto mb-3" />
              <div className="font-display text-3xl font-bold text-text mb-1">
                {statsInView ? (
                  <CountUp end={stat.value} duration={2} delay={i * 0.2} />
                ) : '0'}
                <span className="text-accent">{stat.suffix}</span>
              </div>
              <p className="text-text-dim text-xs font-body">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DEMO SECTION */}
      <section id="demo" className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-bold text-text mb-4">
            See Bias <span className="gradient-text">Exposed in 30 Seconds</span>
          </h2>
          <p className="text-text-dim font-body">Click any dataset. Watch Gemini catch bias in real time.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              id: 'hiring', emoji: '💼', title: 'Hiring Dataset',
              desc: 'Female candidates with identical qualifications rejected 23% more often.',
              bias: 73, color: '#FF4D6D',
              finding: 'Employment gap used as gender proxy',
            },
            {
              id: 'loan', emoji: '🏦', title: 'Loan Approvals',
              desc: 'Minority applicants denied 31% more with identical financial profiles.',
              bias: 68, color: '#FFB347',
              finding: 'ZIP code encoding racial segregation',
            },
            {
              id: 'medical', emoji: '🏥', title: 'Healthcare Access',
              desc: 'Women receive basic treatment plans vs comprehensive for identical symptoms.',
              bias: 81, color: '#9B59B6',
              finding: 'Pain score underweighted for female patients',
            },
          ].map((item, i) => (
            <TiltCard key={item.id}>
              <button
                onClick={() => router.push(`/upload?demo=${item.id}`)}
                className="group text-left p-6 rounded-2xl bg-surface border border-white/5 hover:border-accent/20 transition-all card-lift hover-tilt-3d cursor-pointer w-full h-full soft-border card-shell"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">{item.emoji}</div>
                  <div
                    className="px-3 py-1 rounded-full text-xs font-mono font-bold"
                    style={{ color: item.color, background: item.color + '20' }}
                  >
                    {item.bias}/100
                  </div>
                </div>

                <h3 className="font-display text-lg font-semibold text-text mb-2">{item.title}</h3>
                <p className="text-text-dim text-sm font-body mb-4 leading-relaxed">{item.desc}</p>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-2 border border-white/5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: item.color }} />
                  <span className="text-xs font-mono text-text-dim">{item.finding}</span>
                </div>

                <div className="mt-4 flex items-center gap-2 text-accent text-sm font-semibold group-hover:gap-3 transition-all">
                  Run Audit <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" ref={featuresRef} className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-bold text-text mb-4">
            Everything Fairness Demands
          </h2>
          <p className="text-text-dim font-body max-w-xl mx-auto">
            Built for the real-world complexity of bias — not just the easy cases.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <TiltCard key={feature.title}>
              <div
                className="p-6 rounded-2xl bg-surface border border-white/5 hover:border-white/10 transition-all card-lift hover-tilt-3d soft-border card-shell"
                style={{
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: feature.color + '15' }}
                >
                  <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
                </div>
                <h3 className="font-display text-base font-semibold text-text mb-2">{feature.title}</h3>
                <p className="text-text-dim text-sm font-body leading-relaxed">{feature.desc}</p>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* IMPACT */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-stretch">
          <TiltCard>
            <div className="h-full p-8 rounded-3xl bg-surface border border-white/5 soft-border card-shell hover-tilt-3d overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/6 via-transparent to-danger/5 pointer-events-none" />
              <div className="relative z-10">
                <p className="type-kicker text-accent mb-3">Why FairLens changes the workflow</p>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-text mb-4">
                  Built to surface bias before it becomes a product, legal, or trust problem.
                </h2>
                <p className="text-text-dim font-body text-base md:text-lg leading-relaxed max-w-2xl mb-6">
                  Most teams only notice bias after users complain, regulators ask questions, or key metrics drift.
                  FairLens moves that discovery point earlier with a fast audit, readable explanation, and a concrete mitigation path.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {IMPACT_AREAS.map((area) => (
                    <div key={area.title} className="p-4 rounded-2xl bg-bg/60 border border-white/5 hover-tilt-3d">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                        style={{ background: area.color + '18' }}
                      >
                        <area.icon className="w-5 h-5" style={{ color: area.color }} />
                      </div>
                      <h3 className="font-display text-base font-semibold text-text mb-2">{area.title}</h3>
                      <p className="text-text-dim text-sm font-body leading-relaxed">{area.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TiltCard>

          <div className="grid gap-4">
            {WORKFLOW.map((item) => (
              <TiltCard key={item.step}>
                <div className="p-5 rounded-2xl bg-surface border border-white/5 soft-border card-shell hover-tilt-3d h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-mono font-bold text-xs">
                      {item.step}
                    </div>
                    <h3 className="font-display text-lg font-semibold text-text">{item.title}</h3>
                  </div>
                  <p className="text-text-dim font-body text-sm leading-relaxed">{item.desc}</p>
                </div>
              </TiltCard>
            ))}

            <div className="p-5 rounded-2xl border border-accent/15 bg-accent/5 soft-border card-shell">
              <p className="text-accent text-xs font-mono font-bold mb-2">Impact signal</p>
              <p className="text-text font-display text-xl font-bold mb-2">Decision systems get easier to defend.</p>
              <p className="text-text-dim text-sm font-body leading-relaxed">
                The product makes bias visible enough for engineers and executives to act on it without needing a data science deep dive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section id="architecture" className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-bold text-text mb-4">
            Built on Google Cloud
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 p-8 rounded-2xl bg-surface border border-white/5">
          {[
            { name: 'Next.js 14', color: '#FFF' },
            { name: '→', color: '#4A4A6A' },
            { name: 'Firebase Auth', color: '#FFA000' },
            { name: '→', color: '#4A4A6A' },
            { name: 'Cloud Run', color: '#4285F4' },
            { name: '→', color: '#4A4A6A' },
            { name: 'Gemini 1.5 Pro', color: '#00E5C3' },
            { name: '→', color: '#4A4A6A' },
            { name: 'Vertex AI', color: '#34A853' },
            { name: '→', color: '#4A4A6A' },
            { name: 'Firestore', color: '#FF6D00' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              {item.name === '→' ? (
                <span className="text-muted text-xl">→</span>
              ) : (
                <span
                  className="px-4 py-2 rounded-lg text-sm font-mono font-medium border"
                  style={{
                    color: item.color,
                    borderColor: item.color + '40',
                    background: item.color + '10',
                  }}
                >
                  {item.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16 text-center">
        <div className="p-12 rounded-3xl bg-surface border border-accent/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-accent/5 to-transparent" />
          <div className="relative z-10">
            <h2 className="font-display text-4xl font-bold text-text mb-4 type-title">
              Is Your AI Fair?
            </h2>
            <p className="text-text-dim font-body text-lg mb-8 max-w-xl mx-auto">
              Upload your dataset and get a Fairness Score in under 10 seconds.
              No signup required.
            </p>
            <button
              onClick={() => router.push('/upload')}
              className="group inline-flex items-center gap-3 px-10 py-4 bg-accent text-bg font-semibold text-lg rounded-xl hover:bg-accent-dim transition-all hover:shadow-glow-lg font-body"
            >
              Start Free Audit
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent" />
          <span className="font-display font-bold text-sm text-text">FairLens</span>
          <span className="text-text-dim text-sm font-body">— AI Bias Detection Platform</span>
        </div>
        <p className="text-text-dim text-xs font-body">
          Built with robust AI auditing workflows for production teams
        </p>
        <div className="flex gap-4">
          <Link href="/upload" className="text-accent hover:text-accent-dim text-sm font-body transition-colors">
            Try Now →
          </Link>
        </div>
      </footer>
    </main>
  );
}
