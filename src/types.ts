export type MetricUnit = 'count' | 'percent';

export interface Metric {
  id: string;
  label: string;
  unit: MetricUnit;
  value: number | null;
  numerator: number;
  denominator: number | null;
  description?: string;
  note?: string;
  status?: 'confirmed' | 'pending-confirmation' | string;
  availability?: 'available' | 'unavailable' | string;
}

export interface DashboardMeta {
  generatedAt: string;
  timeZone: string;
  database: string;
  readOnly: boolean;
  range: {
    startDate: string;
    endDate: string;
    dayCount: number;
    startUtc: string;
    endExclusiveUtc: string;
    label: string;
  };
  reuseWindow: {
    days: number;
    startDate: string;
    endDate: string;
    label: string;
  };
  dormantThreshold: string;
  reportSuccessRule: string;
}

export interface DashboardSummary {
  apiTotal: number;
  singleCaseTotal: number;
  scenarioTotal: number;
  suiteTotal: number;
  usedProjects: number;
  projectTotal: number;
  managedTeams: number;
  licenseUsage: number;
  dormantAccounts: number;
  activeTeams: number;
  activeProjects: number;
  activeUsers: number;
}

export interface CoverageMetric {
  covered: number;
  total: number;
  percent: number | null;
}

export interface ExecutionTrendPoint {
  date: string;
  endDate?: string;
  suiteRuns: number;
  suitePassedRuns: number;
  scenarioRuns: number;
  scenarioPassedRuns: number;
  totalRuns: number;
}

export interface LicenseTeamPoint {
  teamId: number;
  teamName: string;
  licenses: number;
  dormant: number;
  activeUsers: number;
}

export interface TeamTestingPoint {
  teamId: number;
  teamName: string;
  apiTotal: number;
  singleCaseTotal: number;
  scenarioTotal: number;
  suiteTotal: number;
  suiteExecutionRate: number | null;
  suitePassRate: number | null;
}

export interface TeamRow {
  id: number;
  name: string;
  managedProjects: number;
  usedProjects: number;
  licenseCount: number;
  dormantAccounts: number;
  activeUsers: number;
  activeProjects: number;
  apiTotal: number;
  singleCaseTotal: number;
  singleCaseCoveredApis: number;
  singleCaseCoverage: number | null;
  scenarioTotal: number;
  scenarioCoveredApis: number;
  scenarioCoverage: number | null;
  suiteTotal: number;
  executedSuiteCount: number;
  suiteExecutionRate: number | null;
  suiteRuns: number;
  suitePassedRuns: number;
  suitePassRate: number | null;
  successfulSuiteCount: number;
  scenarioRuns: number;
  scenarioPassedRuns: number;
  scenarioSuccessRate: number | null;
  activeInPeriod: boolean;
}

export interface ProjectRow {
  id: number;
  name: string;
  teamId: number;
  teamName: string;
  apiTotal: number;
  singleCaseTotal: number;
  singleCaseCoveredApis: number;
  singleCaseCoverage: number | null;
  scenarioTotal: number;
  scenarioCoveredApis: number;
  scenarioCoverage: number | null;
  suiteTotal: number;
  executedSuiteCount: number;
  suiteExecutionRate: number | null;
  suiteRuns: number;
  suitePassedRuns: number;
  suitePassRate: number | null;
  scenarioRuns: number;
  scenarioPassedRuns: number;
  scenarioSuccessRate: number | null;
  usedForTesting: boolean;
  activeInPeriod: boolean;
  lastActivity: string | null;
}

export interface DashboardWarning {
  code: string;
  level: 'info' | 'warning' | 'error' | string;
  message: string;
}

export interface DashboardResponse {
  meta: DashboardMeta;
  metrics: {
    testing: Metric[];
    operations: Metric[];
  };
  summary: DashboardSummary;
  charts: {
    coverage: {
      singleCase: CoverageMetric;
      scenario: CoverageMetric;
    };
    executionTrend: ExecutionTrendPoint[];
    licenseByTeam: LicenseTeamPoint[];
    teamTesting: TeamTestingPoint[];
  };
  teams: TeamRow[];
  projects: ProjectRow[];
  warnings: DashboardWarning[];
}
