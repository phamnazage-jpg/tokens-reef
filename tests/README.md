# Sub2API 测试体系

本目录包含 Sub2API 项目的完整测试体系，包括 E2E 测试、集成测试和工具脚本。

## 目录结构

```
tests/
├── e2e/                    # E2E 测试 (Playwright)
│   ├── *.spec.ts          # 测试文件
│   ├── pages/             # 页面对象
│   └── setup/             # 全局设置
├── performance/           # 性能测试
│   ├── artillery/        # Artillery 负载测试
│   └── k6/              # K6 负载测试
├── scripts/               # 工具脚本
│   ├── run-tests.sh       # Linux/Mac 运行脚本
│   ├── run-tests.bat      # Windows 运行脚本
│   └── generate-report.ts # 报告生成
├── fixtures/              # 测试数据
│   ├── users.json         # 测试用户数据
│   ├── accounts.json      # 测试账号数据
│   ├── groups.json        # 测试分组数据
│   └── api-keys.json      # 测试 API 密钥
├── docs/                  # 测试文档
│   ├── PERFORMANCE_TEST_REPORT.md   # 性能测试报告
│   ├── PERFORMANCE_TEST_PLAN.md     # 性能测试计划
│   ├── KEY_FORMAT_SUPPORT.md        # Key 格式支持需求
│   ├── FULL_TEST_REPORT.md         # 全面测试报告
│   ├── ADMIN_TEST_REPORT.md       # E2E 测试报告
│   └── SUMMARY.md                 # 测试汇总
├── package.json           # 测试依赖
├── playwright.config.ts   # Playwright 配置
└── README.md             # 本文件
```

## 测试文件列表

| 文件 | 描述 | 测试数 |
|------|------|--------|
| `login.spec.ts` | 登录模块测试 | 6 |
| `dashboard.spec.ts` | 仪表盘模块测试 | 3 |
| `navigation.spec.ts` | 导航菜单测试 | 3 |
| `admin-users.spec.ts` | 用户管理测试 | 3 |
| `admin-accounts.spec.ts` | 账号管理测试 | 2 |
| `admin-groups.spec.ts` | 分组管理测试 | 2 |
| `admin-redeem.spec.ts` | 兑换码测试 | 2 |
| `admin-settings.spec.ts` | 系统设置测试 | 2 |
| `responsive.spec.ts` | 响应式设计测试 | 4 |

## 快速开始

### 安装依赖

```bash
cd tests
npm install
npx playwright install
```

### 运行所有测试

```bash
npm test
```

### 运行特定类型测试

```bash
# 后端单元测试
npm run test:unit

# 前端集成测试
npm run test:integration

# E2E 测试
npm run test:e2e
```

### E2E 测试选项

```bash
# 正常运行
npx playwright test

# 显示浏览器
npx playwright test --headed

# 交互模式
npx playwright test --ui

# 调试模式
npx playwright test --debug

# 特定浏览器
npx playwright test --project=chromium
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| BASE_URL | http://localhost:8080 | 测试目标 URL |
| TEST_EMAIL | lon22@qq.com | 测试用户邮箱 |
| TEST_PASSWORD | admin123 | 测试用户密码 |
| CI | false | CI 环境标志 |

## 页面对象模式

使用页面对象模式组织测试代码：

```typescript
import { LoginPage } from './pages';

test('login flow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');
  await loginPage.expectToBeLoggedIn();
});
```

## 测试数据

测试数据存储在 `fixtures/` 目录：

- `users.json` - 测试用户数据
- `accounts.json` - 测试账号数据
- `groups.json` - 测试分组数据
- `api-keys.json` - 测试 API 密钥

## 报告

测试报告生成在以下位置：

- HTML 报告: `playwright-report/index.html`
- JSON 结果: `test-results/results.json`
- Markdown 报告: 参见 `docs/` 目录

## 添加新测试

1. 在 `e2e/` 目录创建测试文件（*.spec.ts）
2. 使用页面对象与页面交互
3. 遵循命名规范: `*.spec.ts`
4. 运行 `npm run test:e2e` 验证

## CI/CD 集成

```yaml
# GitHub Actions 示例
- name: Run tests
  run: |
    cd tests
    npm install
    npx playwright install
    npm test
```

## 测试结果

| 类别 | 状态 |
|------|------|
| 前端 (Vitest) | 301/301 通过 ✅ |
| E2E (Playwright) | 27/27 通过 ✅ |
| 后端 (Go) | ~200/~200 通过 ✅ |

## 相关文档

- [全面测试报告](./docs/FULL_TEST_REPORT.md)
- [E2E 测试报告](./docs/ADMIN_TEST_REPORT.md)
- [测试汇总](./docs/SUMMARY.md)
