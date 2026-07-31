// 拼一拼盒自动采样脚本
// 目标：批量采样报价，逆向拟合离线定价模型
// 策略：串行请求 + 节流 ≥2s（上游有 403 请勿频繁操作 限流）+ 403 指数退避
// 数据：直连上游 api-client.qchezuo.cn（node 可直连，不经 Worker 减少限流层）
// 输出：docs/ppyh-samples.json（增量保存，可断点续跑）

import { getPpyhSpuDetail } from './test-ppyh.mjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = join(__dirname, 'docs', 'ppyh-samples.json');
mkdirSync(dirname(OUT_FILE), { recursive: true });

const UPSTREAM = 'https://api-client.qchezuo.cn/cbm-service/buyer/render/spu-detail';
const AUTH = 'e76eb7565cc68344b2714b2fb7e759c8573326753c6367d4eb5c18fe72a18c62';
const APP_ID = '1674015465824976901';
const SPU_ID = '1780563650248048641';

const HEADERS = {
  'Content-Type': 'application/json;charset=UTF-8',
  'Authorization': AUTH,
  'X-APP-ID': APP_ID,
  'Referer': 'https://servicewechat.com/wx3a0305d291f9a769/10/page-frame.html',
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.75(0x18004b2b) NetType/WIFI Language/zh_CN',
};

const THROTTLE_MS = 2000;   // 请求间隔
const RETRY_BASE = 5000;    // 403 退避基数

// ── 采样参数 ──
// 材质: 白卡纸 / 银卡纸
// 克重: 350/375/400/425
// 表面: 白卡纸 → 过哑膜/过光膜; 银卡纸 → 过+UV哑油
// 数量: 1000/2000/3000/5000/10000
// 尺寸: 展开尺寸 (含出血)

const GRID = [
  // 阶段1: 固定尺寸 320×314 全组合 (qty=1000)
  ...['白卡纸'].flatMap(m => [350, 375, 400, 425].flatMap(w =>
    ['过哑膜', '过光膜'].map(s => ({ w: 320, h: 314, qty: 1000, m, weight: w, s })))),
  ...['银卡纸'].flatMap(m => [350, 375, 400, 425].map(w =>
    ({ w: 320, h: 314, qty: 1000, m, weight: w, s: '过+UV哑油' }))),

  // 阶段2: 数量阶梯 (固定 320×314, 代表性组合)
  ...[
    { m: '白卡纸', weight: 400, s: '过哑膜' },
    { m: '白卡纸', weight: 350, s: '过哑膜' },
    { m: '银卡纸', weight: 375, s: '过+UV哑油' },
    { m: '银卡纸', weight: 425, s: '过+UV哑油' },
  ].flatMap(c => [1000, 2000, 3000, 5000, 10000, 20000].map(qty =>
    ({ w: 320, h: 314, qty, m: c.m, weight: c.weight, s: c.s }))),

  // 阶段3: 尺寸阶梯 (固定 白卡400 哑胶 qty=1000, 观察 usedCount 拼版数与面积关系)
  ...[
    { w: 150, h: 100 }, { w: 200, h: 150 }, { w: 300, h: 250 },
    { w: 400, h: 300 }, { w: 500, h: 400 }, { w: 600, h: 500 },
  ].map(d => ({ w: d.w, h: d.h, qty: 1000, m: '白卡纸', weight: 400, s: '过哑膜' })),

  // 阶段4: 费率曲线断点探测 (白卡400 哑胶 @320x314)
  ...[1500, 2500, 4000, 6000, 7500, 8000, 12000, 15000].map(qty =>
    ({ w: 320, h: 314, qty, m: '白卡纸', weight: 400, s: '过哑膜' })),

  // 阶段5: 最低价地板是否随数量缩放 (小盒 150x100 @ 白卡400 哑胶)
  ...[2000, 5000, 10000].map(qty =>
    ({ w: 150, h: 100, qty, m: '白卡纸', weight: 400, s: '过哑膜' })),

  // 阶段6: 其他克重的数量阶梯确认 (qty=2000/5000 对照 350 阶梯假设)
  ...[
    { m: '白卡纸', weight: 375, s: '过哑膜' },
    { m: '白卡纸', weight: 425, s: '过哑膜' },
    { m: '银卡纸', weight: 350, s: '过+UV哑油' },
    { m: '银卡纸', weight: 400, s: '过+UV哑油' },
  ].flatMap(c => [2000, 5000].map(qty =>
    ({ w: 320, h: 314, qty, m: c.m, weight: c.weight, s: c.s }))),

  // 阶段7: 补齐其余费率族的中间断点 (320x314)
  ...[
    { m: '白卡纸', weight: 350, s: '过哑膜' },
    { m: '银卡纸', weight: 375, s: '过+UV哑油' },
    { m: '银卡纸', weight: 425, s: '过+UV哑油' },
  ].flatMap(c => [1500, 2500, 4000, 6000, 7500, 8000, 12000, 15000].map(qty =>
    ({ w: 320, h: 314, qty, m: c.m, weight: c.weight, s: c.s }))),

  // 阶段8: 地板随数量精确阶梯 (150x100, 白卡400 哑胶)
  ...[1500, 3000, 7500].map(qty =>
    ({ w: 150, h: 100, qty, m: '白卡纸', weight: 400, s: '过哑膜' })),

  // 阶段9: 银卡地板是否不同 + 地板与尺寸关系 (150x100 银卡375)
  ...[1000, 2000, 5000].map(qty =>
    ({ w: 150, h: 100, qty, m: '银卡纸', weight: 375, s: '过+UV哑油' })),
  ...[1000, 2000, 5000].map(qty =>
    ({ w: 200, h: 150, qty, m: '白卡纸', weight: 400, s: '过哑膜' })),

  // 阶段10: 白卡350 与 银卡425 的地板 (150x100)
  ...[
    { m: '白卡纸', weight: 350, s: '过哑膜' },
    { m: '银卡纸', weight: 425, s: '过+UV哑油' },
  ].flatMap(c => [1000, 2000, 5000, 10000].map(qty =>
    ({ w: 150, h: 100, qty, m: c.m, weight: c.weight, s: c.s }))),
];

function buildBody(w, h, qty, material, weight, surface) {
  return JSON.stringify({
    basic: false,
    spuId: SPU_ID,
    operateRenderSpuSpecList: [{
      spuSpecId: '1791024650889723904',
      instanceIndex: 1,
      operateType: 3,
      value: w + 'x' + h
    }],
    spuDetail: getPpyhSpuDetail(w, h, qty, material, weight, surface)
  });
}

function sampleKey(item) {
  return `${item.m}_${item.weight}_${item.s}_${item.qty}_${item.w}x${item.h}`;
}

async function fetchWithRetry(body) {
  let attempts = 0;
  for (;;) {
    attempts++;
    try {
      const resp = await fetch(UPSTREAM, { method: 'POST', headers: HEADERS, body, signal: AbortSignal.timeout(25000) });
      const text = await resp.text();
      let j; try { j = JSON.parse(text); } catch { j = null; }
      // 限流: 403 请勿频繁操作
      if (resp.status === 403 || (j && j.message && /频繁/.test(j.message))) {
        const wait = RETRY_BASE * Math.pow(2, attempts - 1);
        console.log(`  [403 限流] 第${attempts}次, 退避 ${wait}ms`);
        await sleep(wait + Math.random() * 2000);
        continue;
      }
      return j;
    } catch (e) {
      if (attempts >= 3) throw e;
      console.log(`  网络错误(${e.message}), 重试 ${attempts}/3`);
      await sleep(RETRY_BASE * attempts);
    }
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function extractQuote(j) {
  if (!j || !j.result || !j.result.spuQuote) return null;
  const q = j.result.spuQuote;
  return {
    amount: q.amount, price: q.price, count: q.count,
    measures: (q.measureStandardQuoteList || []).map(m => ({
      l: m.lengthStandard, w: m.wideStandard, used: m.usedCount, amt: m.amount
    }))
  };
}

// 加载已有样本（断点续跑）
let samples = [];
if (existsSync(OUT_FILE)) {
  try { samples = JSON.parse(readFileSync(OUT_FILE, 'utf8')); } catch { samples = []; }
  console.log(`已加载 ${samples.length} 条历史样本`);
}
const done = new Set(samples.map(s => s.key));

let lastReq = 0;
async function run() {
  let ok = 0, fail = 0;
  for (const item of GRID) {
    const key = sampleKey(item);
    if (done.has(key)) { console.log(`跳过(已有): ${key}`); continue; }
    const wait = Math.max(0, THROTTLE_MS - (Date.now() - lastReq));
    if (wait > 0) await sleep(wait);
    lastReq = Date.now();
    process.stdout.write(`采样 ${key} ... `);
    try {
      const j = await fetchWithRetry(buildBody(item.w, item.h, item.qty, item.m, item.weight, item.s));
      const q = extractQuote(j);
      if (q) {
        samples.push({ key, ...item, ...q, ts: new Date().toISOString() });
        writeFileSync(OUT_FILE, JSON.stringify(samples, null, 2), 'utf8');
        ok++;
        console.log(`→ amount=${q.amount} (measures: ${q.measures.map(m => `${m.l}x${m.w}=${m.used}张`).join(', ')})`);
      } else {
        fail++;
        console.log(`→ 无报价! code=${j && j.code} msg=${(j && j.message || '').toString().slice(0, 80)}`);
      }
    } catch (e) {
      fail++;
      console.log(`→ 失败: ${e.message}`);
    }
  }
  console.log(`\n完成: 成功 ${ok}, 失败 ${fail}, 总样本 ${samples.length}`);
  console.log(`保存至: ${OUT_FILE}`);
}

run();
