package models

import (
	"context"
	"fmt"
	"io"
	"time"
)

// =============================================================================
// Type Definitions
// =============================================================================

// Provider 模型提供商接口
// 所有模型提供商都必须实现此接口
type Provider interface {
	// Name 返回提供商名称 (如 "deepseek", "qwen", "baidu")
	Name() string

	// BaseURL 返回 API 基础地址
	BaseURL() string

	// Models 返回支持的模型列表
	Models() []Model

	// Chat 发起聊天请求 (非流式)
	Chat(ctx context.Context, req *ChatRequest) (*ChatResponse, error)

	// ChatStream 发起流式聊天请求
	ChatStream(ctx context.Context, req *ChatRequest) (io.ReadCloser, error)

	// Embeddings 获取嵌入向量
	Embeddings(ctx context.Context, req *EmbeddingsRequest) (*EmbeddingsResponse, error)

	// ValidateKey 验证 API 密钥有效性
	ValidateKey(ctx context.Context, key string) error

	// Close 关闭 provider，释放资源
	Close() error
}

// Model 模型信息
type Model struct {
	ID           string   `json:"id"`           // 模型 ID (如 "deepseek-chat")
	Name         string   `json:"name"`         // 显示名称 (如 "DeepSeek Chat")
	Provider     string   `json:"provider"`     // 提供商名称
	Type         string   `json:"type"`         // 类型: "chat", "embedding", "image"
	ContextSize  int      `json:"context_size"` // 上下文长度 (tokens)
	MaxTokens    int      `json:"max_tokens"`  // 最大输出 tokens
	Capabilities []string `json:"capabilities"` // 能力列表: "streaming", "vision", "function_call"
}

// ChatRequest 聊天请求
type ChatRequest struct {
	Model          string        `json:"model"`
	Messages       []ChatMessage `json:"messages"`
	Temperature    float64       `json:"temperature,omitempty"`
	MaxTokens      int           `json:"max_tokens,omitempty"`
	Stream         bool          `json:"stream,omitempty"`
	TopP           float64       `json:"top_p,omitempty"`
	Stop           []string      `json:"stop,omitempty"`
	Tools          []Tool        `json:"tools,omitempty"`
	ToolChoice     interface{}   `json:"tool_choice,omitempty"`
	ResponseFormat interface{}   `json:"response_format,omitempty"`
	// Provider 特定参数
	Extra map[string]interface{} `json:"-"`
}

// ChatMessage 聊天消息
type ChatMessage struct {
	Role    string `json:"role"` // "system", "user", "assistant", "tool"
	Content string `json:"content"`
	Name    string `json:"name,omitempty"`
	// Tool call 相关
	ToolCalls  []ToolCall `json:"tool_calls,omitempty"`
	ToolCallID string     `json:"tool_call_id,omitempty"`
}

// ToolCall 工具调用
type ToolCall struct {
	ID       string       `json:"id"`
	Type     string       `json:"type"` // "function"
	Function FunctionCall `json:"function"`
}

// FunctionCall 函数调用
type FunctionCall struct {
	Name      string `json:"name"`
	Arguments string `json:"arguments"`
}

// Tool 工具定义
type Tool struct {
	Type     string             `json:"type"` // "function"
	Function FunctionDefinition `json:"function"`
}

// FunctionDefinition 函数定义
type FunctionDefinition struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Parameters  map[string]interface{} `json:"parameters"`
}

// ChatResponse 聊天响应 (非流式)
type ChatResponse struct {
	ID                string   `json:"id"`
	Object            string   `json:"object"`
	Created           int64    `json:"created"`
	Model             string   `json:"model"`
	Choices           []Choice `json:"choices"`
	Usage             Usage    `json:"usage"`
	SystemFingerprint string   `json:"system_fingerprint,omitempty"`
}

// Choice 选项
type Choice struct {
	Index        int         `json:"index"`
	Message      ChatMessage `json:"message"`
	FinishReason string      `json:"finish_reason"`
}

// Usage 用量统计
type Usage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
	// Provider 特定
	PromptTokensDetails     *PromptTokensDetails     `json:"prompt_tokens_details,omitempty"`
	CompletionTokensDetails *CompletionTokensDetails `json:"completion_tokens_details,omitempty"`
}

type PromptTokensDetails struct {
	CachedTokens int `json:"cached_tokens,omitempty"`
}

type CompletionTokensDetails struct {
	ReasoningTokens int `json:"reasoning_tokens,omitempty"`
}

// EmbeddingsRequest 嵌入请求
type EmbeddingsRequest struct {
	Model          string   `json:"model"`
	Input          []string `json:"input"`
	InputType      string   `json:"input_type,omitempty"`
	EncodingFormat string   `json:"encoding_format,omitempty"`
	Dimensions     int      `json:"dimensions,omitempty"`
}

// EmbeddingsResponse 嵌入响应
type EmbeddingsResponse struct {
	Object string      `json:"object"`
	Data   []Embedding `json:"data"`
	Model  string      `json:"model"`
	Usage  Usage       `json:"usage"`
}

// Embedding 嵌入向量
type Embedding struct {
	Object    string    `json:"object"`
	Index     int       `json:"index"`
	Embedding []float64 `json:"embedding"`
}

// ProviderConfig 提供商配置
type ProviderConfig struct {
	APIKey       string
	BaseURL      string
	Organization string
	Timeout      time.Duration
	// 认证相关
	AuthType string // "bearer", "api_key", "oauth"
	// Provider 特定
	Extra map[string]interface{}
}

// HTTPClientConfig HTTP 客户端配置
type HTTPConfig struct {
	Timeout      time.Duration
	MaxRetries   int
	RetryDelay   time.Duration
	MaxKeepAlive int
}

// PoolConfig 连接池配置
type PoolConfig struct {
	MaxIdle     int
	MaxActive   int
	IdleTimeout time.Duration
}

// Errors
var (
	ErrUnknownProvider   = NewError("unknown provider: %s")
	ErrInvalidAPIKey     = NewError("invalid API key")
	ErrRateLimited       = NewError("rate limited")
	ErrInsufficientQuota = NewError("insufficient quota")
	ErrModelNotFound     = NewError("model not found: %s")
	ErrInvalidRequest    = NewError("invalid request: %s")
	ErrContextCancelled  = NewError("context cancelled")
	ErrTimeout           = NewError("request timeout")
)

// NewError 创建错误
func NewError(format string, args ...interface{}) error {
	return &ModelError{Message: format, Args: args}
}

// Errorf 创建格式化错误
func Errorf(format string, args ...interface{}) error {
	return &ModelError{Message: format, Args: args}
}

// ModelError 模型错误
type ModelError struct {
	Message string
	Args    []interface{}
}

func (e *ModelError) Error() string {
	if len(e.Args) > 0 {
		return fmt.Sprintf(e.Message, e.Args...)
	}
	return e.Message
}

func (e *ModelError) Unwrap() error {
	return nil
}

// Is performs error identity comparison.
// Only returns true when target is the exact same ModelError instance
// (including format string and arguments), not for substring matches.
// This ensures errors.Is(ErrRateLimited, ErrInvalidRequest) returns false
// even when message strings happen to be substrings of each other.
func (e *ModelError) Is(target error) bool {
	targetME, ok := target.(*ModelError)
	if !ok {
		return false
	}
	if e == targetME {
		return true
	}
	if e.Message != targetME.Message {
		return false
	}
	if len(e.Args) != len(targetME.Args) {
		return false
	}
	for i, a := range e.Args {
		if a != targetME.Args[i] {
			return false
		}
	}
	return true
}