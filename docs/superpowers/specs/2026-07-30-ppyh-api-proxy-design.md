# 拼一拼盒 API CORS 代理设计方案

## 背景

白卡盒算价系统需要调用拼一拼盒小程序 API 获取 q≥1000 的精确价格。原实现通过本地 server.js 代理转发解决 CORS 限制，但部署到 GitHub Pages（纯静态托管）后无法使用 server.js。

## 目标

- 恢复拼一拼盒 API 调用获取精确报价
- GitHub Pages 线上版本也能调用 API
- 本地开发无障碍
- API 不可用时回退到费率表估算

## 架构

### 三层调用链

```
calcPrice() (q≥1000):
  │
  ├─ 1. Cloudflare Worker ──────────────────────┐
  │    PPYH_WORKER_URL (配置项)                   │ ← GitHub Pages 主力
  │    浏览器直连，Worker 添加 CORS 头              │
  ├─ 失败 ───────────────────────────────────────┤
  │ 2. 本地 server.js 代理                        │
  │    /api/ppyh/quote (localhost:8765)          │ ← 本地开发环境
  ├─ 失败 ───────────────────────────────────────┤
  │ 3. 费率表 (ratio 调整)                        │
  │    (mc + pc + sc) * ratio                    │ ← 兜底
  └──────────────────────────────────────────────┘
```

### Cloudflare Worker

轻量转发代理，无状态，免费版足够。

- 端点：`POST /`
- 上游：`POST https://www.ppyh.xyz/cbm-service/buyer/render/spu-detail`
- 请求头转发：`Authorization`, `X-APP-ID`, `Content-Type`
- 响应头添加：`Access-Control-Allow-Origin: *`
- 处理 OPTIONS 预检请求

### HTML 改动

1. 恢复 `PPYH_SPEC` - 物料参数 ID 映射
2. 恢复 `callPpyhApi()` - API 调用函数
3. 新增 `PPYH_WORKER_URL` 变量
4. `calcPrice()` 中：
   - q≥1000 且材质为白卡纸/银卡纸时调用 API
   - 优先调用 Cloudflare Worker
   - 失败后尝试本地 proxy
   - 再失败回退费率表
5. 保留俊茂丰 API（q≤500）不受影响

### server.js 改动

恢复 `/api/ppyh/quote` 代理路由，供本地开发使用。

## 配置项

```javascript
// 在 index.html 中配置
var PPYH_WORKER_URL = 'https://ppyh-proxy.xxx.workers.dev';  // 用户部署后填写
var PPYH_LOCAL_PROXY = '/api/ppyh/quote';                     // 本地 server.js
```

## 用户操作

1. 登录 Cloudflare Dashboard → Workers & Pages → 创建 Worker
2. 粘贴约 25 行 JavaScript 代码
3. 保存部署，获取 `xxx.workers.dev` 地址
4. 将地址填入 `PPYH_WORKER_URL`

## 响应格式

拼一拼盒 API 返回格式：
```json
{
  "code": "200",
  "message": "成功",
  "data": {
    "amount": 1221.00,
    "unitPrice": 1.221
  }
}
```

`amount` 字段为 qty 个盒子的总价。

## 失败处理

- API 调用失败 → 静默回退到费率表
- 不显示错误弹窗，只在控制台输出警告
- 费率表保持当前 ratio 调整逻辑

## 边界条件

- 仅 q≥1000 时调用拼一拼盒 API
- 仅材质为白卡纸/银卡纸时调用（瓦楞纸等走费率表）
- q≤500 时走俊茂丰 API（已有逻辑，不变）
- 500<q<1000 时走费率表（已有逻辑，不变）
