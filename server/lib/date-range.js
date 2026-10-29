const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const SHANGHAI_OFFSET = '+08:00';
const DAY_MS = 24 * 60 * 60 * 1000;

function pad(value) {
  return String(value).padStart(2, '0');
}

export function parseDateOnly(value, fieldName = 'date') {
  if (typeof value !== 'string' || !DATE_ONLY_PATTERN.test(value)) {
    throw new RangeError(`${fieldName} 必须使用 YYYY-MM-DD 格式`);
  }

  const [, year, month, day] = value.match(DATE_ONLY_PATTERN).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError(`${fieldName} 不是有效日期`);
  }
  return value;
}

export function addDays(dateOnly, amount) {
  parseDateOnly(dateOnly);
  const date = new Date(`${dateOnly}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function formatDateInTimeZone(date, timeZone = 'Asia/Shanghai') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function todayInTimeZone(timeZone = 'Asia/Shanghai', now = new Date()) {
  return formatDateInTimeZone(now, timeZone);
}

export function localDateToUtc(dateOnly, timeZone = 'Asia/Shanghai') {
  parseDateOnly(dateOnly);
  if (timeZone !== 'Asia/Shanghai') {
    throw new RangeError('当前版本仅支持 Asia/Shanghai 时区');
  }
  return new Date(`${dateOnly}T00:00:00${SHANGHAI_OFFSET}`);
}

export function toDbUtc(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('无效的 UTC 时间');
  }
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export function parseDbUtc(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const normalized = String(value).includes('T')
    ? String(value)
    : `${String(value).replace(' ', 'T')}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function dateKeyInShanghai(value) {
  const date = parseDbUtc(value);
  if (!date) return null;
  return formatDateInTimeZone(date, 'Asia/Shanghai');
}

export function eachDate(startDate, endDate) {
  parseDateOnly(startDate, 'start');
  parseDateOnly(endDate, 'end');
  if (startDate > endDate) throw new RangeError('开始日期不能晚于结束日期');
  const dates = [];
  for (let current = startDate; current <= endDate; current = addDays(current, 1)) {
    dates.push(current);
  }
  return dates;
}

export function resolveDateRange(input = {}, options = {}) {
  const timeZone = options.timeZone ?? 'Asia/Shanghai';
  const now = options.now ?? new Date();
  const quickDays = Number.parseInt(input.days ?? '30', 10);
  const endDate = parseDateOnly(
    input.end ?? todayInTimeZone(timeZone, now),
    'end'
  );
  const normalizedDays = Number.isFinite(quickDays) ? quickDays : 30;
  if (normalizedDays < 1 || normalizedDays > 366) {
    throw new RangeError('统计周期必须在 1 到 366 天之间');
  }
  const startDate = parseDateOnly(
    input.start ?? addDays(endDate, -(normalizedDays - 1)),
    'start'
  );
  if (startDate > endDate) {
    throw new RangeError('开始日期不能晚于结束日期');
  }

  const dayCount = Math.round(
    (new Date(`${endDate}T00:00:00Z`) - new Date(`${startDate}T00:00:00Z`)) / DAY_MS
  ) + 1;
  if (dayCount > 366) {
    throw new RangeError('自定义统计周期不能超过 366 天');
  }

  const startExclusiveDate = addDays(endDate, 1);
  const startUtc = localDateToUtc(startDate, timeZone);
  const endUtc = localDateToUtc(startExclusiveDate, timeZone);

  return {
    startDate,
    endDate,
    startExclusiveDate,
    dayCount,
    timeZone,
    startUtc,
    endUtc,
    startDb: toDbUtc(startUtc),
    endDb: toDbUtc(endUtc),
    label: `${startDate} 至 ${endDate}`,
    previous: {
      startDate: addDays(startDate, -dayCount),
      endDate: addDays(startDate, -1)
    }
  };
}

export function resolveReuseWindow(endUtc, days = 90, timeZone = 'Asia/Shanghai') {
  const endDate = formatDateInTimeZone(new Date(endUtc.getTime() - 1), timeZone);
  const startDate = addDays(endDate, -(days - 1));
  const startExclusiveDate = addDays(endDate, 1);
  return {
    days,
    startDate,
    endDate,
    startUtc: localDateToUtc(startDate, timeZone),
    endUtc: localDateToUtc(startExclusiveDate, timeZone),
    startDb: toDbUtc(localDateToUtc(startDate, timeZone)),
    endDb: toDbUtc(localDateToUtc(startExclusiveDate, timeZone)),
    label: `${startDate} 至 ${endDate}`
  };
}

export const dateUtils = {
  pad,
  DAY_MS
};
