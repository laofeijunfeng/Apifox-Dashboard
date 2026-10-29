import type { FormEvent } from 'react';
import { useState } from 'react';
import {
  ArrowRight,
  CalendarRange,
  Check,
  Clock3,
  Database,
  LoaderCircle,
  ShieldCheck
} from 'lucide-react';
import type { DashboardResponse } from '../types';
import { cn } from '../lib/utils';
import { daysBetween, formatNumber } from '../lib/format';
import { Button } from './ui/button';
import { Input } from './ui/input';

export type RangeSelection =
  | { mode: 'days'; days: 7 | 30 | 90 }
  | { mode: 'custom'; days: 0; start: string; end: string };

interface OverviewHeroProps {
  data?: DashboardResponse;
  loading: boolean;
  selection: RangeSelection;
  draftStart: string;
  draftEnd: string;
  onDraftStartChange: (value: string) => void;
  onDraftEndChange: (value: string) => void;
  onPresetChange: (days: 7 | 30 | 90) => void;
  onCustomRangeChange: (start: string, end: string) => void;
}

const presets: Array<{ days: 7 | 30 | 90; label: string }> = [
  { days: 7, label: '近 7 天' },
  { days: 30, label: '近 30 天' },
  { days: 90, label: '近 90 天' }
];

export function OverviewHero({
  data,
  loading,
  selection,
  draftStart,
  draftEnd,
  onDraftStartChange,
  onDraftEndChange,
  onPresetChange,
  onCustomRangeChange
}: OverviewHeroProps) {
  const [rangeError, setRangeError] = useState<string | null>(null);
  const rangeLabel = data?.meta.range.label ?? '正在获取统计周期';
  const dayCount = data?.meta.range.dayCount;

  const submitCustomRange = (event: FormEvent) => {
    event.preventDefault();
    if (!draftStart || !draftEnd) {
      setRangeError('请选择完整的开始和结束日期');
      return;
    }
    const days = daysBetween(draftStart, draftEnd);
    if (days < 1) {
      setRangeError('开始日期不能晚于结束日期');
      return;
    }
    if (days > 366) {
      setRangeError('自定义统计周期不能超过 366 天');
      return;
    }
    setRangeError(null);
    onCustomRangeChange(draftStart, draftEnd);
  };

  const totalTeams = data?.summary.managedTeams ?? 0;
  const totalProjects = data?.summary.projectTotal ?? 0;
  const activeUsers = data?.summary.activeUsers ?? 0;

  return (
    <section className="relative overflow-hidden rounded-[26px] bg-slate-950 text-white shadow-[0_24px_70px_-28px_rgba(15,23,42,0.65)]">
      <div className="pointer-events-none absolute -right-28 -top-32 h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 left-[28%] h-[340px] w-[340px] rounded-full bg-emerald-400/10 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.075]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'linear-gradient(to bottom, black, transparent 88%)'
        }}
      />

      <div className="relative px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7 lg:px-9 lg:pt-8">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,.1)]" />
                APIFOX OBSERVABILITY
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-slate-300">
                <Database className="h-3 w-3" />
                {data?.meta.database ?? 'apifox'} 实时只读连接
              </span>
            </div>

            <h2 className="text-balance max-w-3xl text-[26px] font-bold leading-[1.22] tracking-[-0.025em] text-white sm:text-[32px] lg:text-[36px]">
              测试资产质量与运营健康，
              <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                一屏掌握
              </span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              聚合接口用例、场景与套件执行效能，同时追踪团队、项目、License 和成员活跃度。所有数字来自数据库实时计算，不使用演示值。
            </p>

            <div className="mt-5 grid max-w-xl grid-cols-3 divide-x divide-white/10 rounded-xl border border-white/10 bg-white/[0.045] p-3 backdrop-blur-sm">
              <div className="px-3 first:pl-1">
                <p className="text-[10px] text-slate-400">纳管团队</p>
                <p className="tabular mt-1 text-lg font-bold text-white">{formatNumber(totalTeams)}</p>
              </div>
              <div className="px-3">
                <p className="text-[10px] text-slate-400">纳管项目</p>
                <p className="tabular mt-1 text-lg font-bold text-white">{formatNumber(totalProjects)}</p>
              </div>
              <div className="px-3">
                <p className="text-[10px] text-slate-400">周期活跃用户</p>
                <p className="tabular mt-1 text-lg font-bold text-white">{formatNumber(activeUsers)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-md sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">统计周期</p>
                <p className="mt-1 text-[15px] font-bold leading-6 tracking-tight text-white sm:text-lg sm:leading-7">{rangeLabel}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {dayCount ? `${dayCount} 个自然日 · ` : ''}上海时区 [开始日 00:00, 结束日次日 00:00)
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-cyan-300">
                {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <CalendarRange className="h-5 w-5" />}
              </div>
            </div>

            <div className="mt-4 flex rounded-lg border border-white/10 bg-slate-900/50 p-1">
              {presets.map((preset) => {
                const active = selection.mode === 'days' && selection.days === preset.days;
                return (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => {
                      setRangeError(null);
                      onPresetChange(preset.days);
                    }}
                    className={cn(
                      'flex h-8 flex-1 items-center justify-center gap-1 rounded-md text-[11px] font-semibold transition',
                      active
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                    )}
                  >
                    {active && <Check className="h-3 w-3" />}
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={submitCustomRange} className="mt-3">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <Input
                  aria-label="开始日期"
                  type="date"
                  value={draftStart}
                  onChange={(event) => {
                    onDraftStartChange(event.target.value);
                    setRangeError(null);
                  }}
                  className="h-8 border-white/10 bg-white/[0.06] px-2 text-[11px] text-white shadow-none [color-scheme:dark] focus:border-cyan-300 focus:ring-cyan-300/20"
                />
                <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                <Input
                  aria-label="结束日期"
                  type="date"
                  value={draftEnd}
                  onChange={(event) => {
                    onDraftEndChange(event.target.value);
                    setRangeError(null);
                  }}
                  className="h-8 border-white/10 bg-white/[0.06] px-2 text-[11px] text-white shadow-none [color-scheme:dark] focus:border-cyan-300 focus:ring-cyan-300/20"
                />
              </div>
              {rangeError && <p className="mt-2 text-[11px] text-rose-300">{rangeError}</p>}
              <Button
                type="submit"
                size="sm"
                variant="primary"
                disabled={loading}
                className="mt-2.5 w-full border border-blue-400/20 bg-blue-500 hover:bg-blue-400"
              >
                应用自定义周期
              </Button>
            </form>

            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-[10px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                强制只读数据库账号
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3 w-3" />
                UTC+8
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
