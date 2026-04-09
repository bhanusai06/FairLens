'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        className="route-layer"
        initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
        animate={{
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1],
          },
        }}
        exit={{
          opacity: 0,
          y: -8,
          filter: 'blur(3px)',
          transition: {
            duration: 0.22,
            ease: [0.22, 1, 0.36, 1],
          },
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}