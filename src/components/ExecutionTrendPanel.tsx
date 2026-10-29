import { Activity, CalendarDays } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { ExecutionTrendPoint } from '../types';
import { formatNumber, shortDate } from '../lib/format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { EmptyState } from './EmptyState';

interface ExecutionTrendPanelProps {
  data: ExecutionTrendPoint[];
}

export function ExecutionTrendPanel({ data }: ExecutionTrendPanelProps) {
  const totalSuiteRuns = data.reduce((sum, item) => sum + item.suiteRuns, 0);
  const totalScenarioRuns = data.reduce((sum, item) => sum + item.scenarioRuns, 0);
  const hasExecution = totalSuiteRuns + totalScenarioRuns > 0;

  return (
    <Card className="overflow-hidden lg:col-span-8">
      <CardHeader className="flex-row items-start justify-between gap-4 pb-2">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <CardTitle>自动化执行趋势</CardTitle>
          </div>
          <CardDescription>按报告创建日期聚合已完成的套件与场景运行次数</CardDescription>
        </div>
        <Badge variant="blue" className="shrink-0">
          <CalendarDays className="h-3 w-3" />
          周期内
        </Badge>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="mb-4 flex flex-wrap gap-5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">套件运行</p>
            <p className="tabular mt-1 text-xl font-bold text-blue-600">{formatNumber(totalSuiteRuns)}</p>
          </div>
          <div className="h-10 w-px bg-slate-100" />
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">场景运行</p>
            <p className="tabular mt-1 text-xl font-bold text-emerald-600">{formatNumber(totalScenarioRuns)}</p>
          </div>
          <div className="ml-auto hidden items-center gap-4 text-[11px] text-slate-400 sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              套件
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              场景
            </span>
          </div>
        </div>

        <div className="relative h-[258px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="suite-runs-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.015} />
                </linearGradient>
                <linearGradient id="scenario-runs-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.015} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#eef2f7" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                minTickGap={22}
                tickFormatter={(value: string) => shortDate(value)}
                dy={8}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={38}
                domain={[0, 'auto']}
              />
              <RechartsTooltip
                cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 30px rgba(15,23,42,.10)',
                  fontSize: 12,
                  padding: '10px 12px'
                }}
                labelFormatter={(label) => `日期：${String(label)}`}
                formatter={(value, name) => [formatNumber(Number(value)), String(name)]}
              />
              <Area
                type="monotone"
                dataKey="suiteRuns"
                name="套件运行"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#suite-runs-fill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              />
              <Area
                type="monotone"
                dataKey="scenarioRuns"
                name="场景运行"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#scenario-runs-fill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {!hasExecution && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <EmptyState
                compact
                title="周期内暂无自动化运行"
                description="产生已完成的套件或场景测试报告后，这里会展示真实执行趋势。"
                icon={Activity}
                className="pointer-events-auto w-[min(360px,90%)] bg-white/95 shadow-sm backdrop-blur-sm"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
