# Sub2API 项目长期记忆

## 项目基本信息

- **仓库路径**：`d:/project/sub2api`
- **技术栈**：Go（后端）+ Vue 3（前端），PostgreSQL + Redis，Gin 框架，ent ORM
- **主要模块**：`backend/internal/service/`（核心服务），`backend/internal/handler/`，`backend/internal/pkg/`

## 代码审查历史

### 2026-03-31（首次基线审查）

**审查的 commit**：
- `141424a` fix: resolve P0/P1 code quality issues（2026-03-31）
  - 修复了 ModelError.Is() 错误匹配、shouldClearStickySession ctx 传播、validateCodeSignature 重构、api_key_service.go 英文错误消息
- `bda7c39` 初始提交（Merge PR #1196）

**待修复问题清单**：

| ID | 级别 | 文件 | 问题摘要 | 状态 |
|----|------|------|---------|------|
| P0-01 | 🔴 P0 | `backend/internal/service/sticky_session_test.go:108` | shouldClearStickySession 测试调用缺少 ctx 参数，`go test -tags unit` 编译失败 | ❌ 未修复 |
| P1-01 | 🟡 P1 | `backend/internal/service/gateway_service.go:44` | defaultMaxLineSize = 500MB，高并发下 OOM 风险 | ❌ 未修复 |
| P1-02 | 🟡 P1 | `backend/internal/service/account_service.go:386-398` | TestCredentials 三平台均 return nil，凭证验证功能形同虚设 | ❌ 未修复 |
| P1-03 | 🟡 P1 | `backend/internal/handler/admin/group_handler.go:362-368` | GetStats API 返回硬编码零值 mock 数据 | ❌ 未修复 |
| P1-04 | 🟡 P1 | `backend/internal/handler/sora_client_handler_test.go` | 16 个 Sora 相关测试用 t.Skip 长期屏蔽，无 Issue 追踪 | ❌ 未修复 |
| 挑剔-01 | 💭 | 多个 service 文件 | math/rand 使用缺少注释说明用途 | ❌ 未修复 |
| 挑剔-02 | 💭 | `gemini_messages_compat_service.go:44` | geminiDummyThoughtSignature 魔法字符串无文档 | ❌ 未修复 |
| 挑剔-03 | 💭 | `backend/internal/pkg/models/interface.go:220-225` | ModelError.Error() 使用 fmt.Sprint 而非 fmt.Sprintf，格式化占位符不生效 | ❌ 未修复 |

**健康度评分**：7/10

## 2026-03-31 第二次巡检（09:58）

无新 commit，所有已知问题状态未变，报告文件已追加第二次审查章节。
