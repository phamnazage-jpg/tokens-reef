# Sub2API 项目长期记忆

## 重要发现（2026-04-03）

**API Key 用户端路由确认**：
- 实际路由为 `/api/v1/keys`（routes/user.go:42，`/api/v1` 前缀 + `/keys` 路由组）
- E2E 测试之前被错误地改为 `/api/v1/api-keys`，工作区已更正为正确路径
- 契约测试（api_contract_test.go）使用正确路径

**P0-04 发现与修复（2026-04-03 10:50）**：
- `TestGroupHandlerEndpoints` nil pointer panic（group_handler.go:384），原因：P1-03 GetStats 重构后 `usageLogRepo` 在测试 `setupAdminRouter()` 中传 nil
- 修复：`admin_service_stub_test.go` 添加完整 `stubUsageLogRepository`（实现 `service.UsageLogRepository` 全部方法）；`admin_basic_handlers_test.go:20` 传入 `&stubUsageLogRepository{}`
- 已修复，测试从 FAIL(panic) → PASS(0.355s)

## 代码审查历史

## 项目基本信息

- **仓库路径**：`d:/project/sub2api`
- **技术栈**：Go（后端）+ Vue 3（前端），PostgreSQL + Redis，Gin 框架，ent ORM
- **主要模块**：`backend/internal/service/`（核心服务），`backend/internal/handler/`，`backend/internal/pkg/`
- **Gitea 仓库**：https://www.tksea.top/pham/tokensea（字节海洋）
- **GitHub 仓库**：https://github.com/phamnazage-jpg/tokens-reef（代码质量修复）

## 代码审查历史

### 2026-04-02 E2E 测试修复

**问题清单**：

| ID | 文件 | 问题 | 修复方案 |
|----|------|------|---------|
| E2E-01 | user-apikey-lifecycle.spec.ts | API Key 路径错误 `/api/v1/keys` | 改为 `/api/v1/api-keys`（24处） |
| E2E-02 | admin-users.spec.ts:156-157 | 余额调整 Payload 错误 | 确认格式正确：`{balance, operation, notes}` |
| E2E-03 | admin-groups.spec.ts:229-232 | Rate Multiplier Payload 错误 | 确认格式正确：`{entries: [...]}` |

**修复提交**：
- `8b19f56` fix: update E2E test API paths and payloads to match backend

### 2026-04-02 后端修复

**已修复问题**：

| ID | 文件 | 问题 | 修复方案 |
|----|------|------|---------|
| P0-01 | sticky_session_test.go | 缺少 context import | 添加 `import "context"` |
| P0-02 | wire_gen.go | 缺少 usageLogRepository | 添加参数 |
| P0-03 | admin_service_stub_test.go | 缺少 GetGroupAPIKeyCount | 添加 stub |
| P1-01 | gateway_service.go | defaultMaxLineSize 过大 | 优化为合理值 |
| P1-02 | account_service.go | TestCredentials 返回 nil | 实现真实验证 |
| P1-03 | group_handler.go GetStats | 返回硬编码零值 | 实现真实数据查询 |

### 2026-03-31（首次基线审查）

**审查的 commit**：
- `141424a` fix: resolve P0/P1 code quality issues（2026-03-31）
  - 修复了 ModelError.Is() 错误匹配、shouldClearStickySession ctx 传播、validateCodeSignature 重构、api_key_service.go 英文错误消息
- `bda7c39` 初始提交（Merge PR #1196）

**待修复问题清单**：

| ID | 级别 | 文件 | 问题摘要 | 状态 |
|----|------|------|---------|------|
| P0-01 | 🔴 P0 | `backend/internal/service/sticky_session_test.go:108` | shouldClearStickySession 测试调用缺少 ctx 参数，`go test -tags unit` 编译失败 | ✅ 已修复 |
| P1-01 | 🟡 P1 | `backend/internal/service/gateway_service.go:44` | defaultMaxLineSize = 500MB，高并发下 OOM 风险 | ✅ 已修复 |
| P1-02 | 🟡 P1 | `backend/internal/service/account_service.go:386-398` | TestCredentials 三平台均 return nil，凭证验证功能形同虚设 | ✅ 已修复 |
| P1-03 | 🟡 P1 | `backend/internal/handler/admin/group_handler.go:362-368` | GetStats API 返回硬编码零值 mock 数据 | ✅ 已修复 |
| P1-04 | 🟡 P1 | `backend/internal/handler/sora_client_handler_test.go` | 16 个 Sora 相关测试用 t.Skip 长期屏蔽，无 Issue 追踪 | ✅ 已改善 |
| 挑剔-01 | 💭 | 多个 service 文件 | math/rand 使用缺少注释说明用途 | ✅ 已改善 |
| 挑剔-02 | 💭 | `gemini_messages_compat_service.go:44` | geminiDummyThoughtSignature 魔法字符串无文档 | ✅ 已改善 |
| 挑剔-03 | 💭 | `backend/internal/pkg/models/interface.go:220-225` | ModelError.Error() 使用 fmt.Sprint 而非 fmt.Sprintf，格式化占位符不生效 | ✅ 已修复 |

**健康度评分**：9/10
