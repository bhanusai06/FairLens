'use client';

import { useRef, type PointerEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function TiltCard({ children, className, contentClassName }: TiltCardProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const updateTilt = (event: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion) return;

    const shell = shellRef.current;
    if (!shell) return;

    const rect = shell.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 10;
    const rotateX = (0.5 - y) * 10;

    shell.style.setProperty('--rx', `${rotateX}deg`);
    shell.style.setProperty('--ry', `${rotateY}deg`);
    shell.style.setProperty('--glow-x', `${x * 100}%`);
    shell.style.setProperty('--glow-y', `${y * 100}%`);
  };

  const resetTilt = () => {
    const shell = shellRef.current;
    if (!shell) return;

    shell.style.setProperty('--rx', '0deg');
    shell.style.setProperty('--ry', '0deg');
    shell.style.setProperty('--glow-x', '50%');
    shell.style.setProperty('--glow-y', '50%');
  };

  return (
    <div
      ref={shellRef}
      className={cn('tilt-shell relative', className)}
      onPointerMove={updateTilt}
      onPointerLeave={resetTilt}
      style={{ perspective: '1400px' }}
    >
      <div
        className={cn('tilt-card relative h-full w-full', contentClassName)}
        style={{
          transform: 'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateY(0px)',
        }}
      >
        {children}
      </div>
    </div>
  );
}