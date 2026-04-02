# Sub2API 性能测试计划

## 1. 概述

本文档定义了 Sub2API 的全面性能测试计划，旨在：
- 了解系统当前性能基线
- 识别性能瓶颈
- 为后续优化提供数据支持

## 2. 测试环境

### 2.1 硬件环境

| 组件 | 配置 | 备注 |
|------|------|------|
| CPU | 8 核 | 本地测试环境 |
| 内存 | 16GB | |
| 磁盘 | SSD 512GB | |
| 网络 | 100Mbps | |

### 2.2 软件环境

| 组件 | 版本 | 备注 |
|------|------|------|
| 操作系统 | Windows 11 | |
| Go | 1.25+ | |
| PostgreSQL | 15+ | 本地运行 |
| Redis | 7+ | 本地运行 (127.0.0.1:6379) |
| Node.js | 18+ | 前端构建 |

### 2.3 测试工具

| 工具 | 用途 | 状态 |
|------|------|------|
| Go Benchmark | 单元级性能测试 | ✅ 已内置 8 个 benchmark 文件 |
| Artillery | 负载测试 | ✅ 技能可用 |
| K6 | 负载测试 | ✅ 技能可用 |
| Playwright | 前端性能测试 | ✅ 已配置 |

## 3. 测试类型

### 3.1 微基准测试 (Micro-Benchmarks)

已存在的 Go Benchmark 测试：

| 文件 | 测试范围 |
|------|---------|
| `gateway_service_benchmark_test.go` | Session Hash 生成, 内容提取 |
| `gateway_anthropic_apikey_passthrough_benchmark_test.go` | SSE 解析, 使用统计 |
| `openai_account_scheduler_benchmark_test.go` | 账号选择器 |
| `openai_ws_pool_benchmark_test.go` | WebSocket 连接池 |
| `openai_ws_forwarder_benchmark_test.go` | WebSocket 转发 |
| `openai_json_optimization_benchmark_test.go` | JSON 优化 |
| `http_upstream_benchmark_test.go` | HTTP 上游请求 |
| `concurrency_cache_benchmark_test.go` | 并发缓存 |

#### 运行命令

```bash
# 运行所有 benchmark
cd backend
go test -bench=. -benchmem ./...

# 运行特定 benchmark
go test -bench=BenchmarkGenerateSessionHash -benchmem ./internal/service/...

# 生成 CPU profile
go test -bench=. -cpuprofile=cpu.prof ./...
go test -bench=. -memprofile=mem.prof ./...
```

### 3.2 负载测试 (Load Tests)

使用 Artillery/K6 进行 API 负载测试。

#### 测试场景

| 场景 | 描述 | 并发数 |
|------|------|--------|
| 登录 | 用户登录 | 10, 50, 100, 500 |
| 获取账号列表 | 管理员获取账号列表 | 10, 50, 100 |
| API 转发 | 核心 API 转发 (模拟用户请求) | 10, 50, 100, 500, 1000 |
| WebSocket | 流式响应 | 10, 50, 100 |
| 混合场景 | 组合负载 | 100 |

#### 测试脚本位置

```
tests/
├── performance/              # 性能测试
│   ├── artillery/           # Artillery 测试
│   │   ├── login.yml
│   │   ├── api-gateway.yml
│   │   ├── websocket.yml
│   │   └── mixed.yml
│   ├── k6/                  # K6 测试
│   │   ├── login.js
│   │   ├── api-gateway.js
│   │   └── mixed.js
│   └── reports/             # 测试报告
└── ...
```

#### Artillery 配置示例

```yaml
# tests/performance/artillery/api-gateway.yml
config:
  target: "http://localhost:8080"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Load test"
    - duration: 60
      arrivalRate: 100
      name: "Stress test"
  processor: "./processors.js"

scenarios:
  - name: "Chat Completions API"
    flow:
      - post:
          url: "/v1/chat/completions"
          json:
            model: "gpt-4"
            messages:
              - role: "user"
                content: "Hello"
            stream: true
          beforeRequest: "setAuthHeader"
```

### 3.3 压力测试 (Stress Tests)

逐步增加负载直到系统崩溃，确定系统极限。

| 指标 | 目标 | 告警阈值 |
|------|------|---------|
| RPS (请求/秒) | > 500 | < 100 |
| 延迟 P99 | < 500ms | > 1000ms |
| 错误率 | < 1% | > 5% |
| CPU 使用率 | < 80% | > 90% |
| 内存使用 | < 80% | > 90% |

### 3.4 持久连接测试

测试 WebSocket 和长连接性能。

```javascript
// K6 WebSocket 测试
import ws from 'k6/ws';

export const options = {
  vus: 100,
  duration: '60s',
};

export default function() {
  ws.connect('ws://localhost:8080/v1/chat/completions', {}, function(socket) {
    socket.on('message', (data) => {
      // 处理消息
    });
    socket.send(JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello' }],
      stream: true
    }));
    socket.close();
  });
}
```

### 3.5 数据库性能测试

| 测试项 | 描述 |
|--------|------|
| 连接池 | PostgreSQL 连接池大小测试 |
| 查询性能 | 复杂查询响应时间 |
| 写入性能 | 高并发写入测试 |
| 索引效率 | 查询计划分析 |

#### 已实现的基准测试文件

| 文件 | 测试内容 |
|------|---------|
| `internal/repository/database_benchmark_test.go` | 基础数据库操作 |
| `internal/repository/database_concurrency_benchmark_test.go` | 并发数据库操作 |

#### 基准测试项目

**基础操作**:
- `BenchmarkDB_AccountSelectByID` - 按 ID 查询账号
- `BenchmarkDB_AccountList` - 账号分页查询
- `BenchmarkDB_AccountListAll` - 查询所有账号
- `BenchmarkDB_AccountFilterByPlatform` - 按平台筛选
- `BenchmarkDB_AccountUpdateLastUsed` - 更新最后使用时间
- `BenchmarkDB_GroupSelectByID` - 查询分组
- `BenchmarkDB_GroupList` - 分组列表查询
- `BenchmarkDB_GroupWithAccounts` - 分组+账号关联查询
- `BenchmarkDB_APIKeySelectByKey` - API Key 查询
- `BenchmarkDB_APIKeyListByUser` - 用户 API Keys 查询
- `BenchmarkDB_UsageLogInsert` - 使用日志写入
- `BenchmarkDB_UsageLogQueryByUser` - 使用日志查询

**并发操作**:
- `BenchmarkDB_ConcurrentAccountReads` - 并发账号读取
- `BenchmarkDB_ConcurrentUsageLogWrites` - 并发日志写入
- `BenchmarkDB_ConcurrentAPIKeyLookups` - 并发 Key 查询
- `BenchmarkDB_AccountPoolQuery` - 账号池查询 (调度器模拟)

```bash
# 运行数据库基准测试 (需要 integration tag)
cd backend
go test -tags=integration -bench=DB -benchmem ./internal/repository/...
```

### 3.6 Redis 性能测试

| 测试项 | 描述 |
|--------|------|
| 缓存命中 | 缓存读写性能 |
| 会话存储 | Session 读写性能 |
| 分布式锁 | 锁竞争性能 |

### 3.7 前端性能测试

使用 Playwright 进行前端性能测试。

```javascript
// tests/performance/frontend-perf.spec.ts
import { test, expect } from '@playwright/test';

test('dashboard page performance', async ({ page }) => {
  const metrics = [];
  page.on('request', (request) => {
    metrics.push({ url: request.url(), timing: Date.now() });
  });
  
  await page.goto('http://localhost:8080/dashboard');
  
  // 等待页面加载完成
  await page.waitForLoadState('networkidle');
  
  // 测量 Core Web Vitals
  const metrics = await page.evaluate(() => {
    return JSON.parse(JSON.stringify(performance));
  });
  
  console.log('FCP:', metrics.domContentLoaded);
  console.log('LCP:', metrics.loadEventEnd);
});
```

## 4. 测试指标

### 4.1 核心指标

| 指标 | 说明 | 目标值 |
|------|------|--------|
| TPS | 事务/秒 | > 1000 |
| QPS | 查询/秒 | > 2000 |
| 延迟 Avg | 平均响应时间 | < 100ms |
| 延迟 P50 | 中位数响应时间 | < 50ms |
| 延迟 P95 | 95% 分位响应时间 | < 200ms |
| 延迟 P99 | 99% 分位响应时间 | < 500ms |
| 错误率 | 失败请求比例 | < 0.1% |
| CPU | CPU 使用率 | < 70% |
| Memory | 内存使用率 | < 80% |

### 4.2 API 特定指标

| API 端点 | 目标 TPS | 目标延迟 P99 |
|----------|---------|-------------|
| `/v1/chat/completions` (流式) | 500 | 500ms |
| `/v1/chat/completions` (非流式) | 1000 | 300ms |
| `/v1/completions` | 1000 | 300ms |
| `/v1/models` | 2000 | 50ms |
| `/v1/user/info` | 2000 | 50ms |
| 管理 API | 500 | 200ms |

### 4.3 资源指标

| 资源 | 基准 | 告警 |
|------|------|------|
| Go 堆内存 | < 500MB | > 1GB |
| PostgreSQL 连接 | < 50 | > 80 |
| Redis 连接 | < 100 | > 150 |
| Goroutines | < 1000 | > 5000 |

## 5. 测试用例

### 5.1 认证模块

| 用例 | 描述 | 预期结果 |
|------|------|---------|
| TC-AUTH-01 | 10 并发登录 | P99 < 200ms |
| TC-AUTH-02 | 100 并发登录 | P99 < 500ms |
| TC-AUTH-03 | 连续登录 1000 次 | 错误率 < 0.1% |

### 5.2 API 网关

| 用例 | 描述 | 预期结果 |
|------|------|---------|
| TC-GW-01 | 100 并发 API 请求 | P99 < 300ms |
| TC-GW-02 | 500 并发 API 请求 | P99 < 500ms |
| TC-GW-03 | 1000 并发 API 请求 | 系统稳定 |
| TC-GW-04 | 流式响应 (100 并发) | 吞吐量 > 50 msg/s |

### 5.3 管理后台

| 用例 | 描述 | 预期结果 |
|------|------|---------|
| TC-ADMIN-01 | 获取账号列表 (100 条) | < 500ms |
| TC-ADMIN-02 | 获取账号列表 (1000 条) | < 2s |
| TC-ADMIN-03 | 创建账号 | < 1s |
| TC-ADMIN-04 | 更新账号 | < 500ms |

### 5.4 调度器

| 用例 | 描述 | 预期结果 |
|------|------|---------|
| TC-SCHED-01 | 账号选择 (10 个账号) | < 10ms |
| TC-SCHED-02 | 账号选择 (100 个账号) | < 50ms |
| TC-SCHED-03 | 账号选择 (1000 个账号) | < 200ms |

## 6. 测试数据准备

### 6.1 测试账号

| 类型 | 数量 | 用途 |
|------|------|------|
| 测试用户 | 100 | 登录/并发测试 |
| 上游账号 | 1000 | 调度测试 |
| API Key | 5000 | 网关测试 |

### 6.2 数据生成脚本

```bash
# 生成测试数据
cd tests/scripts
node generate-test-data.js --users=100 --accounts=1000 --keys=5000
```

## 7. 执行计划

### Phase 1: 基准测试 (Week 1)

1. 运行现有 Go Benchmark
2. 建立性能基线
3. 分析热点函数

### Phase 2: 负载测试 (Week 2)

1. Artillery/K6 脚本开发
2. 单场景测试
3. 混合场景测试

### Phase 3: 瓶颈分析 (Week 3)

1. Profiling 分析
2. 数据库慢查询分析
3. 资源瓶颈识别

### Phase 4: 优化验证 (Week 4)

1. 针对性优化
2. 复测验证
3. 性能报告

## 8. 报告模板

### 8.1 测试摘要

```
## 测试摘要

| 项目 | 结果 |
|------|------|
| 测试日期 | YYYY-MM-DD |
| 测试版本 | vX.X.X |
| 测试环境 | 本地/测试环境 |
| 总请求数 | X,XXX,XXX |
| 成功率 | XX.X% |
| 平均 TPS | XXX |
| P99 延迟 | XXXms |

### 通过/失败

- [ ] TC-AUTH-01
- [ ] TC-AUTH-02
- ...
```

### 8.2 详细指标

```
## 详细指标

### 延迟分布
| 百分位 | 延迟 (ms) |
|--------|-----------|
| P50    | XX        |
| P90    | XX        |
| P95    | XX        |
| P99    | XX        |

### 资源使用
| 资源 | 峰值使用 | 告警 |
|------|---------|------|
| CPU  | XX%     | 是/否 |
| 内存 | XX%     | 是/否 |
```

### 8.3 瓶颈分析

```
## 瓶颈分析

### 热点函数
1. func.A - XX% CPU
2. func.B - XX% CPU
3. func.C - XX% CPU

### 建议优化
1. 优化 func.A - 预计提升 XX%
2. 增加缓存 - 预计提升 XX%
```

## 9. 工具脚本

### 9.1 运行所有基准测试

```bash
# tests/scripts/run-benchmarks.sh
#!/bin/bash

echo "Running Go benchmarks..."
cd ../backend

# 所有 benchmark
go test -bench=. -benchmem -count=5 ./... > ../tests/reports/benchmark-results.txt

# 特定模块
go test -bench=Scheduler -benchmem ./internal/service/...
go test -bench=Gateway -benchmem ./internal/service/...
go test -bench=Pool -benchmem ./internal/service/...

echo "Benchmark complete. Results saved to ../tests/reports/"
```

### 9.2 运行负载测试

```bash
# tests/scripts/run-load-tests.sh
#!/bin/bash

ARTILLERY="npx artillery"
TARGET="http://localhost:8080"

echo "Starting load tests..."

# 登录测试
$ARTILLERY run performance/artillery/login.yml -o performance/reports/login.json

# API 网关测试
$ARTILLERY run performance/artillery/api-gateway.yml -o performance/reports/api-gateway.json

# WebSocket 测试
$ARTILLERY run performance/artillery/websocket.yml -o performance/reports/websocket.json

# 生成 HTML 报告
$ARTILLERY report performance/reports/*.json

echo "Load tests complete."
```

## 10. 注意事项

1. **测试隔离**: 每次测试前清理缓存和连接池
2. **数据重置**: 测试后重置测试数据
3. **监控**: 测试期间监控系统和数据库
4. **日志**: 收集测试日志用于分析
5. **可重复**: 确保测试可重复执行

---

**文档版本**: v1.0  
**创建日期**: 2026-03-24  
**维护人**: Sub2API Team
