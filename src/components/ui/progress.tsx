import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  indicatorClassName?: string;
}

export function Progress({
  value,
  className,
  indicatorClassName,
  ...props
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn(
        'relative h-1.5 w-full overflow-hidden rounded-full bg-[#E2E8F0]',
        className
      )}
      {...props}
    >
      <motion.div
        className={cn('h-full rounded-full bg-[#0F172A]', indicatorClassName)}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: clamped / 100 }}
        style={{ transformOrigin: 'left' }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      />
    </div>
  );
}
