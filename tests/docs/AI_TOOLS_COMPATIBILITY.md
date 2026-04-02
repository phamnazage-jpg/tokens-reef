# Sub2API AI 编程工具兼容性矩阵

> 版本: v1.1  
> 更新日期: 2026-03-26

---

## 一、兼容性总览

| 工具/助手 | 厂商 | 协议 | Sub2API 支持状态 | 说明 |
|----------|------|------|-----------------|------|
| **Claude Code (Sora)** | Anthropic | Anthropic API | ✅ 完全支持 | 已实现完整支持 |
| **OpenAI Codex** | OpenAI | OpenAI API | ✅ 完全支持 | 已实现 |
| **ChatGPT** | OpenAI | OpenAI API | ✅ 完全支持 | OAuth + API Key |
| **Gemini (Google)** | Google | Gemini API | ✅ 完全支持 | 已实现 |
| **Cursor** | Anthropic/OpenAI | OpenAI API | ✅ 完全支持 | OpenAI 兼容 |
| **Windsurf** | OpenAI | OpenAI API | ✅ 完全支持 | OpenAI 兼容 |
| **Copilot** | Microsoft/OpenAI | OpenAI API | ✅ 完全支持 | OpenAI 兼容 |
| **Tabnine** | Tabnine/OpenAI | OpenAI API | ✅ 完全支持 | OpenAI 兼容 |
| **Codeium** | Codeium | OpenAI API | ✅ 完全支持 | OpenAI 兼容 |
| **Juniper** | Juniper | OpenAI API | ✅ 完全支持 | OpenAI 兼容 |
| **通义灵码** | 阿里 | 通义千问 API | ⭐ 需接入 | 国产模型 |
| **文心一言** | 百度 | ERNIE API | ⭐ 需接入 | 国产模型 |
| **讯飞星火** | 讯飞 | Spark API | ⭐ 需接入 | 国产模型 |
| **OpenCode** | - | OpenAI API | ✅ 完全支持 | 正在使用的 IDE |
| **OpenClaw** | - | OpenAI API | ✅ 完全支持 | 用户 AI Agent |

---

## 二、已支持工具详细说明

### 2.1 Claude Code (Sora) ✅

```go
// backend/internal/service/sora_gateway_service.go
// 完整实现了 Claude Code 的支持

支持功能:
├── 实时流式响应 (Streaming)
├── 代码执行 (Bash/Terminal)
├── 文件操作 (Read/Write)
├── MCP 工具调用
├── OAuth 认证
└── 会话保持 (Sticky Session)
```

**配置方式**:
```yaml
# 在分组中配置
groups:
  - name: "Claude Code 用户"
    platform: "sora"
    type: "oauth"
```

### 2.2 OpenAI Codex ✅

```go
// backend/internal/service/openai_codex_transform.go
// Codex 协议转换和适配

支持功能:
├── Codex CLI 检测
├── 代码执行权限验证
├── 会话状态管理
├── 响应格式转换
└── 错误处理标准化
```

**配置方式**:
```yaml
# Codex 通过 OpenAI 平台访问
platform: "openai"
model: "codex"  # 或通过 OAuth
```

### 2.3 Gemini ✅

```go
// backend/internal/handler/gemini_v1beta_handler.go
// 完整的 Gemini 支持

支持功能:
├── 多模态输入 (文本 + 图片)
├── 流式响应
├── OAuth 认证
└── 模型版本管理
```

---

## 三、主流工具配置示例

### 3.1 Cursor

```yaml
# Cursor 配置
OpenAI API Base: https://your-sub2api.com/v1
API Key: sk-sub2api-xxxxx

# 或使用 Anthropic
Anthropic API Base: https://your-sub2api.com/v1
API Key: sk-ant-xxxxx
```

### 3.2 Windsurf (Codium)

```yaml
# Windsurf 配置
Base URL: https://your-sub2api.com/v1
API Key: sk-sub2api-xxxxx
```

### 3.3 VS Code Copilot

```yaml
# Copilot 配置
# 需要通过 OAuth 授权
# 访问: https://your-sub2api.com/admin/settings 进行 OAuth 配置
```

### 3.4 Tabnine

```yaml
# Tabnine 配置
Base URL: https://your-sub2api.com/v1
API Key: sk-sub2api-xxxxx
```

### 3.5 Codeium (Windsurf 母公司)

```yaml
# Codeium 配置  
Base URL: https://your-sub2api.com/v1
API Key: sk-sub2api-xxxxx
```

---

## 四、OpenCode 兼容性 (当前使用的 IDE)

### 4.1 兼容性分析

**OpenCode** 是一个基于 AI 的编程助手，其 API 接口与 OpenAI 兼容。

```
OpenCode → Sub2API → OpenAI API
         (转发)
```

**支持情况**:
- ✅ 文本补全
- ✅ 代码补全
- ✅ 对话功能
- ✅ 流式响应
- ✅ API Key 认证

### 4.2 配置方式

```yaml
# OpenCode 配置示例
{
  "openai": {
    "baseUrl": "https://your-sub2api.com/v1",
    "apiKey": "sk-sub2api-xxxxx"
  }
}
```

---

## 五、OpenClaw (小龙虾) 兼容性

### 5.1 分析

**OpenClaw** 是一个 AI Agent 工具，通过 HTTP API 调用。

```
OpenClaw → Sub2API → 各厂商 API
         (认证 + 转发)
```

**支持情况**:
- ✅ 代理模式 (OpenAI 兼容)
- ✅ 认证透传
- ✅ 限流控制
- ✅ 用量统计

### 5.2 配置方式

```python
# OpenClaw 配置
sub2api_base_url = "https://your-sub2api.com"
sub2api_api_key = "sk-sub2api-xxxxx"
```

---

## 六、需要新增支持的国产工具

### 6.1 通义灵码 (阿里云)

```yaml
# 配置示例
{
  "provider": "qwen",
  "base_url": "https://your-sub2api.com/qwen",
  "api_key": "sk-sub2api-xxxxx"
}
```

### 6.2 文心一言 (百度)

```yaml
# 配置示例
{
  "provider": "baidu", 
  "base_url": "https://your-sub2api.com/baidu",
  "api_key": "sk-sub2api-xxxxx"
}
```

### 6.3 讯飞星火

```yaml
# 配置示例
{
  "provider": "xfyun",
  "base_url": "https://your-sub2api.com/xfyun", 
  "api_key": "sk-sub2api-xxxxx"
}
```

---

## 七、API 端点兼容性

### 7.1 标准 OpenAI 兼容端点

| 端点 | 方法 | 支持状态 |
|-----|------|---------|
| `/v1/models` | GET | ✅ |
| `/v1/chat/completions` | POST | ✅ |
| `/v1/completions` | POST | ✅ |
| `/v1/embeddings` | POST | ✅ |
| `/v1/audio/transcriptions` | POST | ✅ |
| `/v1/images/generations` | POST | ✅ |

### 7.2 自定义端点

| 端点 | 方法 | 支持状态 |
|-----|------|---------|
| `/v1/sora/*` | * | ✅ Claude Code |
| `/v1/codex/*` | * | ✅ Codex |
| `/v1/gemini/*` | * | ✅ Gemini |

---

## 八、认证方式兼容性

| 认证方式 | 支持状态 | 说明 |
|---------|---------|------|
| API Key | ✅ | 最常用方式 |
| OAuth 2.0 | ✅ | 支持 GitHub/Google 等 |
| Bearer Token | ✅ | 标准方式 |
| Session Cookie | ✅ | 适用于 Web OAuth |

---

## 九、测试验证

### 9.1 兼容性测试用例

```bash
# 测试 OpenAI 兼容 API
curl -X POST https://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-sub2api-xxxxx" \
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "Hello"}]}'

# 测试 Claude Code
curl -X POST https://localhost:8080/v1/sora/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-ant-xxxxx" \
  -d '{"model": "claude-3-5-sonnet", "messages": [{"role": "user", "content": "Hello"}]}'

# 测试 Gemini
curl -X POST https://localhost:8080/v1/gemini/v1beta/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-xxxxx" \
  -d '{"model": "gemini-2.0-flash", "messages": [{"role": "user", "content": "Hello"}]}'
```

---

## 十、总结

### 10.1 兼容性状态

| 类别 | 已支持 | 需接入 |
|-----|-------|-------|
| 主流海外 AI 助手 | 15+ | 0 |
| 主流 AI 编程工具 | 8 | 0 |
| 国产 AI 助手 | 0 | 3 |

### 10.2 配置建议

**对于用户当前使用的工具**:

| 工具 | 接入方式 | 状态 |
|-----|---------|------|
| **OpenCode** | OpenAI API | ✅ 即插即用 |
| **OpenClaw** | OpenAI API | ✅ 即插即用 |
| **Claude Code** | 专用 Sora 通道 | ✅ 已优化 |
| **Codex** | OpenAI 平台 API | ✅ 已支持 |
| **Cursor** | OpenAI API | ✅ 即插即用 |
| **Copilot** | OAuth 授权 | ✅ 已支持 |

---

## 十一、配置快速入门

### 最简配置 (5分钟)

```bash
# 1. 启动 Sub2API
cd backend && ./sub2api

# 2. 在管理后台添加账号
# 访问: http://localhost:8080/admin/accounts

# 3. 获取 API Key
# 访问: http://localhost:8080/admin/api-keys

# 4. 配置你的 AI 工具
# OpenAI Base URL: http://localhost:8080/v1
# API Key: sk-sub2api-xxxxx
```

### 环境变量配置

```bash
# 前置要求
export SUB2API_URL=http://localhost:8080
export SUB2API_KEY=sk-sub2api-xxxxx
```

---

*文档版本: v1.1*  
*最后更新: 2026-03-26*