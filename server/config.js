import 'dotenv/config';

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value)) throw new Error(`${name} 必须是数字`);
  return value;
}

const dbUser = process.env.DB_USER?.trim();
if (!dbUser) throw new Error('缺少 DB_USER，应用拒绝启动');
if (/^root$/i.test(dbUser)) {
  throw new Error('安全限制：应用禁止使用 MySQL root 账号，请配置只读账号');
}

export const config = {
  port: numberFromEnv('PORT', 8787),
  timeZone: process.env.APP_TIME_ZONE || 'Asia/Shanghai',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: numberFromEnv('DB_PORT', 3308),
    user: dbUser,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'apifox'
  }
};

if (config.timeZone !== 'Asia/Shanghai') {
  throw new Error('当前版本仅支持 APP_TIME_ZONE=Asia/Shanghai');
}
if (!config.db.password) throw new Error('缺少 DB_PASSWORD，应用拒绝启动');
