import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CircleHelp,
  FolderCheck,
  FolderKanban,
  GitBranch,
  KeyRound,
  Moon,
  Network,
  PieChart,
  PlayCircle,
  RefreshCcw,
  ShieldCheck,
  TestTube2,
  UserCheck,
  Users,
  Workflow
} from 'lucide-react';
import type { Metric } from '../types';
import { cn } from '../lib/utils';
import { formatMetricValue, formatNumber } from '../lib/format';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

const ICONS: Record<string, LucideIcon> = {
  api_total: Network,
  single_case_total: TestTube2,
  single_case_coverage: ShieldCheck,
  scenario_total: Workflow,
  scenario_coverage: GitBranch,
  scenario_success_rate: CheckCircle2,
  suite_execution_rate: PlayCircle,
  suite_pass_rate: BadgeCheck,
  project_usage_count: FolderKanban,
  project_usage_rate: PieChart,
  asset_reuse_rate: RefreshCcw,
  managed_teams: Users,
  managed_projects: Building2,
  license_usage: KeyRound,
  dormant_accounts: Moon,
  active_teams: Activity,
  active_projects: FolderCheck,
  active_users: UserCheck
};

type Tone = 'blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'slate';

const TONES: Record<
  Tone,
  { icon: string; bar: string; rail: string; edge: string; number: string }
> = {
  blue: {
    icon: 'border-blue-100 bg-blue-50 text-blue-600',
    bar: 'bg-blue-500',
    rail: 'bg-blue-100/70',
    edge: 'before:bg-blue-500',
    number: 'text-slate-950'
  },
  emerald: {
    icon: 'border-emerald-100 bg-emerald-50 text-emerald-600',
    bar: 'bg-emerald-500',
    rail: 'bg-emerald-100/70',
    edge: 'before:bg-emerald-500',
    number: 'text-slate-950'
  },
  violet: {
    icon: 'border-violet-100 bg-violet-50 text-violet-600',
    bar: 'bg-violet-500',
    rail: 'bg-violet-100/70',
    edge: 'before:bg-violet-500',
    number: 'text-slate-950'
  },
  amber: {
    icon: 'border-amber-100 bg-amber-50 text-amber-600',
    bar: 'bg-amber-500',
    rail: 'bg-amber-100/70',
    edge: 'before:bg-amber-500',
    number: 'text-slate-950'
  },
  rose: {
    icon: 'border-rose-100 bg-rose-50 text-rose-600',
    bar: 'bg-rose-500',
    rail: 'bg-rose-100/70',
    edge: 'before:bg-rose-500',
    number: 'text-slate-950'
  },
  slate: {
    icon: 'border-slate-200 bg-slate-100 text-slate-600',
    bar: 'bg-slate-500',
    rail: 'bg-slate-100',
    edge: 'before:bg-slate-400',
    number: 'text-slate-950'
  }
};

const METRIC_TONES: Record<string, Tone> = {
  api_total: 'slate',
  single_case_total: 'blue',
  single_case_coverage: 'blue',
  scenario_total: 'violet',
  scenario_coverage: 'violet',
  scenario_success_rate: 'emerald',
  suite_execution_rate: 'blue',
  suite_pass_rate: 'emerald',
  project_usage_count: 'slate',
  project_usage_rate: 'blue',
  asset_reuse_rate: 'violet',
  managed_teams: 'slate',
  managed_projects: 'blue',
  license_usage: 'blue',
  dormant_accounts: 'amber',
  active_teams: 'emerald',
  active_projects: 'emerald',
  active_users: 'emerald'
};

interface MetricCardProps {
  metric: Metric;
  context?: string;
  index?: number;
}

export function MetricCard({ metric, context, index = 0 }: MetricCardProps) {
  const Icon = ICONS[metric.id] ?? CircleHelp;
  const tone = TONES[METRIC_TONES[metric.id] ?? 'slate'];
  const valueText = formatMetricValue(metric.value, metric.unit);
  const hasRatio = metric.denominator !== null;
  const percentWidth =
    metric.unit === 'percent' && metric.value !== null
      ? Math.max(0, Math.min(100, metric.value))
      : 0;
  const pending = metric.status === 'pending-confirmation';
  const unavailable = metric.availability === 'unavailable';
  const description = [metric.description, metric.note].filter(Boolean).join('\n');

  return (
    <article
      className={cn(
        'group relative flex min-h-[174px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50',
        "before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:content-['']",
        tone.edge
      )}
      style={{ animationDelay: `${index * 35}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-h-8 items-start gap-1.5">
            <h3 className="text-[13px] font-medium leading-5 text-slate-500">{metric.label}</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="mt-0.5 shrink-0 rounded text-slate-300 transition hover:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                  aria-label={`${metric.label}：${description || '暂无口径说明'}`}
                >
                  <CircleHelp className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold text-white">{metric.label}</p>
                <p className="mt-1 whitespace-pre-line text-slate-300">{description || '暂无口径说明'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className={cn('tabular text-[28px] font-bold leading-none tracking-tight', tone.number)}>
              {valueText}
            </span>
            {metric.unit === 'count' && <span className="text-[11px] text-slate-400">个</span>}
          </div>
        </div>

        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border', tone.icon)}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
        </div>
      </div>

      <div className="mt-auto pt-3">
        {metric.unit === 'percent' && (
          <div className={cn('mb-2.5 h-1.5 w-full overflow-hidden rounded-full', tone.rail)}>
            <div
              className={cn('h-full rounded-full transition-all duration-500', tone.bar)}
              style={{ width: `${percentWidth}%` }}
            />
          </div>
        )}
        <div className="flex min-h-5 items-center justify-between gap-2">
          <p className="truncate text-[11px] text-slate-400">
            {hasRatio
              ? `${formatNumber(metric.numerator)} / ${formatNumber(metric.denominator)}`
              : context || (metric.unit === 'percent' ? '分子 / 分母' : '当前口径')}
          </p>
          {unavailable ? (
            <Badge variant="rose">不可用</Badge>
          ) : pending ? (
            <Badge variant="amber">待业务确认</Badge>
          ) : metric.unit === 'percent' && metric.value === null ? (
            <Badge variant="outline">暂无分母</Badge>
          ) : null}
        </div>
      </div>
    </article>
  );
}
