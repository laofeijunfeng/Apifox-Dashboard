const SUITE_TYPES = new Set(['test_suite', 'testsuite', 'test_case_group', 'testcasegroup']);

export function parseStats(stats) {
  if (stats && typeof stats === 'object' && !Buffer.isBuffer(stats)) return stats;
  if (typeof stats !== 'string' || !stats.trim()) return null;
  try {
    const parsed = JSON.parse(stats);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function isReportSuccessful(stats) {
  const parsed = parseStats(stats);
  if (!parsed) return false;

  let sawSummaryCounter = false;
  let failed = 0;
  let pending = 0;

  const visit = (value, depth = 0) => {
    if (!value || depth > 8 || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, depth + 1));
      return;
    }

    for (const [key, child] of Object.entries(value)) {
      const normalizedKey = key.toLowerCase().replace(/[_-]/g, '');
      if (['failed', 'failures', 'failure'].includes(normalizedKey)) {
        sawSummaryCounter = true;
        if (Array.isArray(child)) failed += child.length;
        else if (typeof child === 'number' || /^\d+$/.test(String(child))) {
          failed += Number(child);
        } else if (typeof child === 'boolean' && child) {
          failed += 1;
        }
      } else if (['pending', 'notrun'].includes(normalizedKey)) {
        sawSummaryCounter = true;
        if (typeof child === 'number' || /^\d+$/.test(String(child))) {
          pending += Number(child);
        }
      }
      if (child && typeof child === 'object') visit(child, depth + 1);
    }
  };

  visit(parsed);
  return sawSummaryCounter && failed === 0 && pending === 0;
}

export function isSuiteReport(row) {
  const suiteId = Number(row?.test_suite_id ?? 0);
  const type = String(row?.type ?? '').toLowerCase().replace(/-/g, '_');
  return suiteId > 0 || SUITE_TYPES.has(type);
}

export function getSuiteId(row) {
  if (!row) return null;
  const directId = Number(row.test_suite_id ?? 0);
  if (directId > 0) return directId;
  if (isSuiteReport(row)) {
    const relatedId = Number(row.related_id ?? 0);
    return relatedId > 0 ? relatedId : null;
  }
  return null;
}

export function isScenarioReport(row) {
  return String(row?.type ?? '').toLowerCase() === 'testcase';
}

export function summarizeReportRows(rows) {
  const successfulBySuite = new Set();
  const executedBySuite = new Set();
  let suiteRuns = 0;
  let suitePassedRuns = 0;
  let scenarioRuns = 0;
  let scenarioPassedRuns = 0;
  const daily = new Map();

  for (const row of rows) {
    const successful = isReportSuccessful(row.stats);
    const suiteId = getSuiteId(row);
    const scenario = isScenarioReport(row) && Number(row.related_id ?? 0) > 0;
    if (suiteId) {
      suiteRuns += 1;
      executedBySuite.add(suiteId);
      if (successful) {
        suitePassedRuns += 1;
        successfulBySuite.add(suiteId);
      }
    }
    if (scenario) {
      scenarioRuns += 1;
      if (successful) scenarioPassedRuns += 1;
    }
  }

  return {
    successfulBySuite,
    executedBySuite,
    suiteRuns,
    suitePassedRuns,
    scenarioRuns,
    scenarioPassedRuns,
    daily
  };
}
