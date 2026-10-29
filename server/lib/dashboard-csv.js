import { rowsToCsv } from './csv.js';

function formatMetricValue(metric) {
  if (metric.value === null || metric.value === undefined) return '—';
  return metric.unit === 'percent' ? `${metric.value}%` : String(metric.value);
}

function addMetricSection(rows, title, metrics) {
  rows.push([title]);
  rows.push([
    '指标',
    '数值',
    '单位',
    '分子',
    '分母',
    '口径说明',
    '备注',
    '状态'
  ]);
  for (const metric of metrics) {
    rows.push([
      metric.label,
      formatMetricValue(metric),
      metric.unit === 'percent' ? '%' : '个',
      metric.numerator ?? '',
      metric.denominator ?? '',
      metric.description ?? '',
      metric.note ?? '',
      metric.status ?? 'confirmed'
    ]);
  }
  rows.push([]);
}

export function buildDashboardCsv(dashboard) {
  const rows = [
    ['Apifox Dashboard 导出'],
    ['统计周期', dashboard.meta.range.label],
    ['时区', dashboard.meta.timeZone],
    ['导出时间', dashboard.meta.generatedAt],
    ['资产复用窗口', dashboard.meta.reuseWindow.label],
    ['报告通过判定', dashboard.meta.reportSuccessRule],
    []
  ];

  addMetricSection(rows, '测试相关指标', dashboard.metrics.testing);
  addMetricSection(rows, '运维运营指标', dashboard.metrics.operations);

  rows.push(['团队明细']);
  rows.push([
    '团队',
    '纳管项目',
    '使用项目',
    'License 使用数',
    '≥90天沉睡账号',
    '活跃用户',
    '活跃项目',
    '接口总数',
    '单接口用例数',
    '单接口覆盖率',
    '场景用例数',
    '场景覆盖率',
    '套件总数',
    '周期执行套件数',
    '套件执行率',
    '套件运行次数',
    '套件通过次数',
    '套件通过率',
    '周期回收账号',
    '周期活跃'
  ]);
  for (const team of dashboard.teams) {
    rows.push([
      team.name,
      team.managedProjects,
      team.usedProjects,
      team.licenseCount,
      team.dormantAccounts,
      team.activeUsers,
      team.activeProjects,
      team.apiTotal,
      team.singleCaseTotal,
      team.singleCaseCoverage === null ? '—' : `${team.singleCaseCoverage}%`,
      team.scenarioTotal,
      team.scenarioCoverage === null ? '—' : `${team.scenarioCoverage}%`,
      team.suiteTotal,
      team.executedSuiteCount,
      team.suiteExecutionRate === null ? '—' : `${team.suiteExecutionRate}%`,
      team.suiteRuns,
      team.suitePassedRuns,
      team.suitePassRate === null ? '—' : `${team.suitePassRate}%`,
      team.reclaimedAccounts,
      team.activeInPeriod ? '是' : '否'
    ]);
  }
  rows.push([]);

  rows.push(['项目明细']);
  rows.push([
    '团队',
    '项目',
    '接口总数',
    '单接口用例数',
    '单接口覆盖率',
    '场景用例数',
    '场景覆盖率',
    '套件总数',
    '周期执行套件数',
    '套件执行率',
    '套件运行次数',
    '套件通过次数',
    '套件通过率',
    '周期活跃',
    '已使用测试资产'
  ]);
  for (const project of dashboard.projects) {
    rows.push([
      project.teamName,
      project.name,
      project.apiTotal,
      project.singleCaseTotal,
      project.singleCaseCoverage === null ? '—' : `${project.singleCaseCoverage}%`,
      project.scenarioTotal,
      project.scenarioCoverage === null ? '—' : `${project.scenarioCoverage}%`,
      project.suiteTotal,
      project.executedSuiteCount,
      project.suiteExecutionRate === null ? '—' : `${project.suiteExecutionRate}%`,
      project.suiteRuns,
      project.suitePassedRuns,
      project.suitePassRate === null ? '—' : `${project.suitePassRate}%`,
      project.activeInPeriod ? '是' : '否',
      project.usedForTesting ? '是' : '否'
    ]);
  }

  return `\uFEFF${rowsToCsv(rows)}\r\n`;
}
