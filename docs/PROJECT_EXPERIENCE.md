# Sub2API 项目经验总结

> 本文档记录项目开发过程中的经验教训、常见问题和解决方案。

## 一、项目架构

### 技术栈
- **后端**：Go + Gin + Ent ORM
- **前端**：Vue 3 + Vite + Pinia + TailwindCSS
- **数据库**：PostgreSQL 16 + Redis
- **包管理**：Go modules + pnpm

### 项目结构
```
sub2api/
├── backend/              # Go 后端
│   ├── cmd/server/       # 主程序入口
│   ├── ent/              # Ent ORM 生成代码
│   ├── internal/
│   │   ├── handler/      # HTTP 处理器
│   │   ├── service/      # 业务逻辑
│   │   ├── repository/    # 数据访问层
│   │   └── pkg/          # 公共包
│   ├── migrations/       # 数据库迁移
│   └── config.yaml       # 配置文件
├── frontend/             # Vue 前端
├── tests/                # E2E 测试
└── docs/                 # 文档
```

## 二、Git 仓库管理

### 当前仓库配置

| 远程 | 地址 | 用途 |
|------|------|------|
| origin | https://github.com/phamnazage-jpg/tokens-reef.git | GitHub（代码质量修复） |
| gitea | https://www.tksea.top/pham/tokensea.git | Gitea（主仓库） |

### 常用命令
```bash
# 添加 Gitea 远程
git remote add gitea https://www.tksea.top/pham/tokensea.git

# 强制推送到 Gitea（覆盖）
git push -f gitea main

# 强制推送到 GitHub
git push -f origin main

# 查看远程
git remote -v
```

## 三、开发常见问题

### 1. E2E 测试问题

#### API 路径错误
- **问题**：测试调用 `/api/v1/keys` 但后端路由是 `/api/v1/api-keys`
- **解决**：将所有路径改为 `/api/v1/api-keys`

#### Payload 格式不匹配
- **余额调整**：使用 `{balance, operation, notes}`
- **Rate Multiplier**：使用 `{entries: [{user_id, rate_multiplier}]}`

#### 测试文件无法提交
- **原因**：`tests` 目录在 `.gitignore` 中
- **解决**：使用 `git add -f tests/` 强制添加

### 2. Go 后端问题

#### Wire 依赖注入
- **修改 wire.go 后**：运行 `go mod tidy` 确保依赖完整
- **生成代码位置**：`cmd/server/wire_gen.go`

#### Interface 新增方法
- **问题**：新增方法后编译失败
- **解决**：所有实现该 interface 的 stub/mock 必须补上新方法

#### Ent Schema 修改
- **命令**：`go generate ./ent`
- **生成文件**：需提交 `ent/` 目录

### 3. 前端问题

#### pnpm-lock.yaml 不同步
- **问题**：CI 的 `pnpm install --frozen-lockfile` 失败
- **解决**：确保 `pnpm-lock.yaml` 同步提交

#### node_modules 冲突
- **解决**：删除后重新安装
```bash
rm -rf node_modules
pnpm install
```

## 四、代码审查经验

### 审查维度

1. **功能正确性**：API 响应是否符合预期
2. **性能**：是否有 OOM 风险、缓存策略
3. **安全**：敏感信息是否硬编码
4. **测试覆盖**：关键路径是否有测试

### 常见问题级别

| 级别 | 标记 | 说明 |
|------|------|------|
| P0 | 🔴 | 编译失败或致命运行时错误 |
| P1 | 🟡 | 功能缺陷或性能问题 |
| P2 | 🟢 | 改进建议 |
| 挑剔 | 💭 | 代码风格/文档问题 |

### 修复验证流程

1. **本地构建**：`go build ./cmd/server`
2. **单元测试**：`go test -short ./...`
3. **前端构建**：`cd frontend && pnpm build`
4. **前端测试**：`cd frontend && pnpm test -- --run`
5. **E2E 测试**：确保后端运行在 8080 端口

## 五、关键配置

### Windows 开发环境

| 项 | 值 |
|---|---|
| Go 路径 | `D:/Program Files/Go/bin/go.exe` |
| PostgreSQL | `C:\Program Files\PostgreSQL\16\` |
| 测试账号 | lon22@qq.com / admin123 |
| 后端端口 | 8080 |

### 测试环境变量

```bash
# E2E 测试
BASE_URL=http://localhost:8080
TEST_EMAIL=lon22@qq.com
TEST_PASSWORD=admin123
```

## 六、经验教训

### 1. 测试必须验证真实 API 路径
- 不要假设路由是什么，要去 `routes/*.go` 确认
- E2E 测试调用前先手动 curl 验证

### 2. Payload 必须与后端 DTO 一致
- 查看 handler 中的 struct 定义
- 不要猜测字段名，用 grep 确认

### 3. 提交前务必本地验证
- 编译通过 ≠ 测试通过
- 测试通过 ≠ 功能正常

### 4. 文档要及时更新
- 每次修复问题后更新 MEMORY.md
- 新增坑点更新 DEV_GUIDE.md
- 配置变更更新 CLAUDE.md

## 七、相关文档

- `DEV_GUIDE.md` - 开发指南
- `CLAUDE.md` - Claude Code 配置
- `.workbuddy/memory/MEMORY.md` - 长期记忆
- `REVIEW_REPORT_*.md` - 代码审查报告
