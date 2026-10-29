import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { closePool, pingDatabase } from './db.js';
import { buildDashboardCsv } from './lib/dashboard-csv.js';
import { DashboardService } from './services/dashboard-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

export function createApp({ dashboardService = new DashboardService() } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          fontSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false
    })
  );
  app.use(compression());

  app.get('/health', async (_request, response) => {
    try {
      const database = await pingDatabase();
      response.json({
        status: 'ok',
        database: 'up',
        databaseName: database.currentDatabase,
        utcNow: database.utcNow,
        readOnlyApplicationUser: true
      });
    } catch (error) {
      response.status(503).json({
        status: 'degraded',
        database: 'down',
        message: error.message
      });
    }
  });

  app.get('/api/dashboard', async (request, response, next) => {
    try {
      const dashboard = await dashboardService.getDashboard({
        start: request.query.start,
        end: request.query.end,
        days: request.query.days
      });
      response.set('Cache-Control', 'no-store');
      response.json(dashboard);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/export.csv', async (request, response, next) => {
    try {
      const dashboard = await dashboardService.getDashboard({
        start: request.query.start,
        end: request.query.end,
        days: request.query.days
      });
      const csv = buildDashboardCsv(dashboard);
      const filename = `apifox-dashboard_${dashboard.meta.range.startDate}_${dashboard.meta.range.endDate}.csv`;
      response.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      });
      response.send(csv);
    } catch (error) {
      next(error);
    }
  });

  app.use('/api', (_request, response) => {
    response.status(404).json({ message: 'API 不存在' });
  });

  app.use(express.static(distDir, { index: false, maxAge: '1h' }));
  app.get('*', (request, response, next) => {
    if (!request.accepts('html')) return next();
    response.sendFile(path.join(distDir, 'index.html'), (error) => {
      if (error) next(error);
    });
  });

  app.use((error, _request, response, _next) => {
    if (error instanceof RangeError || error?.type === 'entity.parse.failed') {
      response.status(400).json({ message: error.message });
      return;
    }
    console.error('[dashboard-api]', error);
    response.status(500).json({
      message: '看板数据加载失败，请检查数据库连接或服务日志。'
    });
  });

  return app;
}

function start() {
  const app = createApp();
  const server = app.listen(config.port, '127.0.0.1', async () => {
    try {
      const database = await pingDatabase();
      console.log(
        `Apifox Dashboard 已启动：http://127.0.0.1:${config.port}（数据库 ${database.currentDatabase}，只读应用账号）`
      );
    } catch (error) {
      console.error('数据库连接失败：', error.message);
      server.close(() => process.exit(1));
    }
  });

  const shutdown = async (signal) => {
    console.log(`收到 ${signal}，正在关闭服务...`);
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  start();
}
