import type { ReactNode } from 'react';
import type { Metric } from '../types';
import { cn } from '../lib/utils';
import { MetricCard } from './MetricCard';

interface MetricSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  metrics: Metric[];
  accent?: 'blue' | 'emerald';
  contexts?: Record<string, string>;
  aside?: ReactNode;
}

export function MetricSection({
  id,
  eyebrow,
  title,
  description,
  metrics,
  accent = 'blue',
  contexts,
  aside
}: MetricSectionProps) {
  return (
    <section id={id} className="scroll-mt-36">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                accent === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'
              )}
            />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              {eyebrow}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
        </div>
        {aside}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard
            key={metric.id}
            metric={metric}
            index={index}
            context={contexts?.[metric.id]}
          />
        ))}
      </div>
    </section>
  );
}
