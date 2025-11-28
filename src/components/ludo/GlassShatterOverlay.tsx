
'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ban } from 'lucide-react';

const NUM_FRAGMENTS = 50;

const GlassFragment = () => {
  const duration = 1 + Math.random() * 1;
  const delay = Math.random() * 0.3;
  const angle = Math.random() * 360;
  const distance = window.innerWidth / 2 + Math.random() * 200;
  const initialRotate = Math.random() * 360;
  const finalRotate = initialRotate + (Math.random() - 0.5) * 720;
  const size = 10 + Math.random() * 20;

  return (
    <motion.div
      className="absolute bg-white/30 backdrop-blur-sm"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) rotate(${initialRotate}deg)`,
        clipPath: `polygon(${Math.random() * 100}% ${Math.random() * 100}%, ${Math.random() * 100}% ${Math.random() * 100}%, ${Math.random() * 100}% ${Math.random() * 100}%)`,
      }}
      initial={{ opacity: 1, x: 0, y: 0, rotate: initialRotate }}
      animate={{
        opacity: 0,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        rotate: finalRotate,
      }}
      transition={{ duration, ease: 'easeOut', delay }}
    />
  );
};

export function GlassShatterOverlay({ onAnimationComplete }: { onAnimationComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onAnimationComplete, 2000);
    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none overflow-hidden">
      <AnimatePresence>
        <motion.div
          key="icon"
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 3, opacity: 0, transition: { delay: 0.1, duration: 0.4, ease: 'easeIn' } }}
          exit={{ opacity: 0 }}
        >
          <Ban className="w-64 h-64 text-white/80" />
        </motion.div>
      </AnimatePresence>
      {Array.from({ length: NUM_FRAGMENTS }).map((_, i) => (
        <GlassFragment key={i} />
      ))}
    </div>
  );
}
