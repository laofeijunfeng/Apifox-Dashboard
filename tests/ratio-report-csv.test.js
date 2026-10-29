import test from 'node:test';
import assert from 'node:assert/strict';
import { countUnique, percent, safeRatio, toCount } from '../server/lib/ratio.js';
import { isReportSuccessful, parseStats, summarizeReportRows } from '../server/lib/report-stats.js';
import { escapeCsv, rowsToCsv } from '../server/lib/csv.js';

test('分母为 0 或非数字时比例返回 null，而不是伪造 0%', () => {
  assert.equal(percent(0, 0), null);
  assert.equal(percent(1, 0), null);
  assert.equal(percent(2, 3), 66.7);
  assert.equal(safeRatio(2, 1), 1);
  assert.equal(toCount(-2), 0);
  assert.equal(countUnique([1, '1', 2, null]), 2);
});

test('套件报告仅在所有失败与待运行计数均为 0 时通过', () => {
  assert.equal(parseStats('{"total":3,"failed":0,"pending":0}').total, 3);
  assert.equal(isReportSuccessful('{"total":3,"failed":0,"pending":0}'), true);
  assert.equal(isReportSuccessful({ total: 3, failures: 1, pending: 0 }), false);
  assert.equal(isReportSuccessful('{"total":3,"pending":1}'), false);
  assert.equal(isReportSuccessful('{"total":3}'), false);
  assert.equal(isReportSuccessful('not-json'), false);
});

test('报告汇总按套件与场景去重并保留运行次数', () => {
  const summary = summarizeReportRows([
    { test_suite_id: 101, type: 'TEST_SUITE', related_id: 101, stats: '{"failed":0,"pending":0,"total":2}' },
    { test_suite_id: 101, type: 'TEST_SUITE', related_id: 101, stats: '{"failed":1,"pending":0,"total":2}' },
    { test_suite_id: 0, type: 'testcase', related_id: 501, stats: '{"failed":0,"pending":0,"total":1}' }
  ]);
  assert.equal(summary.suiteRuns, 2);
  assert.equal(summary.suitePassedRuns, 1);
  assert.equal(summary.scenarioRuns, 1);
  assert.equal(summary.scenarioPassedRuns, 1);
  assert.deepEqual([...summary.executedBySuite], [101]);
  assert.deepEqual([...summary.successfulBySuite], [101]);
});

test('CSV 正确转义逗号、双引号和换行', () => {
  assert.equal(escapeCsv('普通文本'), '普通文本');
  assert.equal(escapeCsv('A,B'), '"A,B"');
  assert.equal(escapeCsv('他说"好"'), '"他说""好"""');
  assert.equal(rowsToCsv([['标题'], ['A,B', '第二行\n内容']]), '标题\r\n"A,B","第二行\n内容"');
});
