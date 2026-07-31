// 拼一拼盒离线定价模型生成器 v2
// 输入: docs/ppyh-samples.json (97 条样本)
// 模型: amount = max(round(rate(family,qty) × area_m2 × qty), floor(family,qty))
//  - rate: 材质族 × 数量断点阶梯 (断点: 1000/1500/2500/4000/5000/6000/7500/10000, 封底后不变)
//       查找规则: 取 <= qty 的最大断点的费率 (qty<1000 用 1000 档, qty>10000 用 10000 档)
//  - floor: 材质族 × 数量 最低价 (小盒地板, 与尺寸无关, 分段线性插值)
// 输出: ppyh-model.js (可嵌入 index.html 的离线回退模型) + 验证报告

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const samples = JSON.parse(readFileSync(join(__dirname, 'docs', 'ppyh-samples.json'), 'utf8'));

const AREA_REF = 320 * 314 / 1e6; // 0.10048 m²
const QTY_BREAKS = [1000, 1500, 2500, 4000, 5000, 6000, 7500, 10000];

// ── 1. 从 320×314 大尺寸样本推导各材质克重的费率曲线 ──
const big = samples.filter(s => s.w === 320 && s.h === 314 && s.qty >= 1000);
function rateOf(s) { return s.amount / (AREA_REF * s.qty); }

const byMw = new Map();
for (const s of big) {
  const k = `${s.m}_${s.weight}`;
  if (!byMw.has(k)) byMw.set(k, []);
  byMw.get(k).push(s);
}

// 按费率曲线一致性合并材质克重 → 族
const families = []; // { members:[m_weight], points:[{qty,rate}] }
const memberOf = new Map(); // m_weight -> family index

for (const [k, arr] of byMw) {
  arr.sort((a, b) => a.qty - b.qty);
  const pts = arr.map(s => ({ qty: s.qty, rate: rateOf(s) }));
  let matched = -1;
  for (let fi = 0; fi < families.length; fi++) {
    const fp = families[fi].points;
    const qs = new Set([...fp.map(p => p.qty), ...pts.map(p => p.qty)]);
    let same = true;
    for (const q of qs) {
      const r1 = fp.find(p => p.qty === q);
      const r2 = pts.find(p => p.qty === q);
      if (r1 && r2 && Math.abs(r1.rate - r2.rate) / r2.rate > 0.005) { same = false; break; }
    }
    if (same) { matched = fi; break; }
  }
  if (matched >= 0) {
    const f = families[matched];
    f.members.push(k);
    for (const p of pts) if (!f.points.find(x => x.qty === p.qty)) f.points.push(p);
    memberOf.set(k, matched);
  } else {
    families.push({ members: [k], points: pts });
    memberOf.set(k, families.length - 1);
  }
}
families.forEach(f => f.points.sort((a, b) => a.qty - b.qty));

// ── 2. 构建费率阶梯表: 归整到 2 位小数, 断点处费率 = 该断点档位费率 ──
function buildRateTable(points) {
  const table = [];
  for (const b of QTY_BREAKS) {
    const exact = points.find(p => p.qty === b);
    const nearest = [...points].reverse().find(p => p.qty <= b);
    const r = exact ? exact.rate : (nearest ? nearest.rate : null);
    if (r !== null) table.push({ qty: b, rate: Math.round(r * 100) / 100 });
  }
  return table;
}

function familyName(members) {
  const m = members[0].split('_')[0];
  const ws = members.map(x => x.split('_')[1]).sort((a, b) => a - b);
  return `${m} ${ws.join('/')}g`;
}

// ── 3. 地板表: 地板生效 ⇒ 实际费率显著高于该 qty 档费率 (被地板抬升) ──
// 判定: effRate > rateTable(qty) × 1.1 且小尺寸 → 地板主导; 地板只依赖 (family, qty)
function rateAt(table, qty) {
  let r = table[0].rate;
  for (const t of table) { if (qty >= t.qty) r = t.rate; else break; }
  return r;
}

const floorPts = new Map();
for (const s of samples) {
  const fi = memberOf.get(`${s.m}_${s.weight}`);
  if (fi === undefined) continue;
  const table = buildRateTable(families[fi].points);
  const effRate = s.amount / ((s.w * s.h / 1e6) * s.qty);
  const refRate = rateAt(table, s.qty);
  if (s.w * s.h <= 320 * 314 && effRate > refRate * 1.1) {
    if (!floorPts.has(fi)) floorPts.set(fi, []);
    const list = floorPts.get(fi);
    const ex = list.find(p => p.qty === s.qty);
    if (ex) ex.floor = Math.max(ex.floor, s.amount);
    else list.push({ qty: s.qty, floor: s.amount });
  }
}
for (const list of floorPts.values()) list.sort((a, b) => a.qty - b.qty);

// ── 4. 预测: 地板分段线性插值 ──
function floorAt(list, qty) {
  if (!list || !list.length) return 0;
  if (qty <= list[0].qty) return list[0].floor;
  if (qty >= list[list.length - 1].qty) return list[list.length - 1].floor;
  for (let i = 0; i < list.length - 1; i++) {
    const a = list[i], b = list[i + 1];
    if (qty >= a.qty && qty <= b.qty) {
      const t = (qty - a.qty) / (b.qty - a.qty);
      return Math.round(a.floor + t * (b.floor - a.floor));
    }
  }
  return list[0].floor;
}

function predict(s) {
  const fi = memberOf.get(`${s.m}_${s.weight}`);
  if (fi === undefined) return null;
  const table = buildRateTable(families[fi].points);
  const rate = rateAt(table, s.qty);
  const area = s.w * s.h / 1e6;
  const linear = Math.round(rate * area * s.qty);
  const floor = floorAt(floorPts.get(fi), s.qty);
  return Math.max(linear, floor);
}

// ── 5. 全量验证 ──
let maxErr = 0, sumErr = 0;
const errors = [];
for (const s of samples) {
  const pred = predict(s);
  if (pred === null) { errors.push({ key: s.key, err: '未映射族' }); continue; }
  const err = Math.abs(pred - s.amount);
  maxErr = Math.max(maxErr, err);
  sumErr += err;
  if (err !== 0) errors.push({ key: s.key, actual: s.amount, pred, err });
}
const exact = samples.length - errors.length;

console.log('=== 费率族 ===');
families.forEach((f, i) => {
  console.log(`[族${i}] ${familyName(f.members)}`);
  console.log('  费率表:', buildRateTable(f.points).map(t => `${t.qty}:${t.rate}`).join('  '));
  const fl = floorPts.get(i);
  console.log('  地板表:', fl ? fl.map(t => `${t.qty}:${t.floor}`).join('  ') : '(无)');
});
console.log('\n=== 验证 ===');
console.log(`总样本 ${samples.length}, 完全命中 ${exact}, 有误差 ${errors.length}`);
console.log(`最大误差 ¥${maxErr}, 平均误差 ¥${(sumErr / samples.length).toFixed(2)}`);
if (errors.length) {
  console.log('\n误差明细 (前 20):');
  for (const e of errors.slice(0, 20)) {
    console.log(`  ${e.key}: actual=${e.actual} pred=${e.pred} err=${e.err}`);
  }
}

// ── 6. 输出 ppyh-model.js ──
const model = {
  qtyBreaks: QTY_BREAKS,
  families: families.map((f, i) => ({
    name: familyName(f.members),
    members: f.members.map(k => k.split('_').map(x => /^\d+$/.test(x) ? +x : x)),
    rateTable: buildRateTable(f.points),
    floorTable: (floorPts.get(i) || []).map(t => ({ qty: t.qty, floor: t.floor })),
  })),
};

const js = `// 拼一拼盒离线定价模型 (由 generate-model.mjs 从 ${samples.length} 条样本生成, 勿手改)
// amount = max(round(rate(family,qty) × 面积m² × qty), floor(family,qty))
const PPYH_MODEL = ${JSON.stringify(model, null, 2)};

function ppyhModelPrice(m, weight, qty, w, h) {
  const fam = PPYH_MODEL.families.find(f =>
    f.members.some(mm => mm[0] === m && mm[1] === weight));
  if (!fam) return null;
  const area = (w * h) / 1e6;
  let rate = fam.rateTable[0].rate;
  for (const t of fam.rateTable) { if (qty >= t.qty) rate = t.rate; else break; }
  const linear = Math.round(rate * area * qty);
  let floor = 0;
  if (fam.floorTable.length) {
    const ft = fam.floorTable;
    if (qty <= ft[0].qty) floor = ft[0].floor;
    else if (qty >= ft[ft.length - 1].qty) floor = ft[ft.length - 1].floor;
    else {
      for (let i = 0; i < ft.length - 1; i++) {
        if (qty >= ft[i].qty && qty <= ft[i + 1].qty) {
          const t = (qty - ft[i].qty) / (ft[i + 1].qty - ft[i].qty);
          floor = Math.round(ft[i].floor + t * (ft[i + 1].floor - ft[i].floor));
          break;
        }
      }
    }
  }
  return Math.max(linear, floor);
}
if (typeof module !== 'undefined') module.exports = { PPYH_MODEL, ppyhModelPrice };
`;
writeFileSync(join(__dirname, 'ppyh-model.js'), js, 'utf8');
console.log('\n已输出 ppyh-model.js');
