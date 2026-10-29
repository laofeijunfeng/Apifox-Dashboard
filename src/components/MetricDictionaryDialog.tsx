import { BookOpenText, Calculator, CircleAlert, Info } from 'lucide-react';
import type { DashboardResponse, Metric } from '../types';
import { cn } from '../lib/utils';
import { formatMetricValue, formatNumber } from '../lib/format';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from './ui/dialog';

interface MetricDictionaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: DashboardResponse;
}

function MetricDefinition({ metric }: { metric: Metric }) {
  const ratio = metric.denominator !== null;
  const pending = metric.status === 'pending-confirmation';
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-800">{metric.label}</p>
          <p className="tabular mt-1 text-lg font-bold text-slate-950">
            {formatMetricValue(metric.value, metric.unit)}
          </p>
        </div>
        {pending ? (
          <Badge variant="amber" className="shrink-0">待确认</Badge>
        ) : metric.availability === 'unavailable' ? (
          <Badge variant="rose" className="shrink-0">不可用</Badge>
        ) : (
          <Badge variant="emerald" className="shrink-0">已确认</Badge>
        )}
      </div>
      {ratio && (
        <p className="tabular mt-2 text-[10px] font-medium text-blue-600">
          当前值：{formatNumber(metric.numerator)} / {formatNumber(metric.denominator)}
        </p>
      )}
      <p className="mt-2 text-[11px] leading-5 text-slate-500">{metric.description || '暂无口径说明。'}</p>
      {metric.note && (
        <p className="mt-1.5 rounded-md bg-white px-2 py-1.5 text-[10px] leading-4 text-slate-400">
          {metric.note}
        </p>
      )}
    </div>
  );
}

export function MetricDictionaryDialog({ open, onOpenChange, data }: MetricDictionaryDialogProps) {
  const testing = data?.metrics.testing ?? [];
  const operations = data?.metrics.operations ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <BookOpenText className="h-4.5 w-4.5" />
          </div>
          <DialogTitle>指标口径字典</DialogTitle>
          <DialogDescription>
            共 {testing.length + operations.length} 项指标。比例指标统一展示分子、分母与当前周期；分母为 0 时返回空值而不是 0%。
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-5">
          {data ? (
            <div className="space-y-6">
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-900">测试相关</h3>
                  <Badge variant="blue">{testing.length} 项</Badge>
                </div>
                <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                  {testing.map((metric) => <MetricDefinition key={metric.id} metric={metric} />)}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-slate-900">运维运营</h3>
                  <Badge variant="emerald">{operations.length} 项</Badge>
                </div>
                <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                  {operations.map((metric) => <MetricDefinition key={metric.id} metric={metric} />)}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-2.5">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <div className="space-y-1.5 text-[11px] leading-5 text-slate-500">
                    <p>
                      <span className="font-semibold text-slate-700">统计周期：</span>
                      {data.meta.range.label}，左闭右开，按 {data.meta.timeZone} 自然日切分。
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">报告通过判定：</span>
                      {data.meta.reportSuccessRule}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">资产复用窗口：</span>
                      {data.meta.reuseWindow.label}，固定 {data.meta.reuseWindow.days} 天。
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">数据边界：</span>
                      仅查询未软删除记录；所有查询使用只读数据库账号，不修改 Apifox 业务表。
                    </p>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className={cn('flex min-h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400')}>
              指标数据加载后显示口径。
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
