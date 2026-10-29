import { BarChart3, UsersRound } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { LicenseTeamPoint } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { EmptyState } from './EmptyState';

interface TeamLicensePanelProps {
  data: LicenseTeamPoint[];
}

export function TeamLicensePanel({ data }: TeamLicensePanelProps) {
  const hasTeams = data.length > 0;
  const chartHeight = Math.max(230, Math.min(360, data.length * 46 + 78));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-4 pb-1">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <CardTitle>团队席位与活跃度</CardTitle>
          </div>
          <CardDescription>按团队对比有效 License 席位、周期活跃用户和当前沉睡账号</CardDescription>
        </div>
        <Badge variant="emerald" className="shrink-0">
          <UsersRound className="h-3 w-3" />
          {data.length} 个团队
        </Badge>
      </CardHeader>
      <CardContent className="pt-3">
        {hasTeams ? (
          <div style={{ height: chartHeight }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 12, bottom: 4 }}>
                <CartesianGrid stroke="#eef2f7" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="teamName"
                  width={126}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <RechartsTooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 30px rgba(15,23,42,.10)',
                    fontSize: 12
                  }}
                />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ paddingTop: 10 }} />
                <Bar dataKey="licenses" name="License 席位" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={10} />
                <Bar dataKey="activeUsers" name="周期活跃" fill="#10b981" radius={[0, 4, 4, 0]} barSize={10} />
                <Bar dataKey="dormant" name="≥90 天沉睡" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            title="暂无团队数据"
            description="纳管团队建立后，可在这里查看各团队的席位与活跃度分布。"
            icon={UsersRound}
          />
        )}
      </CardContent>
    </Card>
  );
}
