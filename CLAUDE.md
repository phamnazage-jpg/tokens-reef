# CLAUDE.md - Sub2API Project Guide

This file provides Claude Code with specific guidance for working on Sub2API.

## Project Context

Sub2API is an AI API Gateway that distributes API quotas from AI subscriptions (OpenAI, Anthropic, Google, etc.) to users through generated API keys.

## Quick Reference

| Item | Value |
|------|-------|
| Backend Port | 8080 |
| Frontend Dev | pnpm dev |
| Test Account | lon22@qq.com / admin123 |
| Go Path | D:/Program Files/Go/bin/go.exe |

## Test Commands

```bash
# Frontend (Vitest)
cd frontend && pnpm test -- --run

# Backend (Go) - Use full path on Windows
D:/Program Files/Go/bin/go.exe test -short ./...

# E2E (Playwright)
cd tests && npx playwright test --project=chromium
```

## Important Notes

### Windows-Specific
- Go installed at: `D:/Program Files/Go/`
- Use full path: `D:/Program Files/Go/bin/go.exe`
- Logger test (`internal/pkg/logger`) times out on Windows due to zap Fsync() - skip with `-skip "logger"`

### Backend Build
- Frontend builds to: `backend/internal/web/dist/`
- Build command: `cd frontend && pnpm build`
- Binary: `backend/sub2api.exe`

### Database
- Uses Ent ORM for Go
- Generate code: `go generate ./ent` in backend/

## File Patterns

### Backend (Go)
- Handlers: `backend/internal/handler/`
- Services: `backend/internal/service/`
- Routes: `backend/internal/server/routes/`

### Frontend (Vue)
- API: `frontend/src/api/`
- Components: `frontend/src/components/`
- Stores: `frontend/src/stores/`
- Tests: `frontend/src/**/*.spec.ts`

### E2E Tests
- Location: `tests/e2e/*.spec.ts`
- Config: `tests/playwright.config.ts`
- Pages: `tests/e2e/pages/`

## Common Development Tasks

### Running Tests
```bash
# All tests
cd tests && npm test

# Just E2E
cd tests && npx playwright test

# Frontend unit tests
cd frontend && pnpm test

# Backend tests
cd backend && D:/Program Files/Go/bin/go.exe test -short ./...
```

### Adding a Feature
1. Backend first: handler → service → repository
2. Add route registration
3. Frontend API client
4. Vue component
5. Tests

### Code Generation
```bash
cd backend
go generate ./ent
go generate ./cmd/server
```

## Key Dependencies

### Backend
- `go.uber.org/zap` - Logging
- `gin-gonic/gin` - HTTP framework
- `ent/ent` - ORM
- `redis/go-redis` - Redis client

### Frontend
- `vue` 3.4+
- `vite` 5+
- `tailwindcss`
- `pinia` - State management
- `vitest` - Testing

## Testing Best Practices

1. **Frontend**: Tests live next to components in `__tests__/` directories
2. **E2E**: Use Page Object pattern in `tests/e2e/pages/`
3. **Backend**: Tests in `_test.go` files alongside source

## Troubleshooting

### Backend won't start
- Check PostgreSQL and Redis are running
- Verify `backend/config.yaml` is correct

### Frontend build fails
- Run `pnpm install` in frontend directory
- Check Node.js version (18+)

### E2E tests fail
- Ensure backend is running on port 8080
- Check test account exists: lon22@qq.com

## tokens-reef 独立修复仓库

为了避免与主仓库 Wei-Shaw/sub2api 混淆，Sub2API 的代码质量修复（P0/P1 问题）存放在独立的仓库中：

| 属性 | 值 |
|------|-------|
| 仓库名称 | `tokens-reef`（token 海洋） |
| 仓库地址 | https://github.com/phamnazage-jpg/tokens-reef |
| 描述 | Code quality fixes for Sub2API - P0/P1 issues |
| 用途 | 专门存放 Sub2API 项目的 P0/P1 级别代码质量修复 |
| 创建时间 | 2026-03-31 |

**主要修复内容**：
- `ModelError.Is()` 精确匹配修复（避免 errors.Is 误判）
- `shouldClearStickySession` ctx 参数传播（修复 context.Background 导致的请求取消问题）
- `validateCodeSignature` 共享函数抽取（消除 promo_service.go 和 redeem_service.go 中的重复代码）
- TODO 存根返回 501 Not Implemented（而非假数据）
- 混合中英文错误消息统一为英文
- 移除伪 if-else 代码

## 项目经验总结

### 开发注意事项

1. **Windows 特定**：
   - Go 完整路径：`D:/Program Files/Go/bin/go.exe`
   - Logger 测试因 zap Fsync() 超时，使用 `-skip "logger"` 跳过

2. **E2E 测试坑点**：
   - API Key 路由是 `/api/v1/api-keys`（不是 `/api/v1/keys`）
   - 余额调整 Payload：`{balance, operation, notes}`
   - Rate Multiplier Payload：`{entries: [{user_id, rate_multiplier}]}`
   - tests 目录在 .gitignore 中，需用 `git add -f tests/` 强制添加

3. **依赖注入**：
   - 使用 Google Wire 进行依赖注入
   - 修改 wire.go 后运行 `go mod tidy` 确保依赖完整

### Gitea 远程仓库

| 属性 | 值 |
|------|-------|
| 地址 | https://www.tksea.top/pham/tokensea |
| 名称 | 字节海洋（tokensea） |
| 用户 | pham |

## Project Planning Documents

项目相关文档位置：
- **代码审查报告**: `REVIEW_REPORT_YYYY-MM-DD.md`（按日期生成）
- **开发指南**: `DEV_GUIDE.md`
- **README**: `README.md` / `README_CN.md`（中文）
- **长期记忆**: `.workbuddy/memory/MEMORY.md`
