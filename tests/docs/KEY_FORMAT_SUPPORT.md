# Sub2API 主流模型 Key 格式支持需求文档

## 1. 需求背景

Sub2API 作为 AI API Gateway，需要支持用户通过平台生成的 API Key 访问各种主流大模型。当前系统已支持部分平台，但在模型覆盖和 Key 格式验证方面存在改进空间。

## 2. 当前支持状态

### 2.1 已支持的平台

| 平台标识 | 说明 | Key 前缀 | 认证方式 |
|---------|------|---------|---------|
| `anthropic` | Anthropic Claude 系列 | `sk-ant-` | API Key / OAuth |
| `openai` | OpenAI GPT 系列 (含 Codex) | `sk-` | API Key / OAuth |
| `gemini` | Google Gemini 系列 | `AIzaSy...` | API Key / OAuth |
| `antigravity` | Antigravity (Claude + Gemini) | `sk-` | API Key |
| `sora` | Claude Code | `sk-` | OAuth / API Key |
| `upstream` | 自定义上游 | 任意 | Base URL + API Key |
| `bedrock` | AWS Bedrock | N/A | SigV4 / API Key |

### 2.2 当前认证类型

| 类型 | 说明 |
|------|------|
| `apikey` | 标准 API Key 认证 |
| `oauth` | OAuth 2.0 认证 (完整权限) |
| `setup-token` | Setup Token (仅推理) |
| `upstream` | 上游透传 (自定义 Base URL) |
| `bedrock` | AWS Bedrock (SigV4 签名) |

### 2.3 不支持的模型

以下主流模型当前**未提供内置支持**，需要通过 `upstream` 方式配置：

| 模型 | 说明 | 建议配置方式 |
|------|------|-------------|
| DeepSeek | 深度求索 | upstream (自定义 Base URL) |
| MiniMax | 稀宇科技 | upstream (自定义 Base URL) |
| 豆包 (Doubao) | 字节跳动 | upstream (自定义 Base URL) |
| 通义千问 (Qwen) | 阿里云 | upstream (自定义 Base URL) |
| 文心一言 (ERNIE) | 百度 | upstream (自定义 Base URL) |
| 讯飞星火 (Spark) | 科大讯飞 | upstream (自定义 Base URL) |

## 3. 需求概述

### 3.1 内置默认支持

在管理后台的**账号管理**页面，增加主流模型 Key 格式的自动识别和验证功能：

- 用户输入 Key 后，系统自动识别所属平台
- 根据平台自动填充相关配置项
- 提供 Key 格式验证，确保符合各平台规范

### 3.2 需要支持的主流编程助手/模型

| 编程助手/模型 | Key 格式示例 | 平台标识 |
|--------------|-------------|---------|
| **Claude (Anthropic)** | `sk-ant-xxxxx` | `anthropic` |
| **OpenAI (GPT)** | `sk-xxxxx` | `openai` |
| **Gemini (Google)** | `AIzaSyxxxxx` | `gemini` |
| **Codex (OpenAI)** | `sk-xxxxx` | `openai` |
| **DeepSeek** | `sk-xxxxx` | `deepseek` (新增) |
| **MiniMax** | `mk-xxxxx` | `minimax` (新增) |
| **豆包** | `ak-xxxxx` | `doubao` (新增) |
| **通义千问 (Qwen)** | `sk-xxxxx` | `qwen` (新增) |
| **文心一言** | `apikey-xxxxx` | `ernie` (新增) |
| **讯飞星火** | `xxxxx-xxxxx` | `spark` (新增) |

### 3.3 配置文件位置

Key 前缀在 `backend/config.yaml` 中配置：

```yaml
default:
  api_key_prefix: "sk-"  # 用户 API Key 前缀
```

## 4. 实现方案

### 4.1 方案 A: 新增平台标识 (推荐)

在 `backend/internal/domain/constants.go` 中新增平台常量：

```go
const (
    // 现有平台
    PlatformAnthropic   = "anthropic"
    PlatformOpenAI     = "openai"
    PlatformGemini     = "gemini"
    PlatformAntigravity = "antigravity"
    PlatformSora       = "sora"
    
    // 新增平台
    PlatformDeepSeek   = "deepseek"
    PlatformMiniMax    = "minimax"
    PlatformDoubao     = "doubao"
    PlatformQwen       = "qwen"
    PlatformERNIE      = "ernie"
    PlatformSpark      = "spark"
)
```

**优点**：
- 完整的平台支持
- 可单独配置调度、速率限制等
- 便于统计各平台使用情况

**工作量**：
- 中等，需要新增账号类型处理逻辑

### 4.2 方案 B: 扩展 Upstream 类型

利用现有的 `upstream` 类型，增加预定义模板：

```go
// upstream 模板类型
const (
    UpstreamTemplateDeepSeek = "deepseek"
    UpstreamTemplateMiniMax  = "minimax"
    UpstreamTemplateQwen     = "qwen"
    // ...
)
```

**优点**：
- 改动最小
- 复用现有代码

**缺点**：
- 缺乏平台级支持
- 统计和调度不够精细

### 4.3 推荐实现路径

1. **Phase 1**: 新增平台标识 (DeepSeek, MiniMax, Qwen)
2. **Phase 2**: 新增平台认证处理逻辑
3. **Phase 3**: 前端账号管理页面优化 (Key 格式自动识别)
4. **Phase 4**: 扩展更多国内模型支持

## 5. 前端界面需求

### 5.1 账号创建页面

在账号管理 → 新增账号 页面：

1. **Key 输入框**：用户粘贴 API Key
2. **自动识别**：根据 Key 前缀自动选择平台
3. **平台下拉**：支持手动选择 (预设为自动识别结果)
4. **配置项**：根据平台显示对应配置项

### 5.2 Key 格式识别规则

```javascript
const KEY_PATTERNS = [
    { prefix: 'sk-ant-', platform: 'anthropic', name: 'Anthropic Claude' },
    { prefix: 'sk-',    platform: 'openai',    name: 'OpenAI / Codex' },
    { prefix: 'AIzaSy', platform: 'gemini',     name: 'Google Gemini' },
    { prefix: 'sk-',    platform: 'deepseek',   name: 'DeepSeek' },
    { prefix: 'mk-',    platform: 'minimax',   name: 'MiniMax' },
    { prefix: 'ak-',    platform: 'doubao',    name: '字节跳动豆包' },
    // ...
]
```

## 6. 相关文件

### 后端

- `backend/internal/domain/constants.go` - 平台常量定义
- `backend/internal/service/account_service.go` - 账号服务
- `backend/ent/schema/account.go` - 账号数据库 schema

### 前端

- `frontend/src/views/admin/account/` - 账号管理视图
- `frontend/src/composables/useAccount.ts` - 账号相关逻辑

## 7. 测试用例

新增平台支持后需验证：

1. 各平台 Key 格式识别正确
2. 各平台 API 调用正常
3. 调度器正确选择对应平台账号
4. 速率限制正常工作
5. 使用统计正确记录

---

**文档版本**: v1.0  
**创建日期**: 2026-03-24  
**最后更新**: 2026-03-24
