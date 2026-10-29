import { query } from '../db.js';

const ACTIVE_HTTP_APIS = 'a.deleted_at IS NULL';
const SUITE_TYPE_SQL = "LOWER(REPLACE(COALESCE(r.type, ''), '-', '_')) IN ('test_suite', 'testcollection', 'test_case_group')";

export class DashboardRepository {
  async listTeams() {
    return query(`
      SELECT id, name, created_at, updated_at
      FROM teams
      WHERE deleted_at IS NULL
      ORDER BY name ASC, id ASC
    `);
  }

  async listProjects() {
    return query(`
      SELECT p.id, p.name, p.team_id, p.created_at, p.updated_at, t.name AS team_name
      FROM projects p
      JOIN teams t ON t.id = p.team_id AND t.deleted_at IS NULL
      WHERE p.deleted_at IS NULL
      ORDER BY t.name ASC, p.name ASC, p.id ASC
    `);
  }

  async getApiCountsByProject() {
    return query(`
      SELECT project_id, COUNT(*) AS total, MAX(updated_at) AS last_updated
      FROM http_apis
      WHERE deleted_at IS NULL
      GROUP BY project_id
    `);
  }

  async getSingleCaseCountsByProject() {
    return query(`
      SELECT
        a.project_id,
        COUNT(*) AS total,
        COUNT(DISTINCT c.api_detail_id) AS covered_apis,
        MAX(c.updated_at) AS last_updated
      FROM http_api_cases c
      JOIN http_apis a ON a.id = c.api_detail_id AND ${ACTIVE_HTTP_APIS}
      WHERE c.deleted_at IS NULL
        AND c.type = 'TEST_CASE'
        AND c.api_detail_id > 0
      GROUP BY a.project_id
    `);
  }

  async getSingleCaseCoverageTotal() {
    return query(`
      SELECT COUNT(DISTINCT c.api_detail_id) AS covered_apis
      FROM http_api_cases c
      JOIN http_apis a ON a.id = c.api_detail_id AND ${ACTIVE_HTTP_APIS}
      JOIN projects p ON p.id = a.project_id AND p.deleted_at IS NULL
      WHERE c.deleted_at IS NULL
        AND c.type = 'TEST_CASE'
        AND c.api_detail_id > 0
    `);
  }

  async getScenarioCountsByProject() {
    return query(`
      SELECT project_id, COUNT(*) AS total, MAX(updated_at) AS last_updated
      FROM api_test_cases
      WHERE deleted_at IS NULL
      GROUP BY project_id
    `);
  }

  async getScenarioCoverageByProject() {
    return query(`
      SELECT
        r.project_id,
        COUNT(DISTINCT r.endpoint_id) AS covered_apis,
        MAX(r.updated_at) AS last_updated
      FROM api_test_scenario_step_references r
      JOIN api_test_cases tc
        ON tc.id = r.test_scenario_id
        AND tc.deleted_at IS NULL
      JOIN http_apis a ON a.id = r.endpoint_id AND ${ACTIVE_HTTP_APIS}
      JOIN projects p ON p.id = r.project_id AND p.deleted_at IS NULL
      WHERE r.deleted_at IS NULL
        AND r.endpoint_id > 0
      GROUP BY r.project_id
    `);
  }

  async getScenarioCoverageTotal() {
    return query(`
      SELECT COUNT(DISTINCT r.endpoint_id) AS covered_apis
      FROM api_test_scenario_step_references r
      JOIN api_test_cases tc
        ON tc.id = r.test_scenario_id
        AND tc.deleted_at IS NULL
      JOIN http_apis a ON a.id = r.endpoint_id AND ${ACTIVE_HTTP_APIS}
      JOIN projects p ON p.id = r.project_id AND p.deleted_at IS NULL
      WHERE r.deleted_at IS NULL
        AND r.endpoint_id > 0
    `);
  }

  async getSuiteCountsByProject() {
    return query(`
      SELECT project_id, COUNT(*) AS total, MAX(updated_at) AS last_updated
      FROM api_test_suites
      WHERE deleted_at IS NULL
      GROUP BY project_id
    `);
  }

  async listLicenseMembers() {
    return query(`
      SELECT DISTINCT
        tm.team_id,
        tm.user_id,
        tm.last_active_time,
        tm.joined_at,
        tm.created_at AS membership_created_at,
        u.accessed_at,
        u.created_at AS user_created_at
      FROM team_members tm
      JOIN teams t ON t.id = tm.team_id AND t.deleted_at IS NULL
      JOIN users u ON u.id = tm.user_id AND u.deleted_at IS NULL AND u.status <> 0
      WHERE tm.deleted_at IS NULL
        AND tm.team_deleted = 0
        AND tm.status = 1
      ORDER BY tm.team_id, tm.user_id
    `);
  }

  async getCompletedReportsInRange(startDb, endDb) {
    return query(`
      SELECT
        r.id,
        r.project_id,
        r.related_id,
        r.test_suite_id,
        r.type,
        r.stats,
        r.created_at,
        tc.id AS active_scenario_id,
        s.id AS active_suite_id
      FROM api_test_reports r
      JOIN projects p ON p.id = r.project_id AND p.deleted_at IS NULL
      LEFT JOIN api_test_cases tc
        ON tc.id = r.related_id
        AND tc.deleted_at IS NULL
        AND LOWER(r.type) = 'testcase'
      LEFT JOIN api_test_suites s
        ON s.id = CASE
          WHEN r.test_suite_id > 0 THEN r.test_suite_id
          WHEN ${SUITE_TYPE_SQL} THEN r.related_id
          ELSE 0
        END
        AND s.deleted_at IS NULL
      WHERE r.deleted_at IS NULL
        AND r.status = 'done'
        AND r.created_at >= ?
        AND r.created_at < ?
        AND (tc.id IS NOT NULL OR s.id IS NOT NULL)
      ORDER BY r.created_at ASC, r.id ASC
    `, [startDb, endDb]);
  }

  async getSuccessfulSuiteReportsInRange(startDb, endDb) {
    return query(`
      SELECT
        r.id,
        r.project_id,
        r.related_id,
        r.test_suite_id,
        r.type,
        r.stats,
        r.created_at,
        s.id AS active_suite_id
      FROM api_test_reports r
      JOIN projects p ON p.id = r.project_id AND p.deleted_at IS NULL
      JOIN api_test_suites s
        ON s.id = CASE
          WHEN r.test_suite_id > 0 THEN r.test_suite_id
          WHEN ${SUITE_TYPE_SQL} THEN r.related_id
          ELSE 0
        END
        AND s.deleted_at IS NULL
      WHERE r.deleted_at IS NULL
        AND r.status = 'done'
        AND r.created_at >= ?
        AND r.created_at < ?
      ORDER BY r.created_at ASC, r.id ASC
    `, [startDb, endDb]);
  }

  async getSeatReclaimsInRange(startDb, endDb) {
    return query(`
      SELECT id, team_id, user_id, reclaimed_at, reason, operator_name
      FROM \`${process.env.DASHBOARD_DB_NAME || 'apifox_dashboard'}\`.seat_reclaims
      WHERE deleted_at IS NULL
        AND reclaimed_at >= ?
        AND reclaimed_at < ?
      ORDER BY reclaimed_at ASC, id ASC
    `, [startDb, endDb]);
  }
}
