import { useEffect, useMemo, useState } from 'react';
import { BarChart3, ChartNoAxesCombined, Gauge, ShieldCheck } from 'lucide-react';
import type { DashboardResponse } from './types';
import { addDays, formatDateTime, todayInShanghai } from './lib/format';
import { TooltipProvider } from './components/ui/tooltip';
import { Badge } from './components/ui/badge';
import { DashboardHeader } from './components/DashboardHeader';
import { OverviewHero, type RangeSelection } from './components/OverviewHero';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { DataNotice } from './components/DataNotice';
import { MetricSection } from './components/MetricSection';
import { ExecutionTrendPanel } from './components/ExecutionTrendPanel';
import { CoveragePanel } from './components/CoveragePanel';
import { TeamLicensePanel } from './components/TeamLicensePanel';
import { DetailTables } from './components/DetailTables';
import { MetricDictionaryDialog } from './components/MetricDictionaryDialog';
import { LoadError } from './components/LoadError';

const today = todayInShanghai();

function buildQuery(selection: RangeSelection): string {
  if (selection.mode === 'days') return `days=${selection.days}`;
  const params = new URLSearchParams({ start: selection.start, end: selection.end });
  return params.toString();
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message || `服务返回 HTTP ${response.status}`;
  } catch {
    return `服务返回 HTTP ${response.status}`;
  }
}

export default function App() {
  const [selection, setSelection] = useState<RangeSelection>({ mode: 'days', days: 30 });
  const [draftStart, setDraftStart] = useState(addDays(today, -29));
  const [draftEnd, setDraftEnd] = useState(today);
  const [data, setData] = useState<DashboardResponse>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);

  const query = useMemo(() => buildQuery(selection), [selection]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/dashboard?${query}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(await readErrorMessage(response));
        return (await response.json()) as DashboardResponse;
      })
      .then((payload) => {
        setData(payload);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(requestError instanceof Error ? requestError.message : '未知网络错误');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [query, refreshKey]);

  useEffect(() => {
    if (!data) return;
    setDraftStart(data.meta.range.startDate);
    setDraftEnd(data.meta.range.endDate);
  }, [data]);

  const exportHref = data
    ? `/api/export.csv?start=${encodeURIComponent(data.meta.range.startDate)}&end=${encodeURIComponent(data.meta.range.endDate)}`
    : null;

  const refresh = () => setRefreshKey((value) => value + 1);

  const testingContexts = data
    ? {
        api_total: '当前有效存量',
        single_case_total: '当前有效存量',
        scenario_total: '当前有效存量',
        project_usage_count: `${data.summary.usedProjects} / ${data.summary.projectTotal} 个项目`,
        asset_reuse_rate: `固定近 ${data.meta.reuseWindow.days} 天`
      }
    : undefined;

  const operationsContexts = data
    ? {
        managed_teams: '当前有效存量',
        managed_projects: '当前有效存量',
        license_usage: '跨团队账号去重',
        dormant_accounts: '最近活动 ≤ 90 天阈值',
        active_teams: '所选统计周期',
        active_projects: '所选统计周期',
        active_users: '所选统计周期'
      }
    : undefined;

  return (
    <TooltipProvider delayDuration={180}>
      <div className="min-h-screen">
        <DashboardHeader
          meta={data?.meta}
          loading={loading}
          exportHref={exportHref}
          onOpenDictionary={() => setDictionaryOpen(true)}
          onRefresh={refresh}
        />

        <main className="mx-auto max-w-[1600px] space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <OverviewHero
            data={data}
            loading={loading}
            selection={selection}
            draftStart={draftStart}
            draftEnd={draftEnd}
            onDraftStartChange={setDraftStart}
            onDraftEndChange={setDraftEnd}
            onPresetChange={(days) => setSelection({ mode: 'days', days })}
            onCustomRangeChange={(start, end) => setSelection({ mode: 'custom', days: 0, start, end })}
          />

          {error && data && (
            <div className="flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 sm:flex-row sm:items-center sm:justify-between">
              <span>本次刷新失败，页面继续展示上一次成功获取的数据。原因：{error}</span>
              <button type="button" className="font-semibold underline underline-offset-4" onClick={refresh}>
                重试
              </button>
            </div>
          )}

          {loading && !data ? (
            <DashboardSkeleton />
          ) : !data ? (
            <LoadError message={error ?? '服务未返回数据，请稍后重试。'} onRetry={refresh} />
          ) : (
            <>
              <DataNotice warnings={data.warnings} onRefresh={refresh} />

              <MetricSection
                id="testing-metrics"
                eyebrow="Quality Engineering"
                title="测试相关指标"
                description="从资产规模、接口覆盖、场景覆盖到套件执行与有效复用，统一观察测试工程投入是否真正转化为可持续执行的自动化资产。"
                metrics={data.metrics.testing}
                contexts={testingContexts}
                aside={
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="blue">
                      <Gauge className="h-3 w-3" />
                      {data.metrics.testing.length} 项指标
                    </Badge>
                    <Badge variant="outline">{data.summary.suiteTotal} 个有效套件</Badge>
                  </div>
                }
              />

              <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

              <MetricSection
                id="operations-metrics"
                eyebrow="Operations & Adoption"
                title="运维运营指标"
                description="聚焦组织纳管范围、License 使用、账号沉睡与回收，以及团队、项目和成员在所选周期内的真实活跃情况。"
                metrics={data.metrics.operations}
                contexts={operationsContexts}
                accent="emerald"
                aside={
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="emerald">
                      <ShieldCheck className="h-3 w-3" />
                      {data.metrics.operations.length} 项指标
                    </Badge>
                    <Badge variant="outline">{data.summary.licenseUsage} 个 License 用户</Badge>
                  </div>
                }
              />

              <section id="analytics" className="scroll-mt-36 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-500" />
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Analytics
                      </span>
                    </div>
                    <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-950">
                      <ChartNoAxesCombined className="h-5 w-5 text-cyan-600" />
                      趋势、覆盖与团队结构
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">图表直接使用接口聚合结果；空周期会明确展示空状态，不以样例曲线填充。</p>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    周期边界：{data.meta.range.startUtc} → {data.meta.range.endExclusiveUtc}
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-12">
                  <ExecutionTrendPanel data={data.charts.executionTrend} />
                  <CoveragePanel
                    singleCase={data.charts.coverage.singleCase}
                    scenario={data.charts.coverage.scenario}
                    apiTotal={data.summary.apiTotal}
                    suiteTotal={data.summary.suiteTotal}
                  />
                  <div className="lg:col-span-12">
                    <TeamLicensePanel data={data.charts.licenseByTeam} />
                  </div>
                </div>
              </section>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-[11px] leading-5 text-slate-500 shadow-sm">
                <BarChart3 className="h-4 w-4 shrink-0 text-blue-500" />
                <p>
                  <span className="font-semibold text-slate-700">报告成功判定：</span>
                  {data.meta.reportSuccessRule}
                </p>
              </div>

              <DetailTables projects={data.projects} teams={data.teams} />

              <footer className="flex flex-col gap-3 border-t border-slate-200 pb-2 pt-5 text-[11px] leading-5 text-slate-400 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-500">Apifox Dashboard · 真实只读数据看板</p>
                  <p className="mt-1">
                    数据源：{data.meta.database}.{data.meta.timeZone} · 最后生成 {formatDateTime(data.meta.generatedAt)}
                  </p>
                </div>
                <p className="max-w-2xl sm:text-right">
                  所有统计均过滤软删除记录；日期区间按上海时区左闭右开计算。闲置账号回收率依赖独立回收事件表，口径待业务确认。
                </p>
              </footer>
            </>
          )}
        </main>

        <MetricDictionaryDialog
          open={dictionaryOpen}
          onOpenChange={setDictionaryOpen}
          data={data}
        />
      </div>
    </TooltipProvider>
  );
}
