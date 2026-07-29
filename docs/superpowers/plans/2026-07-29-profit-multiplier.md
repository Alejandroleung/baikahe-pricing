# 比例计算器（报价倍率）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有报价结果卡片中新增倍率控件，自动计算报价和利润率

**Architecture:** 单页 HTML 应用，全部修改集中在 `index.html`。新增 CSS（复用现有玻璃态变量）、HTML（倍率控件+报价展示区）、JS（`S.multiplier` 状态+事件绑定+`calcPrice()` 扩展）。不破坏现有定价计算逻辑。

**Tech Stack:** 纯 HTML/CSS/JS，零外部依赖

## 全局约束

- 仅修改 `index.html` 一个文件
- 遵循现有 Glassmorphism 视觉风格（`--card-bg`, `backdrop-filter`, `--primary`, `--accent` 等 CSS 变量）
- 不修改现有生产定价计算逻辑（`calcPrice()` 中 `total` 及其上游计算保持不变）
- 倍率范围 1.00~10.00，步进 0.01
- 默认倍率 1.30
- 预设按钮：×1.1、×1.2、×1.3、×1.5、×2.0

---

### Task 1: 新增倍率相关 CSS 样式

**Files:**
- Modify: `index.html` — 在 `</style>` 前插入新样式

**Interfaces:**
- Consumes: 现有 CSS 变量 `--card-bg`, `--primary`, `--accent`, `--text2`, `--text3`, `--radius-sm`, `--border` 等
- Produces: `.multiplier-section`, `.multiplier-presets`, `.multiplier-input`, `.quote-result` 等样式类

- [ ] **Step 1: 在 `</style>` 前插入倍率区样式**

插入位置：第 222 行 `</style>` 之前。

```css
/* ── 报价倍率 ── */
.multiplier-section { margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(37,99,235,0.06); }
.multiplier-section .ms-label { font-size: 12px; font-weight: 600; color: var(--text3); margin-bottom: 8px; letter-spacing: 0.3px; }
.multiplier-presets { display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
.multiplier-presets .mp-btn {
  padding: 5px 14px; border: 1px solid rgba(37,99,235,0.1); border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  background: rgba(255,255,255,0.4); user-select: none; color: var(--text2); backdrop-filter: blur(4px);
  font-family: 'Inter', sans-serif;
}
.multiplier-presets .mp-btn:hover { border-color: var(--primary); color: var(--primary); background: rgba(37,99,235,0.04); }
.multiplier-presets .mp-btn.active { background: var(--primary); color: #fff; border-color: var(--primary); box-shadow: 0 4px 12px rgba(37,99,235,0.2); }
.multiplier-custom { display: flex; align-items: center; gap: 8px; }
.multiplier-custom label { font-size: 12px; color: var(--text3); }
.multiplier-custom input {
  width: 72px; padding: 5px 8px; background: rgba(255,255,255,0.5);
  border: 1px solid rgba(37,99,235,0.1); border-radius: 6px; font-size: 14px;
  text-align: center; color: var(--text); transition: all 0.2s;
  font-family: 'Inter', sans-serif; font-weight: 600;
}
.multiplier-custom input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
.quote-result { margin-top: 12px; padding-top: 14px; border-top: 1px solid rgba(37,99,235,0.08); }
.quote-result .qr-row { display: flex; justify-content: center; gap: 28px; flex-wrap: wrap; }
.quote-result .qr-item { text-align: center; }
.quote-result .qr-item .qr-val { font-size: 24px; font-weight: 800; color: var(--accent); line-height: 1.3; }
.quote-result .qr-item .qr-val.profit-rate { color: #22c55e; }
.quote-result .qr-item .qr-val.profit-rate.high { color: var(--accent); }
.quote-result .qr-item .qr-lbl { font-size: 11px; color: var(--text3); margin-top: 2px; }
@media (max-width: 600px) {
  .quote-result .qr-row { gap: 12px; }
  .quote-result .qr-item .qr-val { font-size: 18px; }
}
```

- [ ] **Step 2: 检验样式语法**

Read lines 1-15 of the style section to confirm no syntax error.

---

### Task 2: 添加倍率控件的 HTML

**Files:**
- Modify: `index.html` — 在 `.price-result` 卡片内、纸重信息之前插入

**Interfaces:**
- Consumes: `.price-result` 内部已存在的 `.breakdown` 和 `.weight-info`
- Produces: 倍率控件 HTML 结构

- [ ] **Step 1: 在纸重信息之前插入倍率控件 HTML**

插入位置：第 361 行（`.freight-item` 的 `</div>` 之后、第 362 行 `.weight-info` 之前）。

```html
    <div class="multiplier-section anim-fade-up">
      <div class="ms-label">📐 报价倍率</div>
      <div class="multiplier-presets" id="multiplierPresets">
        <button class="mp-btn" data-value="1.10">×1.1</button>
        <button class="mp-btn" data-value="1.20">×1.2</button>
        <button class="mp-btn active" data-value="1.30">×1.3</button>
        <button class="mp-btn" data-value="1.50">×1.5</button>
        <button class="mp-btn" data-value="2.00">×2.0</button>
      </div>
      <div class="multiplier-custom">
        <label>自定义：</label>
        <input type="number" id="multiplierInput" min="1.00" max="10.00" step="0.01" value="1.30">
        <span style="font-size:12px;color:var(--text3);">倍</span>
      </div>
      <div class="quote-result" id="quoteResult">
        <div class="qr-row">
          <div class="qr-item">
            <div class="qr-val" id="quotePrice">¥0.00</div>
            <div class="qr-lbl">报价总价</div>
          </div>
          <div class="qr-item">
            <div class="qr-val profit-rate" id="profitRate">0%</div>
            <div class="qr-lbl">利润率</div>
          </div>
          <div class="qr-item">
            <div class="qr-val" id="profitAmount">¥0.00</div>
            <div class="qr-lbl">利润</div>
          </div>
          <div class="qr-item">
            <div class="qr-val" id="quoteUnitPrice">¥0.00</div>
            <div class="qr-lbl">报价单价/个</div>
          </div>
        </div>
      </div>
    </div>
```

- [ ] **Step 2: 验证 HTML 结构完整性**

确认 `<div class="multiplier-section">` 被正确放置在 `.breakdown` 闭合标签之后、`.weight-info` 之前。

---

### Task 3: 添加倍率状态和事件绑定

**Files:**
- Modify: `index.html` — 在 `<script>` 内的状态初始化区和事件绑定区

**Interfaces:**
- Consumes: `S` 状态对象已有字段
- Produces: `S.multiplier` 状态字段，`setupMultiplier()` 函数

- [ ] **Step 1: 在 `S` 对象初始化中添加 `multiplier` 字段**

位置：第 391 行，在 `S` 对象末尾添加 `multiplier:1.30`。

```js
// 修改前：
var S={boxType:'double-tuck',material:'白卡纸',weight:350,surface:'过哑膜',print:'四色',length:0,width:0,height:0,quantity:0,spotColor:0};
// 修改后：
var S={boxType:'double-tuck',material:'白卡纸',weight:350,surface:'过哑膜',print:'四色',length:0,width:0,height:0,quantity:0,spotColor:0,multiplier:1.30};
```

- [ ] **Step 2: 添加 `setupMultiplier()` 函数**

位置：在 `function setupIn()` 函数定义之后（约第 527 行）。

```js
function setupMultiplier(){
  // 预设按钮
  document.getElementById('multiplierPresets').addEventListener('click',function(e){
    var btn=e.target.closest('.mp-btn');
    if(!btn)return;
    var v=parseFloat(btn.dataset.value);
    S.multiplier=v;
    // 同步 UI
    document.querySelectorAll('.mp-btn').forEach(function(b){b.classList.remove('active');});
    btn.classList.add('active');
    document.getElementById('multiplierInput').value=v.toFixed(2);
    calcPrice();
  });
  // 自定义输入
  document.getElementById('multiplierInput').addEventListener('input',function(e){
    var v=parseFloat(e.target.value)||1.00;
    if(v<1.00)v=1.00;
    if(v>10.00)v=10.00;
    S.multiplier=v;
    // 同步预设按钮状态
    document.querySelectorAll('.mp-btn').forEach(function(b){
      var bv=parseFloat(b.dataset.value);
      b.classList.toggle('active',Math.abs(bv-v)<0.005);
    });
    calcPrice();
  });
}
```

- [ ] **Step 3: 在页面初始化调用中添加 `setupMultiplier()`**

位置：第 1051 行，在 `setupIn();` 之后、`syncOptions();` 之前添加 `setupMultiplier();`。

```js
// 修改前：
renderBoxCards();setupOG('materialGroup','material');setupOG('weightGroup','weight');setupOG('surfaceGroup','surface');setupOG('printGroup','print');setupCG();setupIn();syncOptions();initAddress();calcPrice();
// 修改后：
renderBoxCards();setupOG('materialGroup','material');setupOG('weightGroup','weight');setupOG('surfaceGroup','surface');setupOG('printGroup','print');setupCG();setupIn();setupMultiplier();syncOptions();initAddress();calcPrice();
```

---

### Task 4: 扩展 `calcPrice()` 计算报价和利润率

**Files:**
- Modify: `index.html` — `calcPrice()` 函数末尾

**Interfaces:**
- Consumes: `S.multiplier`, `total`（成本价）, `q`（数量）
- Produces: 报价、利润率、报价单价的计算结果写入 DOM

- [ ] **Step 1: 在 `calcPrice()` 末尾、纸重展示之后插入倍率计算**

位置：第 934 行 `swEl.textContent = '0g';` 的闭合 `}` 之后，插入新逻辑。实际插入点在纸重展示逻辑之后、展开尺寸更新之前（第 935 行之后）。

```js
  // ── 报价倍率计算 ──
  var multiplier = S.multiplier || 1.00;
  var costPrice = total;
  var quotePrice = costPrice * multiplier;
  var profit = quotePrice - costPrice;
  var profitRate = quotePrice > 0 ? (profit / quotePrice) * 100 : 0;
  var quoteUnit = q > 0 ? quotePrice / q : 0;

  // 更新报价区域
  var qpEl = document.getElementById('quotePrice');
  var prEl = document.getElementById('profitRate');
  var paEl = document.getElementById('profitAmount');
  var quEl = document.getElementById('quoteUnitPrice');
  var hide = S.material === '银卡纸' && q < 1000;
  if (hide || !total || total <= 0) {
    qpEl.textContent = '¥0.00';
    prEl.textContent = '0%';
    paEl.textContent = '¥0.00';
    quEl.textContent = '¥0.00';
  } else {
    qpEl.textContent = '¥' + quotePrice.toFixed(2);
    prEl.textContent = profitRate.toFixed(2) + '%';
    // 利润率颜色：<15%红色，15-30%绿色，>30%橙色
    prEl.className = 'qr-val profit-rate' + (profitRate < 15 ? '' : profitRate <= 30 ? '' : ' high');
    paEl.textContent = '¥' + profit.toFixed(2);
    quEl.textContent = '¥' + quoteUnit.toFixed(2);
  }
```

- [ ] **Step 2: 修改成本价标签为"成本价"**

将第 355 行的 `报价信息` 改为更清晰的展示。同时给总价加一个"成本价"标注。

修改第 355-356 行：
```html
    <div class="label" id="priceLabel">双插盒 报价信息</div>
    <div class="price"><small>¥</small><span id="totalPrice">0.00</span></div>
```
改为：
```html
    <div class="label" id="priceLabel">双插盒 报价信息</div>
    <div class="price"><small>¥</small><span id="totalPrice">0.00</span></div>
    <div class="unit" style="font-size:11px;color:var(--text3);margin-top:-4px;margin-bottom:4px;">成本价</div>
```

---

### Task 5: 验证实现

- [ ] **Step 1: 检查 LSP 诊断**

运行 `lsp_diagnostics` 检查 `index.html` 是否有语法错误。

- [ ] **Step 2: 功能验证清单**
  - 页面加载后显示默认倍率 1.30，报价=成本×1.30
  - 点击预设按钮（×1.1~×2.0），报价和利润率实时更新
  - 手动输入自定义倍率（如 1.45），报价更新且利润率正确
  - 修改盒型/尺寸/数量等参数，倍率保持，报价重新计算
  - 利润率显示正确：利润/报价×100%
  - 利润率颜色：<15%默认色，≥30%变为橙色强调色
  - 银卡纸<1000个的隐藏逻辑不影响成本价显示
  - 倍率输入范围限制（1.00~10.00）

- [ ] **Step 3: 提交**

```bash
git add index.html docs/superpowers/specs/2026-07-29-profit-multiplier-design.md docs/superpowers/plans/2026-07-29-profit-multiplier.md
git commit -m "feat: add profit multiplier calculator with quote price and margin display"
```
