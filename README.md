# Apifox Dashboard

面向 Apifox 测试资产质量与席位运营的单体全栈看板。React 构建产物由同一个 Node.js/Express 服务托管，后端通过 MySQL 只读账号访问本地 `apifox` 业务库，不修改任何 Apifox 业务表。

## 已实现功能

- 周期筛选：近 7 / 30 / 90 天，以及最长 366 天的自定义日期范围。
- 18 项指标：测试相关 11 项、运维运营 7 项；比例指标同时返回分子和分母。
- 指标口径：每张指标卡带 Tooltip，并提供完整的指标口径字典。
- 数据分析：执行趋势、接口覆盖率、团队 License 与沉睡账号分布、项目/团队明细。
- 明细操作：搜索、周期活跃筛选、测试资产使用筛选、CSV 导出。
- 状态处理：加载骨架、API 错误、空业务库提示、无分母时显示 `—`。
- 响应式布局：桌面、平板和移动端；移动端快捷菜单包含导航、指标口径和 CSV 导出。
- 只读安全：拒绝使用 MySQL `root` 账号；应用不提供写 Apifox 业务表的接口。

## 技术栈

Node.js 20+、Express、MySQL、React、TypeScript、Vite、Tailwind CSS、shadcn/ui 风格组件、Radix UI、Recharts。

## 快速开始

```bash
npm install
cp .env.example .env
chmod 600 .env
# 编辑 .env，填写实际的数据库地址和只读账号
npm run dev
```

开发地址：

- 前端：`http://127.0.0.1:5173`
- API：`http://127.0.0.1:8787`
- Vite 会将 `/api` 和 `/health` 代理到 API 服务。

生产构建与启动：

```bash
npm run build
npm start
```

生产服务同源托管页面和 API：`http://127.0.0.1:8787`。

## GitHub 仓库

远端仓库：<https://github.com/laofeijunfeng/Apifox-Dashboard.git>

首次拉取：

```bash
git clone https://github.com/laofeijunfeng/Apifox-Dashboard.git
cd Apifox-Dashboard
npm install
cp .env.example .env
chmod 600 .env
```

日常提交：

```bash
git pull --rebase
git add <需要提交的文件>
git commit -m "feat: 描述本次变更"
git push
```

默认分支为 `main`。仓库包含 `.github/workflows/ci.yml`，每次推送和 Pull Request 都会执行 `npm ci`、`npm test` 和 `npm run build`。

不要提交 `.env`、数据库口令、`node_modules`、`dist`、运行日志、验收截图或平台运行上下文；这些路径已写入 `.gitignore`。团队复制仓库后应使用自己的 `.env` 和只读数据库账号。

## 数据库准备

应用只读取现有 Apifox 业务库，不创建、不修改、不删除任何表。创建只读账号时只授予 `apifox` 库的 `SELECT`：

```sql
CREATE USER 'apifox_dashboard_ro'@'127.0.0.1'
  IDENTIFIED BY '<强密码>';

GRANT SELECT ON apifox.* TO 'apifox_dashboard_ro'@'127.0.0.1';

FLUSH PRIVILEGES;
```

`.env` 至少需要配置：

```dotenv
PORT=8787
DB_HOST=127.0.0.1
DB_PORT=3308
DB_USER=apifox_dashboard_ro
DB_PASSWORD=<强密码>
DB_NAME=apifox
APP_TIME_ZONE=Asia/Shanghai
```

安全边界：

- `.env` 已加入 `.gitignore`，不要提交或写入前端代码。
- 服务启动时会拒绝 `DB_USER=root`。
- 应用只执行查询，不提供写 Apifox 业务表的接口。

## 指标口径

所有 Apifox 业务查询均过滤 `deleted_at IS NULL`。日期统计使用 `Asia/Shanghai` 自然日，数据库查询边界为左闭右开 `[开始日 00:00, 结束日次日 00:00)`，存储层按 UTC 比较。

### 测试相关（11 项）

| 指标 | 口径 |
| --- | --- |
| 接口总数 | 当前未删除且所属项目有效的 HTTP 接口数。存量指标，不受日期周期影响。 |
| 单接口用例总数 | 当前有效的 `http_api_cases.type=TEST_CASE` 用例数，且必须关联有效 HTTP 接口。 |
| 单接口用例覆盖率 | 至少关联 1 条有效单接口用例的去重接口数 ÷ 有效接口总数。 |
| 场景用例总数 | 当前未删除的自动化测试场景数（`api_test_cases`）。 |
| 场景用例覆盖率 | 被有效场景步骤关联到的去重接口数 ÷ 有效接口总数。 |
| 场景用例执行成功率 | 周期内完全通过且 `status=done` 的场景运行报告数 ÷ 周期内已完成场景运行报告数。 |
| 测试套件执行率 | 周期内至少产生 1 次自动化运行报告的套件数 ÷ 当前有效套件总数。 |
| 套件执行通过率 | 周期内完全通过的套件运行次数 ÷ 周期内已完成套件运行次数。 |
| 项目使用数 | 至少存在 1 条有效单接口用例或有效场景用例的项目数。存量指标。 |
| 项目使用率 | 有有效单接口用例或场景用例的项目数 ÷ 有效项目总数。 |
| 资产有效复用率 | 近 90 天至少成功运行过 1 次的套件数 ÷ 当前有效套件总数。固定使用近 90 天窗口，不受上方统计周期影响。 |

套件/场景报告通过判定：仅统计 `api_test_reports.status=done` 的报告；报告 `stats` 中 `failed`、`pending` 均为 0，且存在有效统计计数时，才视为“完全通过”。

### 运维运营（7 项）

| 指标 | 口径 |
| --- | --- |
| 纳管团队总数 | 当前未删除的团队数。 |
| 纳管项目总数 | 当前未删除且所属团队有效的项目数。 |
| License 使用数 | 有效团队中状态正常成员席位覆盖的不同有效用户数；跨团队重复账号只计 1 次。 |
| ≥90 天沉睡账号 | 有效席位账号最近可用活动时间早于或等于当前时间减 90 天。最近活动取团队最后活跃、账号访问、加入及创建时间中的最新可用值。 |
| 活跃团队数 | 所选周期内存在活跃成员或活跃项目的团队数。 |
| 活跃项目数 | 所选周期内接口、单接口用例、场景、套件或已完成测试报告有更新的项目数。 |
| 活跃用户数 | 所选周期内有最近活动时间的不同有效席位用户数。 |

## 空库行为

当 Apifox 业务库没有可统计的有效数据时：

- 计数类指标返回 `0`。
- 比例类指标在分母为 0 时返回 `null`，前端显示 `—`，不会伪造 `0%`。
- 页面显示“真实空库状态”提示。
- 图表展示明确的空状态，不使用参考 HTML 中的静态样例数字。

## API

```text
GET /health
GET /api/dashboard?days=30
GET /api/dashboard?start=2026-09-01&end=2026-09-30
GET /api/export.csv?days=30
GET /api/export.csv?start=2026-09-01&end=2026-09-30
```

- `days` 范围为 1–366。
- 自定义 `start` / `end` 使用 `YYYY-MM-DD`，包含首尾两天，总长度不超过 366 天。
- `/api/dashboard` 和 CSV 响应均设置 `Cache-Control: no-store`。
- CSV 使用 UTF-8 BOM，便于 Excel 正确识别中文。

## 验证

```bash
npm test
npm run build
curl http://127.0.0.1:8787/health
curl 'http://127.0.0.1:8787/api/dashboard?days=30'
curl -I 'http://127.0.0.1:8787/api/export.csv?days=30'
```

当前测试覆盖日期边界、比例空值、报告成功判定、去重聚合、CSV 转义和空库行为。

## 目录

```text
src/                      React 页面、组件、类型与格式化工具
server/                   Express API、聚合服务、只读数据访问层
tests/                    Node.js 内置测试
dist/                     生产构建产物（npm run build 生成）
```

## 已知边界

- 当前版本固定使用 `Asia/Shanghai`；其他时区启动时会拒绝运行。
- 指标基于本地 Apifox 库现有表结构，Apifox 版本升级后需要复核字段映射。
- 前端构建目前为单个约 700 KB 的 JS chunk，不影响功能；后续可按图表/弹窗做手动拆包。
