# Sub2API 国产模型接入详细方案

> 版本: v1.0  
> 日期: 2026-03-26  
> 状态: 详细设计

---

## 一、当前模型支持现状

### 1.1 已有模型支持

| 平台 | 状态 | 实现方式 |
|------|------|---------|
| **OpenAI** | ✅ 完整 | 原生 client |
| **Anthropic** | ✅ 完整 | 原生 client |
| **Google Gemini** | ✅ 完整 | 原生 client |
| **AWS Bedrock** | ✅ 完整 | AWS SDK |
| **自定义 Upstream** | ✅ 完整 | HTTP 代理 |
| **Antigravity** | ✅ 完整 | 自定义 |
| **Sora (Claude Code)** | ✅ 完整 | 自定义 |

### 1.2 待接入模型

| 序号 | 模型 | 厂商 | API 特点 | 优先级 |
|-----|------|------|---------|--------|
| 1 | 文心一言 | 百度 | REST API | P0 |
| 2 | 通义千问 | 阿里 | OpenAI 兼容 | P0 |
| 3 | 讯飞星火 | 讯飞 | 私有协议 | P1 |
| 4 | 混元 | 腾讯 | OpenAI 兼容 | P1 |
| 5 | 豆包 | 字节 | OpenAI 兼容 | P1 |
| 6 | MiniMax | MiniMax | OpenAI 兼容 | P1 |
| 7 | DeepSeek | DeepSeek | OpenAI 兼容 | P0 |
| 8 | 智谱清言 | 智谱 | OpenAI 兼容 | P2 |
| 9 | 百川智能 | 百川 | OpenAI 兼容 | P2 |

---

## 二、技术架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           模型接入架构                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Gateway (API 网关)                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │OpenAI兼容│ │Anthropic │ │ Gemini   │ │ Bedrock  │           │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Provider Adapter Layer                       │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │   │
│  │  │ 百川/智谱  │ │  DeepSeek  │ │  通义/豆包  │ │  讯飞/混元  │   │   │
│  │  │(OpenAI兼容)│ │(OpenAI兼容)│ │(OpenAI兼容)│ │ (自定义)   │   │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    External APIs                                 │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │  百度   │ │   阿里   │ │   腾讯   │ │   讯飞   │           │   │
│  │  │ ERNIE Bot│ │ Qwen API │ │Hunyuan API│ │ Spark API │           │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构

```go
backend/internal/pkg/
├── openai/              // 现有 OpenAI 客户端
│   ├── client.go
│   ├── types.go
│   └── stream.go
├── anthropic/           // 现有 Anthropic 客户端
│   └── ...
├── models/              // 新增: 模型提供商适配器
│   ├── factory.go      // 工厂模式创建 client
│   ├── interface.go    // 统一接口定义
│   ├── base.go        // 基础实现
│   ├── openai_compat.go    // OpenAI 兼容适配器
│   │   ├── deepseek/       // DeepSeek
│   │   ├── qwen/          // 通义千问
│   │   ├── doubao/        // 豆包
│   │   ├── minimax/       // MiniMax
│   │   ├── zhipu/         // 智谱清言
│   │   └── baichuan/      // 百川智能
│   └── custom/            // 自定义协议
│       ├── baidu/         // 百度文心
│       ├── tencent/       // 腾讯混元
│       └── xfyun/         // 讯飞星火
└── oauth/               // 现有 OAuth 处理
```

---

## 三、接口设计

### 3.1 统一 Provider 接口

```go
// backend/internal/pkg/models/interface.go

package models

// Provider 模型提供商接口
type Provider interface {
    // Name 返回提供商名称
    Name() string
    
    // BaseURL 返回 API 基础地址
    BaseURL() string
    
    // Models 返回支持的模型列表
    Models() []Model
    
    // Chat 发起聊天请求
    Chat(ctx context.Context, req *ChatRequest) (*ChatResponse, error)
    
    // ChatStream 发起流式聊天请求
    ChatStream(ctx context.Context, req *ChatRequest) (*StreamReader, error)
    
    // Embeddings 获取嵌入向量
    Embeddings(ctx context.Context, req *EmbeddingsRequest) (*EmbeddingsResponse, error)
    
    // ValidateKey 验证 API 密钥有效性
    ValidateKey(ctx context.Context, key string) error
}

// Model 模型信息
type Model struct {
    ID          string   `json:"id"`           // 模型 ID
    Name        string   `json:"name"`         // 显示名称
    Provider    string   `json:"provider"`     // 提供商
    Type        string   `json:"type"`         // chat, embedding, image
    ContextSize int      `json:"context_size"` // 上下文长度
    MaxTokens   int      `json:"max_tokens"`   // 最大输出 tokens
    Capabilities []string `json:"capabilities"` // streaming, vision, function_call
}

// ChatRequest 聊天请求
type ChatRequest struct {
    Model       string                 `json:"model"`
    Messages    []ChatMessage          `json:"messages"`
    Temperature float64                `json:"temperature,omitempty"`
    MaxTokens   int                    `json:"max_tokens,omitempty"`
    Stream      bool                   `json:"stream,omitempty"`
    Tools       []Tool                 `json:"tools,omitempty"`
    // ... 其他参数
}

// ChatMessage 聊天消息
type ChatMessage struct {
    Role    string `json:"role"`    // system, user, assistant, tool
    Content string `json:"content"`
    // ...
}
```

### 3.2 工厂模式

```go
// backend/internal/pkg/models/factory.go

package models

import (
    "errors"
)

var (
    ErrUnknownProvider = errors.New("unknown provider")
    
    // provider registry
    providers = make(map[string]func(cfg *ProviderConfig) Provider)
)

// RegisterProvider 注册模型提供商
func RegisterProvider(name string, factory func(cfg *ProviderConfig) Provider) {
    providers[name] = factory
}

// NewProvider 创建模型提供商实例
func NewProvider(name string, cfg *ProviderConfig) (Provider, error) {
    factory, ok := providers[name]
    if !ok {
        return nil, ErrUnknownProvider
    }
    return factory(cfg), nil
}

// ProviderConfig 提供商配置
type ProviderConfig struct {
    APIKey      string
    BaseURL     string
    Organization string
    HTTPClient  *http.Client
    Timeout     time.Duration
}

// Init 初始化内置提供商
func Init() {
    // OpenAI 兼容系列 (使用通用适配器)
    RegisterProvider("deepseek", NewOpenAICompatProvider)
    RegisterProvider("qwen", NewOpenAICompatProvider)
    RegisterProvider("doubao", NewOpenAICompatProvider)
    RegisterProvider("minimax", NewOpenAICompatProvider)
    RegisterProvider("zhipu", NewOpenAICompatProvider)
    RegisterProvider("baichuan", NewOpenAICompatProvider)
    RegisterProvider("anthropic", NewOpenAICompatProvider) // 复用
    
    // 自定义协议系列
    RegisterProvider("baidu", NewBaiduProvider)
    RegisterProvider("tencent", NewTencentProvider)
    RegisterProvider("xfyun", NewXfyunProvider)
}
```

---

## 四、模型配置

### 4.1 模型映射配置

```yaml
# backend/config.yaml

models:
  # 现有模型
  - platform: openai
    name: GPT-4
    model_id: gpt-4
    enabled: true
    
  - platform: anthropic
    name: Claude 3.5
    model_id: claude-3-5-sonnet-20241022
    enabled: true

  # 新增国产模型
  
  # DeepSeek (OpenAI 兼容)
  - platform: deepseek
    name: DeepSeek Chat
    model_id: deepseek-chat
    base_url: https://api.deepseek.com/v1
    enabled: true
    
  - platform: deepseek
    name: DeepSeek Coder
    model_id: deepseek-coder
    base_url: https://api.deepseek.com/v1
    enabled: true

  # 通义千问 (OpenAI 兼容)
  - platform: qwen
    name: Qwen Turbo
    model_id: qwen-turbo
    base_url: https://dashscope.aliyuncs.com/compatible-mode/v1
    enabled: true
    
  - platform: qwen
    name: Qwen Plus
    model_id: qwen-plus
    base_url: https://dashscope.aliyuncs.com/compatible-mode/v1
    enabled: true
    
  - platform: qwen
    name: Qwen Max
    model_id: qwen-max
    base_url: https://dashscope.aliyuncs.com/compatible-mode/v1
    enabled: true

  # 百度文心一言 (自定义)
  - platform: baidu
    name: ERNIE 4.0
    model_id: ernie-4.0-8k
    base_url: https://qianfan.baidubce.com/v2
    enabled: true
    
  - platform: baidu
    name: ERNIE 3.5
    model_id: ernie-3.5-8k
    base_url: https://qianfan.baidubce.com/v2
    enabled: true

  # 讯飞星火 (自定义)
  - platform: xfyun
    name: Spark Max
    model_id: spark-max
    base_url: https://spark-api.xf-yun.com/v3.5
    enabled: true

  # 腾讯混元 (OpenAI 兼容)
  - platform: tencent
    name: Hunyuan Turbo
    model_id: hunyuan-turbo
    base_url: https://hunyuan-api.tencentcloudapi.com/v1
    enabled: true

  # 豆包 (OpenAI 兼容)
  - platform: doubao
    name: Doubao Pro
    model_id: doubao-pro-32k
    base_url: https://ark.cn-beijing.volces.com/api/v3
    enabled: true
    
  # MiniMax (OpenAI 兼容)
  - platform: minimax
    name: MiniMax Text
    model_id: abab6.5s-chat
    base_url: https://api.minimax.chat/v1
    enabled: true
    
  # 智谱清言 (OpenAI 兼容)
  - platform: zhipu
    name: GLM-4
    model_id: glm-4
    base_url: https://open.bigmodel.cn/api/paas/v4
    enabled: true
```

### 4.2 数据库模型

```go
// backend/ent/schema/platform.go

// Platform 模型平台
type Platform struct {
    ent.Schema
    
    Fields []ent.Field {
        String("name").Unique().NotEmpty(),      // 平台名称
        String("display_name").NotEmpty(),       // 显示名称
        String("api_base_url").Optional(),      // API 基础地址
        String("documentation").Optional(),     // 文档链接
        Bool("enabled").Default(true),          // 是否启用
        JSON("capabilities", []string{}),        // 能力列表
        JSON("auth_config", map[string]string{}),// 认证配置
        Time("created_at"),
        Time("updated_at"),
    }
    
    Edges []ent.Edge {
        OneToMany("models", Model.Type),
    }
}
```

---

## 五、各模型接入实现

### 5.1 DeepSeek 接入 (OpenAI 兼容)

```go
// backend/internal/pkg/models/openai_compat/deepseek/deepseek.go

package deepseek

import (
    "context"
    "github.com/Wei-Shaw/sub2api/internal/pkg/models"
)

type DeepSeekProvider struct {
    *models.OpenAICompatProvider  // 嵌入通用 OpenAI 兼容实现
}

func New(cfg *models.ProviderConfig) models.Provider {
    baseURL := "https://api.deepseek.com/v1"
    if cfg.BaseURL != "" {
        baseURL = cfg.BaseURL
    }
    
    return &DeepSeekProvider{
        OpenAICompatProvider: models.NewOpenAICompatProvider(
            "deepseek",
            baseURL,
            []models.Model{
                {ID: "deepseek-chat", Name: "DeepSeek Chat", Type: "chat", ContextSize: 32*1024},
                {ID: "deepseek-coder", Name: "DeepSeek Coder", Type: "chat", ContextSize: 16*1024},
            },
            cfg,
        ),
    }
}

// 注册到工厂
func init() {
    models.RegisterProvider("deepseek", New)
}
```

### 5.2 百度文心接入 (自定义协议)

```go
// backend/internal/pkg/models/custom/baidu/baidu.go

package baidu

import (
    "bytes"
    "context"
    "encoding/json"
    "errors"
    "net/http"
    "time"
    
    "github.com/Wei-Shaw/sub2api/internal/pkg/models"
)

type BaiduProvider struct {
    config     *models.ProviderConfig
    baseURL    string
    accessToken string
    tokenExpiry time.Time
}

func New(cfg *models.ProviderConfig) models.Provider {
    baseURL := "https://qianfan.baidubce.com/v2"
    if cfg.BaseURL != "" {
        baseURL = cfg.BaseURL
    }
    
    return &BaiduProvider{
        config:  cfg,
        baseURL: baseURL,
    }
}

func (p *BaiduProvider) Name() string { return "baidu" }
func (p *BaiduProvider) BaseURL() string { return p.baseURL }

func (p *BaiduProvider) Models() []models.Model {
    return []models.Model{
        {ID: "ernie-4.0-8k", Name: "ERNIE 4.0", Type: "chat", ContextSize: 8*1024, MaxTokens: 8*1024},
        {ID: "ernie-3.5-8k", Name: "ERNIE 3.5", Type: "chat", ContextSize: 8*1024, MaxTokens: 8*1024},
        {ID: "ernie-speed-8k", Name: "ERNIE Speed", Type: "chat", ContextSize: 8*1024, MaxTokens: 8*1024},
        {ID: "ernie-text-embedding-v1", Name: "ERNIE Embedding", Type: "embedding", ContextSize: 8*1024},
    }
}

// 获取 Access Token (百度需要 OAuth)
func (p *BaiduProvider) getAccessToken(ctx context.Context) (string, error) {
    if p.accessToken != "" && time.Now().Before(p.tokenExpiry) {
        return p.accessToken, nil
    }
    
    // 调用百度 OAuth 获取 token
    // POST https://aip.baidubce.com/oauth/2.0/token
    // grant_type=client_credentials&client_id=xxx&client_secret=xxx
    
    // 这里需要从 config 中获取 client_id 和 client_secret
    // 暂时简化处理，实际需要完善
    return p.accessToken, nil
}

func (p *BaiduProvider) Chat(ctx context.Context, req *models.ChatRequest) (*models.ChatResponse, error) {
    token, err := p.getAccessToken(ctx)
    if err != nil {
        return nil, errors.New("failed to get access token: " + err.Error())
    }
    
    // 构建请求
    url := p.baseURL + "/chat/completions"
    
    // 转换消息格式
    messages := make([]map[string]interface{}, len(req.Messages))
    for i, m := range req.Messages {
        messages[i] = map[string]interface{}{
            "role":    m.Role,
            "content": m.Content,
        }
    }
    
    body := map[string]interface{}{
        "model":   req.Model,
        "messages": messages,
    }
    if req.Temperature > 0 {
        body["temperature"] = req.Temperature
    }
    if req.MaxTokens > 0 {
        body["max_tokens"] = req.MaxTokens
    }
    
    jsonBody, _ := json.Marshal(body)
    
    httpReq, _ := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonBody))
    httpReq.Header.Set("Content-Type", "application/json")
    httpReq.Header.Set("Authorization", "Bearer "+token)
    
    // 发送请求...
    // 处理响应...
    
    return nil, nil // 简化，实际需要完整实现
}

func (p *BaiduProvider) ValidateKey(ctx context.Context, key string) error {
    // 验证 API Key 有效性
    // 可以调用 /me 接口或获取 token 测试
    return nil
}

// 注册到工厂
func init() {
    models.RegisterProvider("baidu", New)
}
```

### 5.3 通义千问接入 (OpenAI 兼容)

```go
// backend/internal/pkg/models/openai_compat/qwen/qwen.go

package qwen

import (
    "github.com/Wei-Shaw/sub2api/internal/pkg/models"
)

type QwenProvider struct {
    *models.OpenAICompatProvider
}

func New(cfg *models.ProviderConfig) models.Provider {
    baseURL := "https://dashscope.aliyuncs.com/compatible-mode/v1"
    if cfg.BaseURL != "" {
        baseURL = cfg.BaseURL
    }
    
    return &QwenProvider{
        OpenAICompatProvider: models.NewOpenAICompatProvider(
            "qwen",
            baseURL,
            []models.Model{
                {ID: "qwen-turbo", Name: "Qwen Turbo", Type: "chat", ContextSize: 8*1024},
                {ID: "qwen-plus", Name: "Qwen Plus", Type: "chat", ContextSize: 32*1024},
                {ID: "qwen-max", Name: "Qwen Max", Type: "chat", ContextSize: 8*1024},
                {ID: "qwen-long", Name: "Qwen Long", Type: "chat", ContextSize: 320*1024},
            },
            cfg,
        ),
    }
}

func init() {
    models.RegisterProvider("qwen", New)
}
```

---

## 六、前端集成

### 6.1 模型选择下拉框

```vue
<!-- frontend/src/components/common/ModelSelect.vue -->

<template>
  <Select
    v-model="selectedModel"
    filterable
    :loading="loading"
    @change="handleChange"
  >
    <OptionGroup :label="t('model.platform.openai')">
      <Option
        v-for="model in openaiModels"
        :key="model.id"
        :value="model.id"
        :label="model.name"
      >
        <div class="model-option">
          <span>{{ model.name }}</span>
          <Tag v-if="model.status === 'beta'" size="small">Beta</Tag>
        </div>
      </Option>
    </OptionGroup>
    
    <OptionGroup :label="t('model.platform.anthropic')">
      <Option
        v-for="model in anthropicModels"
        :key="model.id"
        :value="model.id"
        :label="model.name"
      />
    </OptionGroup>
    
    <!-- 新增国产模型 -->
    <OptionGroup :label="t('model.platform.chinese')">
      <Option
        v-for="model in chineseModels"
        :key="model.id"
        :value="model.id"
        :label="model.name"
      />
    </OptionGroup>
  </Select>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 按平台分组
const chineseModels = computed(() => 
  props.models.filter(m => 
    ['deepseek', 'qwen', 'baidu', 'xfyun', 'tencent', 'doubao', 'minimax', 'zhipu'].includes(m.platform)
  )
)
</script>
```

### 6.2 模型定价配置

```yaml
# backend/resources/model-pricing/model-pricing.yaml

models:
  # OpenAI
  gpt-4:
    input: 0.03    # $/1M tokens
    output: 0.06
  gpt-4-turbo:
    input: 0.01
    output: 0.03
    
  # Anthropic
  claude-3-5-sonnet:
    input: 0.003
    output: 0.015
    
  # 国产模型
  deepseek-chat:
    input: 0.14
    output: 0.14
    
  qwen-max:
    input: 0.20
    output: 0.60
    
  ernie-4.0-8k:
    input: 0.20
    output: 0.60
    
  spark-max:
    input: 0.03
    output: 0.05
```

---

## 七、任务拆分

### 7.1 开发任务清单

| 序号 | 任务 | 模块 | 预估工时 | 依赖 |
|-----|------|------|---------|------|
| 1 | 创建 Provider 接口和工厂 | core | 2天 | - |
| 2 | 实现 OpenAI 兼容基类 | base | 2天 | 1 |
| 3 | 接入 DeepSeek | provider | 1天 | 2 |
| 4 | 接入通义千问 | provider | 1天 | 2 |
| 5 | 接入豆包 | provider | 1天 | 2 |
| 6 | 接入 MiniMax | provider | 1天 | 2 |
| 7 | 接入智谱清言 | provider | 1天 | 2 |
| 8 | 接入百川智能 | provider | 1天 | 2 |
| 9 | 接入百度文心 (自定义) | provider | 2天 | 1 |
| 10 | 接入腾讯混元 | provider | 1天 | 2 |
| 11 | 接入讯飞星火 | provider | 2天 | 1 |
| 12 | 更新前端模型选择器 | frontend | 2天 | 3-11 |
| 13 | 添加模型定价配置 | config | 1天 | - |
| 14 | 编写使用文档 | docs | 1天 | - |

### 7.2 实施顺序

```
Week 1: 基础设施 (接口 + 工厂 + 基类)
         ↓
Week 2: OpenAI 兼容系列 (DeepSeek, Qwen, 豆包, MiniMax, 智谱, 百川)
         ↓
Week 3: 自定义协议系列 (百度, 腾讯, 讯飞)
         ↓
Week 4: 前端集成 + 测试 + 文档
```

---

## 八、兼容性考虑

### 8.1 与官方 Sub2API 兼容

```go
// 兼容性策略:
// 1. 不修改核心 gateway 逻辑
// 2. 保持 v1/models, v1/chat/completions API 兼容
// 3. 新增 provider 不影响现有功能
// 4. 通过配置开关控制是否启用
```

### 8.2 版本管理

```
v1.0.x - 基础功能 (当前)
v1.1.x - 国产模型接入
v1.2.x - 更多模型 + 高级特性
```

---

## 九、风险与挑战

| 风险 | 应对方案 |
|-----|---------|
| 各厂商 API 变更 | 版本化适配器，及时更新 |
| 认证方式差异 | 统一抽象认证层 |
| 响应格式不统一 | 标准化响应转换 |
| 限流/配额处理 | 实现统一的限流控制 |

---

## 十、总结

本方案详细规划了国产模型接入的完整路径:

1. **架构设计**: 工厂模式 + OpenAI兼容适配器 + 自定义协议适配器
2. **优先级**: DeepSeek/通义千问 → 豆包/MiniMax → 百度/腾讯/讯飞
3. **工作量**: 约 3-4 周完成核心接入
4. **兼容性**: 保持与官方 Sub2API 的兼容

需要我开始实现哪个模型接入吗？建议从 **DeepSeek** 开始，因为它是 OpenAI 兼容，实现难度最低。

---

*文档版本: v1.0*  
*最后更新: 2026-03-26*