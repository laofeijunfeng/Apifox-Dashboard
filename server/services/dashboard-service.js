import { DashboardRepository } from './dashboard-repository.js';
import { config } from '../config.js';
import {
  dateKeyInShanghai,
  eachDate,
  parseDbUtc,
  resolveDateRange,
  resolveReuseWindow
} from '../lib/date-range.js';
import { isReportSuccessful } from '../lib/report-stats.js';
import { countUnique, percent, toCount } from '../lib/ratio.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const DORMANT_DAYS = 90;

function latestDate(dates) {
  let result = null;
  for (const value of dates) {
    const date = value instanceof Date ? value : parseDbUtc(value);
    if (date && (!result || date > result)) result = date;
  }
  return result;
}

function within(date, start, end) {
  return Boolean(date && date >= start && date < end);
}

function maxDbDate(current, next) {
  if (!next) return current;
  if (!current || String(next) > String(current)) return String(next);
  return current;
}

function emptyProjectStats() {
  return {
    apiTotal: 0,
    singleCaseTotal: 0,
    singleCaseCoveredApis: 0,
    scenarioTotal: 0,
    scenarioCoveredApis: 0,
    suiteTotal: 0,
    executedSuiteIds: new Set(),
    successfulSuiteIds: new Set(),
    suiteRuns: 0,
    suitePassedRuns: 0,
    scenarioRuns: 0,
    scenarioPassedRuns: 0,
    lastActivity: null,
    reportActivity: null
  };
}

function getOrCreate(map, key, factory) {
  if (!map.has(key)) map.set(key, factory());
  return map.get(key);
}

function countMetric(id, label, value, extras = {}) {
  return {
    id,
    label,
    unit: 'count',
    value: toCount(value),
    numerator: toCount(value),
    denominator: null,
    ...extras
  };
}

function rateMetric(id, label, numerator, denominator, extras = {}) {
  return {
    id,
    label,
    unit: 'percent',
    value: percent(numerator, denominator),
    numerator: toCount(numerator),
    denominator: toCount(denominator),
    ...extras
  };
}

function buildTrend(startDate, endDate, dailyMap) {
  const dates = eachDate(startDate, endDate);
  if (dates.length <= 62) {
    return dates.map((date) => {
      const item = dailyMap.get(date) ?? {};
      return {
        date,
        suiteRuns: toCount(item.suiteRuns),
        suitePassedRuns: toCount(item.suitePassedRuns),
        scenarioRuns: toCount(item.scenarioRuns),
        scenarioPassedRuns: toCount(item.scenarioPassedRuns),
        totalRuns: toCount(item.suiteRuns) + toCount(item.scenarioRuns)
      };
    });
  }

  const buckets = [];
  for (let index = 0; index < dates.length; index += 7) {
    const chunk = dates.slice(index, index + 7);
    const bucket = {
      date: chunk[0],
      endDate: chunk[chunk.length - 1],
      suiteRuns: 0,
      suitePassedRuns: 0,
      scenarioRuns: 0,
      scenarioPassedRuns: 0,
      totalRuns: 0
    };
    for (const date of chunk) {
      const item = dailyMap.get(date) ?? {};
      bucket.suiteRuns += toCount(item.suiteRuns);
      bucket.suitePassedRuns += toCount(item.suitePassedRuns);
      bucket.scenarioRuns += toCount(item.scenarioRuns);
      bucket.scenarioPassedRuns += toCount(item.scenarioPassedRuns);
    }
    bucket.totalRuns = bucket.suiteRuns + bucket.scenarioRuns;
    buckets.push(bucket);
  }
  return buckets;
}

function dateText(date) {
  return date ? date.toISOString() : null;
}

export class DashboardService {
  constructor(repository = new DashboardRepository(), options = {}) {
    this.repository = repository;
    this.now = options.now ?? (() => new Date());
  }

  async getDashboard(input = {}) {
    const now = this.now();
    const range = resolveDateRange(input, { timeZone: config.timeZone, now });
    const reuseWindow = resolveReuseWindow(now, 90, config.timeZone);
    const dormantThreshold = new Date(now.getTime() - DORMANT_DAYS * DAY_MS);

    const [
      teams,
      projects,
      apiRows,
      singleCaseRows,
      singleCaseCoverageRows,
      scenarioRows,
      scenarioCoverageRows,
      scenarioCoverageTotalRows,
      suiteRows,
      licenseMembers,
      reportRows,
      reuseReportRows
    ] = await Promise.all([
      this.repository.listTeams(),
      this.repository.listProjects(),
      this.repository.getApiCountsByProject(),
      this.repository.getSingleCaseCountsByProject(),
      this.repository.getSingleCaseCoverageTotal(),
      this.repository.getScenarioCountsByProject(),
      this.repository.getScenarioCoverageByProject(),
      this.repository.getScenarioCoverageTotal(),
      this.repository.getSuiteCountsByProject(),
      this.repository.listLicenseMembers(),
      this.repository.getCompletedReportsInRange(range.startDb, range.endDb),
      this.repository.getSuccessfulSuiteReportsInRange(
        reuseWindow.startDb,
        reuseWindow.endDb
      )
    ]);

    const teamById = new Map(teams.map((team) => [Number(team.id), team]));
    const projectById = new Map(
      projects.map((project) => [Number(project.id), { ...project, stats: emptyProjectStats() }])
    );

    const projectStats = (projectId) => {
      const project = projectById.get(Number(projectId));
      return project?.stats ?? null;
    };

    for (const row of apiRows) {
      const stats = projectStats(row.project_id);
      if (!stats) continue;
      stats.apiTotal = toCount(row.total);
      stats.lastActivity = maxDbDate(stats.lastActivity, row.last_updated);
    }
    for (const row of singleCaseRows) {
      const stats = projectStats(row.project_id);
      if (!stats) continue;
      stats.singleCaseTotal = toCount(row.total);
      stats.singleCaseCoveredApis = toCount(row.covered_apis);
      stats.lastActivity = maxDbDate(stats.lastActivity, row.last_updated);
    }
    for (const row of scenarioRows) {
      const stats = projectStats(row.project_id);
      if (!stats) continue;
      stats.scenarioTotal = toCount(row.total);
      stats.lastActivity = maxDbDate(stats.lastActivity, row.last_updated);
    }
    for (const row of scenarioCoverageRows) {
      const stats = projectStats(row.project_id);
      if (!stats) continue;
      stats.scenarioCoveredApis = toCount(row.covered_apis);
      stats.lastActivity = maxDbDate(stats.lastActivity, row.last_updated);
    }
    for (const row of suiteRows) {
      const stats = projectStats(row.project_id);
      if (!stats) continue;
      stats.suiteTotal = toCount(row.total);
      stats.lastActivity = maxDbDate(stats.lastActivity, row.last_updated);
    }

    const dailyMap = new Map();
    let executedSuiteIds = new Set();
    let successfulSuiteIds = new Set();
    let suiteRuns = 0;
    let suitePassedRuns = 0;
    let scenarioRuns = 0;
    let scenarioPassedRuns = 0;

    for (const row of reportRows) {
      const stats = projectStats(row.project_id);
      if (!stats) continue;
      const successful = isReportSuccessful(row.stats);
      const suiteId = Number(row.active_suite_id ?? 0);
      const scenarioId = Number(row.active_scenario_id ?? 0);
      const projectSuiteId = suiteId > 0 ? suiteId : null;

      if (projectSuiteId) {
        stats.suiteRuns += 1;
        stats.executedSuiteIds.add(projectSuiteId);
        executedSuiteIds.add(projectSuiteId);
        suiteRuns += 1;
        if (successful) {
          stats.suitePassedRuns += 1;
          stats.successfulSuiteIds.add(projectSuiteId);
          successfulSuiteIds.add(projectSuiteId);
          suitePassedRuns += 1;
        }
      }
      if (scenarioId > 0) {
        stats.scenarioRuns += 1;
        scenarioRuns += 1;
        if (successful) {
          stats.scenarioPassedRuns += 1;
          scenarioPassedRuns += 1;
        }
      }

      const reportDate = parseDbUtc(row.created_at);
      stats.reportActivity = maxDbDate(stats.reportActivity, row.created_at);
      stats.lastActivity = maxDbDate(stats.lastActivity, row.created_at);

      const day = dateKeyInShanghai(row.created_at);
      if (day) {
        const bucket = getOrCreate(dailyMap, day, () => ({
          suiteRuns: 0,
          suitePassedRuns: 0,
          scenarioRuns: 0,
          scenarioPassedRuns: 0
        }));
        if (projectSuiteId && reportDate) {
          bucket.suiteRuns += 1;
          if (successful) bucket.suitePassedRuns += 1;
        }
        if (scenarioId > 0 && reportDate) {
          bucket.scenarioRuns += 1;
          if (successful) bucket.scenarioPassedRuns += 1;
        }
      }
    }

    const reuseSuccessfulSuiteIds = new Set();
    for (const row of reuseReportRows) {
      const suiteId = Number(row.active_suite_id ?? 0);
      if (suiteId > 0 && isReportSuccessful(row.stats)) {
        reuseSuccessfulSuiteIds.add(suiteId);
      }
    }

    const teamUserActivity = new Map();
    const userActivity = new Map();
    const licenseUserIds = new Set();

    for (const row of licenseMembers) {
      const userId = Number(row.user_id);
      const teamId = Number(row.team_id);
      if (!userId || !teamId || !teamById.has(teamId)) continue;
      const activity = latestDate([
        row.last_active_time,
        row.accessed_at,
        row.joined_at,
        row.membership_created_at,
        row.user_created_at
      ]);
      if (!activity) continue;
      licenseUserIds.add(userId);

      const teamMap = getOrCreate(teamUserActivity, teamId, () => new Map());
      const previousTeamDate = teamMap.get(userId);
      if (!previousTeamDate || activity > previousTeamDate) teamMap.set(userId, activity);

      const previousUserDate = userActivity.get(userId);
      if (!previousUserDate || activity > previousUserDate) userActivity.set(userId, activity);
    }

    const dormantUserIds = new Set();
    const activeUserIds = new Set();
    for (const [userId, activity] of userActivity) {
      if (activity <= dormantThreshold) dormantUserIds.add(userId);
      if (within(activity, range.startUtc, range.endUtc)) activeUserIds.add(userId);
    }

    const activeProjectIds = new Set();
    for (const [projectId, project] of projectById) {
      const lastActivity = parseDbUtc(project.stats.lastActivity);
      if (within(lastActivity, range.startUtc, range.endUtc)) {
        activeProjectIds.add(projectId);
      }
    }

    const activeTeamIds = new Set();
    for (const projectId of activeProjectIds) {
      const project = projectById.get(projectId);
      if (project) activeTeamIds.add(Number(project.team_id));
    }
    for (const [teamId, members] of teamUserActivity) {
      for (const activity of members.values()) {
        if (within(activity, range.startUtc, range.endUtc)) {
          activeTeamIds.add(teamId);
          break;
        }
      }
    }

    const projectRows = [...projectById.values()].map((project) => {
      const stats = project.stats;
      const usedForTesting = stats.singleCaseTotal > 0 || stats.scenarioTotal > 0;
      return {
        id: Number(project.id),
        name: project.name,
        teamId: Number(project.team_id),
        teamName: project.team_name,
        apiTotal: stats.apiTotal,
        singleCaseTotal: stats.singleCaseTotal,
        singleCaseCoveredApis: stats.singleCaseCoveredApis,
        singleCaseCoverage: percent(stats.singleCaseCoveredApis, stats.apiTotal),
        scenarioTotal: stats.scenarioTotal,
        scenarioCoveredApis: stats.scenarioCoveredApis,
        scenarioCoverage: percent(stats.scenarioCoveredApis, stats.apiTotal),
        suiteTotal: stats.suiteTotal,
        executedSuiteCount: stats.executedSuiteIds.size,
        suiteExecutionRate: percent(stats.executedSuiteIds.size, stats.suiteTotal),
        suiteRuns: stats.suiteRuns,
        suitePassedRuns: stats.suitePassedRuns,
        suitePassRate: percent(stats.suitePassedRuns, stats.suiteRuns),
        scenarioRuns: stats.scenarioRuns,
        scenarioPassedRuns: stats.scenarioPassedRuns,
        scenarioSuccessRate: percent(stats.scenarioPassedRuns, stats.scenarioRuns),
        usedForTesting,
        activeInPeriod: activeProjectIds.has(Number(project.id)),
        lastActivity: dateText(parseDbUtc(stats.lastActivity))
      };
    });

    const teamRows = teams.map((team) => {
      const teamId = Number(team.id);
      const teamProjects = projectRows.filter((project) => project.teamId === teamId);
      const members = teamUserActivity.get(teamId) ?? new Map();
      const teamActiveUserIds = [...members.entries()]
        .filter(([, activity]) => within(activity, range.startUtc, range.endUtc))
        .map(([userId]) => userId);
      const teamDormantIds = [...members.entries()]
        .filter(([, activity]) => activity <= dormantThreshold)
        .map(([userId]) => userId);
      const teamApiTotal = teamProjects.reduce((sum, project) => sum + project.apiTotal, 0);
      const teamSingleCovered = teamProjects.reduce(
        (sum, project) => sum + project.singleCaseCoveredApis,
        0
      );
      const teamScenarioCovered = teamProjects.reduce(
        (sum, project) => sum + project.scenarioCoveredApis,
        0
      );
      const teamSuiteTotal = teamProjects.reduce((sum, project) => sum + project.suiteTotal, 0);
      const executedForTeam = new Set();
      const successfulForTeam = new Set();
      let teamSuiteRuns = 0;
      let teamSuitePassedRuns = 0;
      let teamScenarioRuns = 0;
      let teamScenarioPassedRuns = 0;
      for (const project of teamProjects) {
        for (const suiteId of projectById.get(project.id).stats.executedSuiteIds) {
          executedForTeam.add(suiteId);
        }
        for (const suiteId of projectById.get(project.id).stats.successfulSuiteIds) {
          successfulForTeam.add(suiteId);
        }
        teamSuiteRuns += project.suiteRuns;
        teamSuitePassedRuns += project.suitePassedRuns;
        teamScenarioRuns += project.scenarioRuns;
        teamScenarioPassedRuns += project.scenarioPassedRuns;
      }

      return {
        id: teamId,
        name: team.name,
        managedProjects: teamProjects.length,
        usedProjects: teamProjects.filter((project) => project.usedForTesting).length,
        licenseCount: members.size,
        dormantAccounts: teamDormantIds.length,
        activeUsers: new Set(teamActiveUserIds).size,
        activeProjects: teamProjects.filter((project) => project.activeInPeriod).length,
        apiTotal: teamApiTotal,
        singleCaseTotal: teamProjects.reduce(
          (sum, project) => sum + project.singleCaseTotal,
          0
        ),
        singleCaseCoveredApis: teamSingleCovered,
        singleCaseCoverage: percent(teamSingleCovered, teamApiTotal),
        scenarioTotal: teamProjects.reduce((sum, project) => sum + project.scenarioTotal, 0),
        scenarioCoveredApis: teamScenarioCovered,
        scenarioCoverage: percent(teamScenarioCovered, teamApiTotal),
        suiteTotal: teamSuiteTotal,
        executedSuiteCount: executedForTeam.size,
        suiteExecutionRate: percent(executedForTeam.size, teamSuiteTotal),
        suiteRuns: teamSuiteRuns,
        suitePassedRuns: teamSuitePassedRuns,
        suitePassRate: percent(teamSuitePassedRuns, teamSuiteRuns),
        successfulSuiteCount: successfulForTeam.size,
        scenarioRuns: teamScenarioRuns,
        scenarioPassedRuns: teamScenarioPassedRuns,
        scenarioSuccessRate: percent(teamScenarioPassedRuns, teamScenarioRuns),
        activeInPeriod: activeTeamIds.has(teamId)
      };
    });

    const apiTotal = [...projectById.values()].reduce(
      (sum, project) => sum + project.stats.apiTotal,
      0
    );
    const singleCaseTotal = [...projectById.values()].reduce(
      (sum, project) => sum + project.stats.singleCaseTotal,
      0
    );
    const scenarioTotal = [...projectById.values()].reduce(
      (sum, project) => sum + project.stats.scenarioTotal,
      0
    );
    const suiteTotal = [...projectById.values()].reduce(
      (sum, project) => sum + project.stats.suiteTotal,
      0
    );
    const singleCaseCoverageTotal = toCount(singleCaseCoverageRows[0]?.covered_apis);
    const scenarioCoverageTotal = toCount(scenarioCoverageTotalRows[0]?.covered_apis);
    const usedProjects = projectRows.filter((project) => project.usedForTesting);
    const dormantCount = dormantUserIds.size;

    const testingMetrics = [
      countMetric('api_total', '接口总数', apiTotal, {
        description: '当前未删除且所属项目有效的 HTTP 接口数。该指标为存量，不受日期周期影响。'
      }),
      countMetric('single_case_total', '单接口用例总数', singleCaseTotal, {
        description:
          '当前有效的单接口测试用例数（http_api_cases.type=TEST_CASE，且关联有效接口）。'
      }),
      rateMetric(
        'single_case_coverage',
        '单接口用例覆盖率',
        singleCaseCoverageTotal,
        apiTotal,
        {
          description: '有至少 1 条有效单接口用例的接口数 ÷ 有效接口总数。',
          note: '分子为去重接口数，不是用例条数。'
        }
      ),
      countMetric('scenario_total', '场景用例总数', scenarioTotal, {
        description: '当前未删除的自动化测试场景数（api_test_cases）。'
      }),
      rateMetric(
        'scenario_coverage',
        '场景用例覆盖率',
        scenarioCoverageTotal,
        apiTotal,
        {
          description: '被有效场景步骤关联到的去重接口数 ÷ 有效接口总数。'
        }
      ),
      rateMetric(
        'scenario_success_rate',
        '场景用例执行成功率',
        scenarioPassedRuns,
        scenarioRuns,
        {
          description:
            '周期内状态为 done 的场景运行报告中“完全通过”的报告数 ÷ 已完成场景运行报告数。',
          note: scenarioRuns === 0 ? '周期内没有已完成的场景运行报告。' : undefined
        }
      ),
      rateMetric(
        'suite_execution_rate',
        '测试套件执行率',
        executedSuiteIds.size,
        suiteTotal,
        {
          description: '周期内至少产生 1 次自动化运行报告的套件数 ÷ 当前有效套件总数。'
        }
      ),
      rateMetric(
        'suite_pass_rate',
        '套件执行通过率',
        suitePassedRuns,
        suiteRuns,
        {
          description:
            '周期内完全通过的套件运行次数 ÷ 周期内已完成的套件运行次数。',
          note: suiteRuns === 0 ? '周期内没有已完成的套件运行报告。' : undefined
        }
      ),
      countMetric('project_usage_count', '项目使用数', usedProjects.length, {
        description: '至少存在 1 条有效单接口用例或有效场景用例的项目数。'
      }),
      rateMetric('project_usage_rate', '项目使用率', usedProjects.length, projectRows.length, {
        description: '有有效单接口用例或场景用例的项目数 ÷ 有效项目总数。'
      }),
      rateMetric(
        'asset_reuse_rate',
        '资产有效复用率',
        reuseSuccessfulSuiteIds.size,
        suiteTotal,
        {
          description:
            '近 90 天至少成功运行过 1 次的套件数 ÷ 当前有效套件总数。',
          note: `固定窗口：${reuseWindow.label}；不受上方周期筛选影响。`
        }
      )
    ];

    const operationsMetrics = [
      countMetric('managed_teams', '纳管团队总数', teams.length, {
        description: '当前未删除的团队数。'
      }),
      countMetric('managed_projects', '纳管项目总数', projectRows.length, {
        description: '当前未删除且所属团队有效的项目数。'
      }),
      countMetric('license_usage', 'License 使用数', licenseUserIds.size, {
        description:
          '有效团队中状态正常的成员席位覆盖的不同有效用户数；跨团队重复账号只计 1 次。'
      }),
      countMetric('dormant_accounts', '≥90 天沉睡账号', dormantCount, {
        description:
          '有效席位账号最近可用活动时间早于或等于当前时间减 90 天；取团队最后活跃、账号访问、加入及创建时间中的最新可用值。'
      }),
      countMetric('active_teams', '活跃团队数', activeTeamIds.size, {
        description: '所选周期内存在活跃成员或活跃项目的团队数。',
        note: range.label
      }),
      countMetric('active_projects', '活跃项目数', activeProjectIds.size, {
        description:
          '所选周期内接口、单接口用例、场景、套件或已完成测试报告有更新的项目数。',
        note: range.label
      }),
      countMetric('active_users', '活跃用户数', activeUserIds.size, {
        description: '所选周期内有最近活动时间的不同有效席位用户数。',
        note: range.label
      })
    ];

    const nonEmptySignals =
      teams.length +
      projectRows.length +
      apiTotal +
      singleCaseTotal +
      scenarioTotal +
      suiteTotal +
      licenseUserIds.size;
    const warnings = [];
    if (nonEmptySignals === 0) {
      warnings.push({
        code: 'empty-business-data',
        level: 'info',
        message: 'Apifox 业务库当前没有可统计的有效数据，存量指标为 0，比例指标显示为 —。'
      });
    }

    const trend = buildTrend(range.startDate, range.endDate, dailyMap);
    const licenseByTeam = teamRows.map((team) => ({
      teamId: team.id,
      teamName: team.name,
      licenses: team.licenseCount,
      dormant: team.dormantAccounts,
      activeUsers: team.activeUsers
    }));

    return {
      meta: {
        generatedAt: now.toISOString(),
        timeZone: config.timeZone,
        database: config.db.database,
        readOnly: true,
        range: {
          startDate: range.startDate,
          endDate: range.endDate,
          dayCount: range.dayCount,
          startUtc: range.startUtc.toISOString(),
          endExclusiveUtc: range.endUtc.toISOString(),
          label: range.label
        },
        reuseWindow: {
          days: reuseWindow.days,
          startDate: reuseWindow.startDate,
          endDate: reuseWindow.endDate,
          label: reuseWindow.label
        },
        dormantThreshold: dormantThreshold.toISOString(),
        reportSuccessRule:
          '仅统计 status=done 的报告；stats 中 failed/pending 均为 0 且存在统计计数时视为完全通过。'
      },
      metrics: {
        testing: testingMetrics,
        operations: operationsMetrics
      },
      summary: {
        apiTotal,
        singleCaseTotal,
        scenarioTotal,
        suiteTotal,
        usedProjects: usedProjects.length,
        projectTotal: projectRows.length,
        managedTeams: teams.length,
        licenseUsage: licenseUserIds.size,
        dormantAccounts: dormantCount,
        activeTeams: activeTeamIds.size,
        activeProjects: activeProjectIds.size,
        activeUsers: activeUserIds.size
      },
      charts: {
        coverage: {
          singleCase: {
            covered: singleCaseCoverageTotal,
            total: apiTotal,
            percent: percent(singleCaseCoverageTotal, apiTotal)
          },
          scenario: {
            covered: scenarioCoverageTotal,
            total: apiTotal,
            percent: percent(scenarioCoverageTotal, apiTotal)
          }
        },
        executionTrend: trend,
        licenseByTeam,
        teamTesting: teamRows.map((team) => ({
          teamId: team.id,
          teamName: team.name,
          apiTotal: team.apiTotal,
          singleCaseTotal: team.singleCaseTotal,
          scenarioTotal: team.scenarioTotal,
          suiteTotal: team.suiteTotal,
          suiteExecutionRate: team.suiteExecutionRate,
          suitePassRate: team.suitePassRate
        }))
      },
      teams: teamRows,
      projects: projectRows,
      warnings
    };
  }
}
