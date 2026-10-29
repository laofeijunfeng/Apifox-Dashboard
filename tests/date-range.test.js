import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dateKeyInShanghai,
  parseDbUtc,
  resolveDateRange,
  resolveReuseWindow
} from '../server/lib/date-range.js';

test('上海时区的 7 天范围使用左闭右开 UTC 边界', () => {
  const now = new Date('2026-10-28T12:00:00Z');
  const range = resolveDateRange({ days: 7 }, { timeZone: 'Asia/Shanghai', now });

  assert.equal(range.startDate, '2026-10-22');
  assert.equal(range.endDate, '2026-10-28');
  assert.equal(range.startExclusiveDate, '2026-10-29');
  assert.equal(range.dayCount, 7);
  assert.equal(range.startDb, '2026-10-21 16:00:00');
  assert.equal(range.endDb, '2026-10-28 16:00:00');
  assert.equal(range.label, '2026-10-22 至 2026-10-28');
});

test('自定义范围保留首尾自然日并校验顺序', () => {
  const range = resolveDateRange(
    { start: '2026-09-01', end: '2026-09-30' },
    { timeZone: 'Asia/Shanghai', now: new Date('2026-10-28T00:00:00Z') }
  );
  assert.equal(range.dayCount, 30);
  assert.equal(range.startDb, '2026-08-31 16:00:00');
  assert.equal(range.endDb, '2026-09-30 16:00:00');
  assert.throws(
    () =>
      resolveDateRange(
        { start: '2026-10-02', end: '2026-10-01' },
        { timeZone: 'Asia/Shanghai' }
      ),
    /开始日期不能晚于结束日期/
  );
});

test('UTC 时间转换为上海自然日', () => {
  assert.equal(dateKeyInShanghai('2026-10-27 16:30:00'), '2026-10-28');
  assert.equal(parseDbUtc('2026-10-27 16:30:00').toISOString(), '2026-10-27T16:30:00.000Z');
});

test('资产复用固定窗口截止到当前上海自然日', () => {
  const window = resolveReuseWindow(
    new Date('2026-10-28T12:00:00Z'),
    90,
    'Asia/Shanghai'
  );
  assert.equal(window.endDate, '2026-10-28');
  assert.equal(window.startDate, '2026-07-31');
  assert.equal(window.startDb, '2026-07-30 16:00:00');
  assert.equal(window.endDb, '2026-10-28 16:00:00');
});
