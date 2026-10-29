import { useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Filter,
  FolderKanban,
  Search,
  TableProperties,
  UsersRound,
  X
} from 'lucide-react';
import type { ProjectRow, TeamRow } from '../types';
import { cn } from '../lib/utils';
import { formatPercent } from '../lib/format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { EmptyState } from './EmptyState';

type Tab = 'projects' | 'teams';

interface DetailTablesProps {
  projects: ProjectRow[];
  teams: TeamRow[];
}

function RateText({ value }: { value: number | null }) {
  return (
    <span className={cn('tabular font-medium', value === null ? 'text-slate-300' : 'text-slate-700')}>
      {formatPercent(value)}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge variant="emerald">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      活跃
    </Badge>
  ) : (
    <Badge variant="outline">未活跃</Badge>
  );
}

export function DetailTables({ projects, teams }: DetailTablesProps) {
  const [tab, setTab] = useState<Tab>('projects');
  const [query, setQuery] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [usedOnly, setUsedOnly] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        if (activeOnly && !project.activeInPeriod) return false;
        if (usedOnly && !project.usedForTesting) return false;
        if (!normalizedQuery) return true;
        return `${project.name} ${project.teamName}`.toLowerCase().includes(normalizedQuery);
      }),
    [projects, normalizedQuery, activeOnly, usedOnly]
  );

  const filteredTeams = useMemo(
    () =>
      teams.filter((team) => {
        if (activeOnly && !team.activeInPeriod) return false;
        if (!normalizedQuery) return true;
        return team.name.toLowerCase().includes(normalizedQuery);
      }),
    [teams, normalizedQuery, activeOnly]
  );

  const switchTab = (nextTab: Tab) => {
    setTab(nextTab);
    setQuery('');
    setActiveOnly(false);
    setUsedOnly(false);
  };

  const hasFilters = Boolean(query) || activeOnly || (tab === 'projects' && usedOnly);
  const showing = tab === 'projects' ? filteredProjects : filteredTeams;
  const total = tab === 'projects' ? projects.length : teams.length;

  return (
    <Card id="details" className="scroll-mt-36 overflow-hidden">
      <CardHeader className="gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <TableProperties className="h-4 w-4 text-blue-600" />
            <CardTitle>组织与项目明细</CardTitle>
          </div>
          <CardDescription>支持按团队、项目名称搜索，并筛选周期活跃或已使用测试资产的对象</CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[190px] flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              aria-label="搜索团队或项目"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tab === 'projects' ? '搜索项目或团队' : '搜索团队'}
              className="h-8 pl-8 pr-8 text-xs"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700"
                aria-label="清空搜索"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            variant={activeOnly ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveOnly((value) => !value)}
          >
            <Activity className="h-3.5 w-3.5" />
            仅看活跃
          </Button>
          {tab === 'projects' && (
            <Button
              variant={usedOnly ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setUsedOnly((value) => !value)}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              已使用资产
            </Button>
          )}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('');
                setActiveOnly(false);
                setUsedOnly(false);
              }}
            >
              <Filter className="h-3.5 w-3.5" />
              重置
            </Button>
          )}
        </div>
      </CardHeader>

      <div className="flex items-center gap-1 border-b border-slate-100 px-4 pt-3 sm:px-5">
        <button
          type="button"
          onClick={() => switchTab('projects')}
          className={cn(
            'relative inline-flex items-center gap-2 px-3 pb-3 pt-1 text-xs font-semibold transition',
            tab === 'projects' ? 'text-blue-700' : 'text-slate-400 hover:text-slate-700'
          )}
        >
          <FolderKanban className="h-3.5 w-3.5" />
          项目明细
          <span
            className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px]',
              tab === 'projects' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
            )}
          >
            {projects.length}
          </span>
          {tab === 'projects' && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-blue-600" />}
        </button>
        <button
          type="button"
          onClick={() => switchTab('teams')}
          className={cn(
            'relative inline-flex items-center gap-2 px-3 pb-3 pt-1 text-xs font-semibold transition',
            tab === 'teams' ? 'text-blue-700' : 'text-slate-400 hover:text-slate-700'
          )}
        >
          <UsersRound className="h-3.5 w-3.5" />
          团队明细
          <span
            className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px]',
              tab === 'teams' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
            )}
          >
            {teams.length}
          </span>
          {tab === 'teams' && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-blue-600" />}
        </button>
      </div>

      <CardContent className="p-0">
        {showing.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title={total === 0 ? (tab === 'projects' ? '暂无项目数据' : '暂无团队数据') : '没有匹配的记录'}
              description={
                total === 0
                  ? '当前只读数据库中没有符合条件的有效记录，计数指标将真实显示为 0。'
                  : '请调整搜索关键词或关闭筛选条件后重试。'
              }
              icon={tab === 'projects' ? FolderKanban : UsersRound}
              compact
            />
          </div>
        ) : tab === 'projects' ? (
          <ProjectTable rows={filteredProjects} />
        ) : (
          <TeamTable rows={filteredTeams} />
        )}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
          <span>
            显示 {showing.length} / {total} 条记录
          </span>
          <span>比例指标分母为 0 时显示为 —</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectTable({ rows }: { rows: ProjectRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1120px] w-full text-left text-xs">
        <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-400">
          <tr>
            <th className="sticky left-0 z-10 bg-slate-50/95 px-5 py-3 font-semibold">项目 / 团队</th>
            <th className="px-3 py-3 text-right font-semibold">接口</th>
            <th className="px-3 py-3 text-right font-semibold">单接口用例</th>
            <th className="px-3 py-3 text-right font-semibold">覆盖</th>
            <th className="px-3 py-3 text-right font-semibold">场景用例</th>
            <th className="px-3 py-3 text-right font-semibold">覆盖</th>
            <th className="px-3 py-3 text-right font-semibold">套件</th>
            <th className="px-3 py-3 text-right font-semibold">执行率</th>
            <th className="px-3 py-3 text-right font-semibold">通过率</th>
            <th className="px-3 py-3 text-center font-semibold">资产使用</th>
            <th className="px-5 py-3 text-center font-semibold">周期状态</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((project) => (
            <tr key={project.id} className="group bg-white transition hover:bg-blue-50/30">
              <td className="sticky left-0 z-10 bg-white px-5 py-3 transition group-hover:bg-blue-50/30">
                <p className="max-w-[210px] truncate font-semibold text-slate-800">{project.name}</p>
                <p className="mt-0.5 max-w-[210px] truncate text-[10px] text-slate-400">{project.teamName}</p>
              </td>
              <td className="tabular px-3 py-3 text-right text-slate-600">{project.apiTotal}</td>
              <td className="tabular px-3 py-3 text-right text-slate-600">{project.singleCaseTotal}</td>
              <td className="px-3 py-3 text-right"><RateText value={project.singleCaseCoverage} /></td>
              <td className="tabular px-3 py-3 text-right text-slate-600">{project.scenarioTotal}</td>
              <td className="px-3 py-3 text-right"><RateText value={project.scenarioCoverage} /></td>
              <td className="tabular px-3 py-3 text-right text-slate-600">{project.suiteTotal}</td>
              <td className="px-3 py-3 text-right"><RateText value={project.suiteExecutionRate} /></td>
              <td className="px-3 py-3 text-right"><RateText value={project.suitePassRate} /></td>
              <td className="px-3 py-3 text-center">
                {project.usedForTesting ? <Badge variant="blue">已使用</Badge> : <Badge variant="outline">未使用</Badge>}
              </td>
              <td className="px-5 py-3 text-center"><StatusBadge active={project.activeInPeriod} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamTable({ rows }: { rows: TeamRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1050px] w-full text-left text-xs">
        <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-400">
          <tr>
            <th className="sticky left-0 z-10 bg-slate-50/95 px-5 py-3 font-semibold">团队</th>
            <th className="px-3 py-3 text-right font-semibold">纳管项目</th>
            <th className="px-3 py-3 text-right font-semibold">使用项目</th>
            <th className="px-3 py-3 text-right font-semibold">License</th>
            <th className="px-3 py-3 text-right font-semibold">≥90 天沉睡</th>
            <th className="px-3 py-3 text-right font-semibold">周期活跃用户</th>
            <th className="px-3 py-3 text-right font-semibold">活跃项目</th>
            <th className="px-3 py-3 text-right font-semibold">套件执行率</th>
            <th className="px-3 py-3 text-right font-semibold">套件通过率</th>
            <th className="px-5 py-3 text-center font-semibold">周期状态</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((team) => (
            <tr key={team.id} className="group bg-white transition hover:bg-blue-50/30">
              <td className="sticky left-0 z-10 bg-white px-5 py-3 font-semibold text-slate-800 transition group-hover:bg-blue-50/30">
                <span className="max-w-[220px] truncate">{team.name}</span>
              </td>
              <td className="tabular px-3 py-3 text-right text-slate-600">{team.managedProjects}</td>
              <td className="tabular px-3 py-3 text-right text-slate-600">{team.usedProjects}</td>
              <td className="tabular px-3 py-3 text-right font-semibold text-slate-800">{team.licenseCount}</td>
              <td className={cn('tabular px-3 py-3 text-right', team.dormantAccounts > 0 ? 'font-semibold text-amber-600' : 'text-slate-500')}>
                {team.dormantAccounts}
              </td>
              <td className="tabular px-3 py-3 text-right text-emerald-700">{team.activeUsers}</td>
              <td className="tabular px-3 py-3 text-right text-slate-600">{team.activeProjects}</td>
              <td className="px-3 py-3 text-right"><RateText value={team.suiteExecutionRate} /></td>
              <td className="px-3 py-3 text-right"><RateText value={team.suitePassRate} /></td>
              <td className="px-5 py-3 text-center"><StatusBadge active={team.activeInPeriod} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
