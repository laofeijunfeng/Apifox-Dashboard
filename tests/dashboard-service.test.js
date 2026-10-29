import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_USER = 'dashboard_test_reader';
process.env.DB_PASSWORD = 'dashboard_test_password';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '3308';
process.env.DB_NAME = 'apifox';
process.env.DASHBOARD_DB_NAME = 'apifox_dashboard';
process.env.APP_TIME_ZONE = 'Asia/Shanghai';

const { DashboardService } = await import('../server/services/dashboard-service.js');

function createRepository(overrides = {}) {
  return {
    listTeams: async () => [],
    listProjects: async () => [],
    getApiCountsByProject: async () => [],
    getSingleCaseCountsByProject: async () => [],
    getSingleCaseCoverageTotal: async () => [{ covered_apis: 0 }],
    getScenarioCountsByProject: async () => [],
    getScenarioCoverageByProject: async () => [],
    getScenarioCoverageTotal: async () => [{ covered_apis: 0 }],
    getSuiteCountsByProject: async () => [],
    listLicenseMembers: async () => [],
    getCompletedReportsInRange: async () => [],
    getSuccessfulSuiteReportsInRange: async () => [],
    getSeatReclaimsInRange: async () => [],
    ...overrides
  };
}

const now = new Date('2026-10-28T04:00:00Z');

test('空业务库返回 0 计数、空比例和明确空库提示', async () => {
  const service = new DashboardService(createRepository(), { now: () => now });
  const dashboard = await service.getDashboard({ days: 30 });
  const metrics = new Map(
    [...dashboard.metrics.testing, ...dashboard.metrics.operations].map((metric) => [metric.id, metric])
  );

  assert.equal(metrics.get('api_total').value, 0);
  assert.equal(metrics.get('single_case_total').value, 0);
  assert.equal(metrics.get('single_case_coverage').value, null);
  assert.equal(metrics.get('project_usage_rate').value, null);
  assert.equal(metrics.get('idle_reclaim_rate').value, null);
  assert.equal(dashboard.summary.projectTotal, 0);
  assert.equal(dashboard.teams.length, 0);
  assert.equal(dashboard.projects.length, 0);
  assert.ok(dashboard.warnings.some((warning) => warning.code === 'empty-business-data'));
});

test('混合样例按去重接口和已完成报告真实聚合', async () => {
  const success = '{"total":3,"failed":0,"pending":0}';
  const failure = '{"total":3,"failed":1,"pending":0}';

  const repository = createRepository({
    listTeams: async () => [
      { id: 1, name: '质量团队', created_at: '2025-01-01 00:00:00', updated_at: '2026-10-01 00:00:00' }
    ],
    listProjects: async () => [
      {
        id: 10,
        name: '订单服务',
        team_id: 1,
        team_name: '质量团队',
        created_at: '2025-01-01 00:00:00',
        updated_at: '2026-10-01 00:00:00'
      }
    ],
    getApiCountsByProject: async () => [
      { project_id: 10, total: 4, last_updated: '2026-10-27 02:00:00' }
    ],
    getSingleCaseCountsByProject: async () => [
      { project_id: 10, total: 3, covered_apis: 2, last_updated: '2026-10-27 02:00:00' }
    ],
    getSingleCaseCoverageTotal: async () => [{ covered_apis: 2 }],
    getScenarioCountsByProject: async () => [
      { project_id: 10, total: 2, last_updated: '2026-10-27 02:00:00' }
    ],
    getScenarioCoverageByProject: async () => [
      { project_id: 10, covered_apis: 1, last_updated: '2026-10-27 02:00:00' }
    ],
    getScenarioCoverageTotal: async () => [{ covered_apis: 1 }],
    getSuiteCountsByProject: async () => [
      { project_id: 10, total: 4, last_updated: '2026-10-27 02:00:00' }
    ],
    listLicenseMembers: async () => [
      {
        team_id: 1,
        user_id: 1001,
        last_active_time: '2026-10-27 01:00:00',
        joined_at: '2025-01-01 00:00:00',
        membership_created_at: '2025-01-01 00:00:00',
        accessed_at: null,
        user_created_at: '2024-01-01 00:00:00'
      },
      {
        team_id: 1,
        user_id: 1002,
        last_active_time: '2026-01-01 00:00:00',
        joined_at: '2025-01-01 00:00:00',
        membership_created_at: '2025-01-01 00:00:00',
        accessed_at: null,
        user_created_at: '2024-01-01 00:00:00'
      }
    ],
    getCompletedReportsInRange: async () => [
      {
        id: 1,
        project_id: 10,
        active_suite_id: 101,
        active_scenario_id: null,
        stats: success,
        created_at: '2026-10-27 01:00:00'
      },
      {
        id: 2,
        project_id: 10,
        active_suite_id: 102,
        active_scenario_id: null,
        stats: failure,
        created_at: '2026-10-27 02:00:00'
      },
      {
        id: 3,
        project_id: 10,
        active_suite_id: null,
        active_scenario_id: 501,
        stats: success,
        created_at: '2026-10-27 03:00:00'
      },
      {
        id: 4,
        project_id: 10,
        active_suite_id: null,
        active_scenario_id: 502,
        stats: failure,
        created_at: '2026-10-27 04:00:00'
      }
    ],
    getSuccessfulSuiteReportsInRange: async () => [
      {
        id: 1,
        project_id: 10,
        active_suite_id: 101,
        stats: success,
        created_at: '2026-10-27 01:00:00'
      },
      {
        id: 2,
        project_id: 10,
        active_suite_id: 102,
        stats: failure,
        created_at: '2026-10-27 02:00:00'
      }
    ],
    getSeatReclaimsInRange: async () => [
      {
        id: 1,
        team_id: 1,
        user_id: 1002,
        reclaimed_at: '2026-10-27 00:00:00',
        reason: '长期未登录',
        operator_name: 'ops'
      }
    ]
  });

  const service = new DashboardService(repository, { now: () => now });
  const dashboard = await service.getDashboard({ days: 30 });
  const metrics = new Map(
    [...dashboard.metrics.testing, ...dashboard.metrics.operations].map((metric) => [metric.id, metric])
  );

  assert.equal(metrics.get('api_total').value, 4);
  assert.equal(metrics.get('single_case_total').value, 3);
  assert.equal(metrics.get('single_case_coverage').value, 50);
  assert.equal(metrics.get('scenario_total').value, 2);
  assert.equal(metrics.get('scenario_coverage').value, 25);
  assert.equal(metrics.get('scenario_success_rate').value, 50);
  assert.equal(metrics.get('suite_execution_rate').value, 50);
  assert.equal(metrics.get('suite_pass_rate').value, 50);
  assert.equal(metrics.get('project_usage_count').value, 1);
  assert.equal(metrics.get('project_usage_rate').value, 100);
  assert.equal(metrics.get('asset_reuse_rate').value, 25);
  assert.equal(metrics.get('license_usage').value, 2);
  assert.equal(metrics.get('dormant_accounts').value, 1);
  assert.equal(metrics.get('active_users').value, 1);
  assert.equal(metrics.get('idle_reclaim_rate').value, 100);

  assert.equal(dashboard.summary.suiteTotal, 4);
  assert.equal(dashboard.summary.usedProjects, 1);
  assert.equal(dashboard.projects[0].suiteRuns, 2);
  assert.equal(dashboard.projects[0].suitePassedRuns, 1);
  assert.equal(dashboard.charts.coverage.singleCase.covered, 2);
  const reportDay = dashboard.charts.executionTrend.find((point) => point.date === '2026-10-27');
  assert.equal(reportDay.totalRuns, 4);
});
