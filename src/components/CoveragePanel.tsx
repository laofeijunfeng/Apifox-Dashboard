import { Crosshair, ShieldCheck } from 'lucide-react';
import type { CoverageMetric } from '../types';
import { cn } from '../lib/utils';
import { formatNumber, formatPercent } from '../lib/format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface CoveragePanelProps {
  singleCase: CoverageMetric;
  scenario: CoverageMetric;
  apiTotal: number;
  suiteTotal: number;
}

interface CoverageItemProps {
  label: string;
  description: string;
  metric: CoverageMetric;
  color: 'blue' | 'violet';
}

function CoverageItem({ label, description, metric, color }: CoverageItemProps) {
  const percent = metric.percent;
  const ringColor = color === 'blue' ? '#3b82f6' : '#8b5cf6';
  const style =
    percent === null
      ? { background: 'conic-gradient(#e2e8f0 0 100%)' }
      : { background: `conic-gradient(${ringColor} ${Math.min(100, Math.max(0, percent))}%, #eef2f7 0)` };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/55 p-3.5">
      <div className="relative h-[70px] w-[70px] shrink-0 rounded-full" style={style}>
        <div className="absolute inset-[8px] flex items-center justify-center rounded-full bg-white shadow-inner">
          <span className="tabular text-[13px] font-bold text-slate-900">{formatPercent(percent)}</span>
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-semibold text-slate-800">{label}</p>
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              color === 'blue' ? 'bg-blue-500' : 'bg-violet-500'
            )}
          />
        </div>
        <p className="mt-1 text-[11px] leading-5 text-slate-500">{description}</p>
        <p className="tabular mt-1 text-[11px] font-medium text-slate-700">
          覆盖 {formatNumber(metric.covered)} / {formatNumber(metric.total)} 个接口
        </p>
      </div>
    </div>
  );
}

export function CoveragePanel({ singleCase, scenario, apiTotal, suiteTotal }: CoveragePanelProps) {
  return (
    <Card className="lg:col-span-4">
      <CardHeader className="pb-2">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <CardTitle>接口资产覆盖</CardTitle>
          </div>
          <Badge variant={apiTotal > 0 ? 'blue' : 'default'}>
            <Crosshair className="h-3 w-3" />
            {apiTotal > 0 ? '已计算' : '暂无接口'}
          </Badge>
        </div>
        <CardDescription>以有效 HTTP 接口为统一分母，分子按关联接口去重</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-3">
        <CoverageItem
          label="单接口用例覆盖"
          description="至少有一条有效 TEST_CASE 的接口占比"
          metric={singleCase}
          color="blue"
        />
        <CoverageItem
          label="场景用例覆盖"
          description="被有效场景步骤引用到的接口占比"
          metric={scenario}
          color="violet"
        />

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
            <p className="text-[10px] text-slate-400">有效接口底数</p>
            <p className="tabular mt-1 text-lg font-bold text-slate-900">{formatNumber(apiTotal)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
            <p className="text-[10px] text-slate-400">有效套件底数</p>
            <p className="tabular mt-1 text-lg font-bold text-slate-900">{formatNumber(suiteTotal)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
