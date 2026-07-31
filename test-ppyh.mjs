// 拼一拼盒新域名测试脚本
// 测试: 现有请求体格式(operateRenderSpuSpecList) 与 抓包格式(operateRenderSpuSpecOptValueList)
// 对照样本: 白卡纸400g 过哑膜 320x314 qty=1000 → 期望 ¥462

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

// 从 index.html 复制的 spuDetail 构建器
function getPpyhSpuDetail(unfoldedW, unfoldedH, qty, material, weight, surface) {
  var isSilver = material === '银卡纸';
  var paperTypeMap = { '白卡纸': { id: '1776224993986873102', name: '铜版纸' }, '银卡纸': { id: '1776224993986873103', name: '银卡纸' } };
  var paperTypeId = paperTypeMap[material] ? paperTypeMap[material].id : '1776224993986873102';
  var paperTypeName = paperTypeMap[material] ? paperTypeMap[material].name : '铜版纸';
  var grammageMap = { 350: { id: '1776224993986875003', name: '350' }, 400: { id: '1776224993986875005', name: '400' }, 375: { id: '1776224993986875004', name: '375' }, 425: { id: '1776224993986875006', name: '425' } };
  var grammageId = grammageMap[weight] ? grammageMap[weight].id : '1776224993986875003';
  var surfaceMap = isSilver
    ? { '过+UV哑油': { id: '1776224993986876600', name: '过油UV' } }
    : { '过哑膜': { id: '1776224993986876401', name: '哑胶' }, '过光膜': { id: '1776224993986876402', name: '光胶' } };
  var surfaceId = surfaceMap[surface] ? surfaceMap[surface].id : (isSilver ? '1776224993986876600' : '1776224993986876401');
  var surfaceName = surfaceMap[surface] ? surfaceMap[surface].name : (isSilver ? '过油UV' : '哑胶');
  var unfoldedVal = unfoldedW + 'x' + unfoldedH;

  return {
    id: SPU_ID, name: '卡纸盒', quantity: qty,
    picList: [{ id: '1901449495984472064', type: 1, url: 'https://fn-emall-prod.oss-accelerate.aliyuncs.com/images/663c81f3055a56294e0931d1.png', sortNo: 0 }],
    categoryList: [{ id: '1776220322752757760', name: '彩盒' }],
    spuSpecList: [
      { id: '1791024650629677056', spuId: SPU_ID, parentId: null, bizMetaAttrId: '1776224993986872000', type: 1, displayName: '纸张标准尺寸', valueMethod: null, minQuantity: 0, maxQuantity: 1, uiComponent: 'hidden', value: null, checked: true, instanceIndex: 1, pricingCalculatorId: null, childSpuSpecList: [], optValueList: [
        { spuSpecId: '1791024650629677056', bizMetaAttrId: '1776224993986872001', displayName: '正度(680x980mm)', instanceIndex: 1, checked: false, value: null },
        { spuSpecId: '1791024650629677056', bizMetaAttrId: '1776224993986872002', displayName: '大度对开(787x545mm)', instanceIndex: 1, checked: false, value: null },
        { spuSpecId: '1791024650629677056', bizMetaAttrId: '1776224993986872003', displayName: '特度对开(889x595mm)', instanceIndex: 1, checked: false, value: null }
      ]},
      { id: '1791024650721951744', spuId: SPU_ID, parentId: null, bizMetaAttrId: '1776224993986873000', type: 2, displayName: '纸张材质', valueMethod: null, minQuantity: 1, maxQuantity: 1, uiComponent: 'group', value: null, checked: true, instanceIndex: 1, pricingCalculatorId: null, childSpuSpecList: [
        { id: '1791024650759700480', spuId: SPU_ID, parentId: '1791024650721951744', bizMetaAttrId: '1776224993986873100', type: 1, displayName: '纸类', valueMethod: null, minQuantity: 1, maxQuantity: 1, uiComponent: 'button_radio', value: null, checked: true, instanceIndex: 1, pricingCalculatorId: '8', childSpuSpecList: [], optValueList: [
          { spuSpecId: '1791024650759700480', bizMetaAttrId: '1776224993986873102', displayName: '铜版纸', instanceIndex: 1, checked: material === '白卡纸', value: null },
          { spuSpecId: '1791024650759700480', bizMetaAttrId: '1776224993986873103', displayName: '银卡纸', instanceIndex: 1, checked: isSilver, value: null }
        ]},
        { id: '1791024650818420736', spuId: SPU_ID, parentId: '1791024650721951744', bizMetaAttrId: '1776224993986875000', type: 1, displayName: '克重', valueMethod: null, minQuantity: 1, maxQuantity: 1, uiComponent: 'button_radio', value: null, checked: true, instanceIndex: 1, pricingCalculatorId: '8', childSpuSpecList: [], optValueList: [
          { spuSpecId: '1791024650818420736', bizMetaAttrId: '1776224993986875003', displayName: '350', instanceIndex: 1, checked: weight === 350, value: null },
          { spuSpecId: '1791024650818420736', bizMetaAttrId: '1776224993986875004', displayName: '375', instanceIndex: 1, checked: weight === 375, value: null },
          { spuSpecId: '1791024650818420736', bizMetaAttrId: '1776224993986875005', displayName: '400', instanceIndex: 1, checked: weight === 400, value: null },
          { spuSpecId: '1791024650818420736', bizMetaAttrId: '1776224993986875006', displayName: '425', instanceIndex: 1, checked: weight === 425, value: null }
        ]}
      ], optValueList: []},
      { id: '1791024650889723904', spuId: SPU_ID, parentId: null, bizMetaAttrId: '1776224993986871000', type: 1, displayName: '展开尺寸', valueMethod: null, minQuantity: 1, maxQuantity: 1, uiComponent: 'size_2d', value: unfoldedVal, checked: true, instanceIndex: 1, pricingCalculatorId: '7', childSpuSpecList: [], optValueList: [] },
      { id: '1791024650923278336', spuId: SPU_ID, parentId: null, bizMetaAttrId: '1776224993986874000', type: 2, displayName: '纸张表面', valueMethod: null, minQuantity: 1, maxQuantity: 1, uiComponent: 'linkage', value: null, checked: true, instanceIndex: 1, pricingCalculatorId: null, childSpuSpecList: [
        { id: '1791024650948444160', spuId: SPU_ID, parentId: '1791024650923278336', bizMetaAttrId: '1776224993986874001', type: 2, displayName: '正面', valueMethod: null, minQuantity: 1, maxQuantity: 1, uiComponent: 'group', value: null, checked: true, instanceIndex: 1, pricingCalculatorId: null, childSpuSpecList: [
          { id: '1791024650969415680', spuId: SPU_ID, parentId: '1791024650948444160', bizMetaAttrId: '1776224993986876100', type: 2, displayName: '正面印刷', valueMethod: null, minQuantity: 1, maxQuantity: 1, uiComponent: 'group', value: null, checked: true, instanceIndex: 1, pricingCalculatorId: null, childSpuSpecList: [
            { id: '1791024650994581504', spuId: SPU_ID, parentId: '1791024650969415680', bizMetaAttrId: '1776224993986876101', type: 1, displayName: '印刷', valueMethod: null, minQuantity: 1, maxQuantity: 1, uiComponent: 'button_radio', value: null, checked: true, instanceIndex: 1, pricingCalculatorId: '8', childSpuSpecList: [], optValueList: [
              { spuSpecId: '1791024650994581504', bizMetaAttrId: '1776224993986876111', displayName: '四色(CMYK)', instanceIndex: 1, checked: !isSilver, value: null },
              { spuSpecId: '1791024650994581504', bizMetaAttrId: '1776224993986876113', displayName: 'UV四色(CMYK)', instanceIndex: 1, checked: isSilver, value: null }
            ]},
            { id: '1791024651061690368', spuId: SPU_ID, parentId: '1791024650969415680', bizMetaAttrId: '1776224993986876102', type: 1, displayName: '专色', valueMethod: null, minQuantity: 0, maxQuantity: 2, uiComponent: 'select_num_input', value: '0', checked: true, instanceIndex: 1, pricingCalculatorId: '2', childSpuSpecList: [], optValueList: [] },
            { id: '1791024651132993536', spuId: SPU_ID, parentId: '1791024650969415680', bizMetaAttrId: '1776224993986876200', type: 1, displayName: '黑墨', valueMethod: null, minQuantity: 0, maxQuantity: 2, uiComponent: 'button_radio', value: null, checked: true, instanceIndex: 1, pricingCalculatorId: null, childSpuSpecList: [], optValueList: [] }
          ], optValueList: [] },
          { id: '1791024651179130880', spuId: SPU_ID, parentId: '1791024650948444160', bizMetaAttrId: '1776224993986876000', type: 1, displayName: '表面', valueMethod: null, minQuantity: 1, maxQuantity: 1, uiComponent: 'button_radio', value: null, checked: true, instanceIndex: 1, pricingCalculatorId: '8', childSpuSpecList: [], optValueList: [
            { spuSpecId: '1791024651179130880', bizMetaAttrId: '1776224993986876401', displayName: '哑胶', instanceIndex: 1, checked: surface === '过哑膜', value: null },
            { spuSpecId: '1791024651179130880', bizMetaAttrId: '1776224993986876402', displayName: '光胶', instanceIndex: 1, checked: surface === '过光膜', value: null },
            { spuSpecId: '1791024651179130880', bizMetaAttrId: '1776224993986876600', displayName: '过油UV', instanceIndex: 1, checked: surface === '过+UV哑油', value: null }
          ]},
          { id: '1791024651258822656', spuId: SPU_ID, parentId: '1791024650948444160', bizMetaAttrId: '1776224993986877000', type: 2, displayName: '后', valueMethod: null, minQuantity: 1, maxQuantity: 1, uiComponent: 'linkage', value: null, checked: true, instanceIndex: 1, pricingCalculatorId: null, childSpuSpecList: [
            { id: '1791024651279794176', spuId: SPU_ID, parentId: '1791024651258822656', bizMetaAttrId: '1776224993986877100', type: 2, displayName: '粘胶', valueMethod: null, minQuantity: 0, maxQuantity: 2, uiComponent: 'group', value: null, checked: false, instanceIndex: 1, pricingCalculatorId: '3', childSpuSpecList: [], optValueList: [] },
            { id: '1791024651506286592', spuId: SPU_ID, parentId: '1791024651258822656', bizMetaAttrId: '1776224993986877300', type: 2, displayName: '击凸', valueMethod: null, minQuantity: 0, maxQuantity: 1, uiComponent: 'group', value: null, checked: false, instanceIndex: 1, pricingCalculatorId: '3', childSpuSpecList: [], optValueList: [{ spuSpecId: '1791024651506286592', bizMetaAttrId: '1776224993986877300', displayName: '击凸', instanceIndex: 1, checked: false, value: null }] },
            { id: '1791024651590172672', spuId: SPU_ID, parentId: '1791024651258822656', bizMetaAttrId: '1776224993986877400', type: 2, displayName: '压纹', valueMethod: null, minQuantity: 0, maxQuantity: 1, uiComponent: 'group', value: null, checked: false, instanceIndex: 1, pricingCalculatorId: '3', childSpuSpecList: [], optValueList: [{ spuSpecId: '1791024651590172672', bizMetaAttrId: '1776224993986877400', displayName: '压纹', instanceIndex: 1, checked: false, value: null }] },
            { id: '1791024651669864448', spuId: SPU_ID, parentId: '1791024651258822656', bizMetaAttrId: '1776224993986877200', type: 2, displayName: '局部UV', valueMethod: null, minQuantity: 0, maxQuantity: 1, uiComponent: 'group', value: null, checked: false, instanceIndex: 1, pricingCalculatorId: '3', childSpuSpecList: [], optValueList: [] }
          ], optValueList: [] }
        ], optValueList: [] },
        { id: '1791024651728584704', spuId: SPU_ID, parentId: '1791024650923278336', bizMetaAttrId: '1776224993986874002', type: 2, displayName: '反面', valueMethod: null, minQuantity: 0, maxQuantity: 1, uiComponent: 'group', value: null, checked: false, instanceIndex: 1, pricingCalculatorId: null, childSpuSpecList: [], optValueList: [] }
      ], optValueList: [] },
      { id: '1791024652500336640', spuId: SPU_ID, parentId: null, bizMetaAttrId: '1776224993986878001', type: 1, displayName: '裱', valueMethod: null, minQuantity: 1, maxQuantity: 1, uiComponent: 'hidden', value: null, checked: true, instanceIndex: 1, pricingCalculatorId: '8', childSpuSpecList: [], optValueList: [{ spuSpecId: '1791024652500336640', bizMetaAttrId: '1776224993986878001', displayName: '裱', instanceIndex: 1, checked: true, value: null }] },
      { id: '1826911385884295168', spuId: SPU_ID, parentId: null, bizMetaAttrId: '1776224993986878003', type: 2, displayName: '后道', valueMethod: null, minQuantity: 1, maxQuantity: 1, uiComponent: 'linkage', value: null, checked: true, instanceIndex: 1, pricingCalculatorId: null, childSpuSpecList: [{ id: '1826912584649932800', spuId: SPU_ID, parentId: '1826911385884295168', bizMetaAttrId: '1776224993986878003', type: 2, displayName: '后道', valueMethod: null, minQuantity: 0, maxQuantity: 1, uiComponent: 'group', value: null, checked: false, instanceIndex: 1, pricingCalculatorId: null, childSpuSpecList: [], optValueList: [] }], optValueList: [] },
      { id: '1791024652638748672', spuId: SPU_ID, parentId: null, bizMetaAttrId: '1776224993986878007', type: 2, displayName: '预涂', valueMethod: null, minQuantity: 0, maxQuantity: 1, uiComponent: 'group', value: null, checked: true, instanceIndex: 1, pricingCalculatorId: '3', childSpuSpecList: [], optValueList: [{ spuSpecId: '1791024652638748672', bizMetaAttrId: '1776224993986878007', displayName: '预涂', instanceIndex: 1, checked: false, value: null }] },
      { id: '1791024652693274624', spuId: SPU_ID, parentId: null, bizMetaAttrId: '1776224993986878005', type: 1, displayName: '粘', valueMethod: null, minQuantity: 1, maxQuantity: 1, uiComponent: 'hidden', value: null, checked: true, instanceIndex: 1, pricingCalculatorId: '8', childSpuSpecList: [], optValueList: [{ spuSpecId: '1791024652693274624', bizMetaAttrId: '1776224993986878005', displayName: '粘', instanceIndex: 1, checked: true, value: null }] },
      { id: '1827248317285793792', spuId: SPU_ID, parentId: null, bizMetaAttrId: null, type: 1, displayName: '工艺', valueMethod: null, minQuantity: 1, maxQuantity: 1, uiComponent: 'button_radio', value: null, checked: true, instanceIndex: 1, pricingCalculatorId: '3', childSpuSpecList: [], optValueList: [
        { spuSpecId: '1827248317285793792', bizMetaAttrId: '1827248623960719360', displayName: '专版印刷', instanceIndex: 1, checked: true, value: null },
        { spuSpecId: '1827248317285793792', bizMetaAttrId: '1776224993986879001', displayName: '数码打样', instanceIndex: 1, checked: false, value: null }
      ]}
    ]
  };
}

// 格式A: 现有 index.html 格式 (operateRenderSpuSpecList)
function bodyFormatA(w, h, qty, material, weight, surface) {
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

// 格式B: 抓包格式 (operateRenderSpuSpecOptValueList) - 操作克重选项
function bodyFormatB(w, h, qty, material, weight, surface) {
  var grammageMap = { 350: '1776224993986875003', 400: '1776224993986875005', 375: '1776224993986875004', 425: '1776224993986875006' };
  var gmId = grammageMap[weight] || '1776224993986875003';
  return JSON.stringify({
    basic: false,
    spuId: SPU_ID,
    operateRenderSpuSpecOptValueList: [{
      spuSpecId: '1791024650818420736',
      bizMetaAttrId: gmId,
      displayName: String(weight),
      instanceIndex: 1,
      checked: true,
      value: null,
      operateType: 1
    }],
    spuDetail: getPpyhSpuDetail(w, h, qty, material, weight, surface)
  });
}

async function test(name, body) {
  try {
    const resp = await fetch(UPSTREAM, { method: 'POST', headers: HEADERS, body });
    const text = await resp.text();
    let data; try { data = JSON.parse(text); } catch { data = text.slice(0, 300); }
    let amount = null, price = null;
    if (data && data.result && data.result.spuQuote) {
      amount = data.result.spuQuote.amount;
      price = data.result.spuQuote.price;
    }
    console.log(`\n=== ${name} ===`);
    console.log('HTTP', resp.status);
    console.log('spuQuote:', amount !== null ? JSON.stringify(data.result.spuQuote) : '(none)');
    if (data.code && data.code !== '200') console.log('code:', data.code, 'message:', data.message);
    if (amount === null && !data.result) console.log('raw:', text.slice(0, 400));
  } catch (e) {
    console.log(`\n=== ${name} === FAILED: ${e.message}`);
  }
}

// 对照样本: 白卡纸400g 过哑膜 320x314 qty=1000 → 期望 ¥462
export { getPpyhSpuDetail };

// 仅直接运行时执行测试（被 import 时不触发，避免污染采样脚本的限流配额）
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
  (async () => {
    await test('A1 现有格式: 白卡纸400g 过哑膜 320x314 x1000 (期望462)', bodyFormatA(320, 314, 1000, '白卡纸', 400, '过哑膜'));
    await test('B1 抓包格式: 白卡纸400g 过哑膜 320x314 x1000 (期望462)', bodyFormatB(320, 314, 1000, '白卡纸', 400, '过哑膜'));
    await test('B2 抓包格式: 银卡纸375g 过+UV哑油 320x314 x1000 (期望693)', bodyFormatB(320, 314, 1000, '银卡纸', 375, '过+UV哑油'));
  })();
}
