// 拼一拼盒离线定价模型 (由 generate-model.mjs 从 97 条样本生成, 勿手改)
// amount = max(round(rate(family,qty) × 面积m² × qty), floor(family,qty))
const PPYH_MODEL = {
  "qtyBreaks": [
    1000,
    1500,
    2500,
    4000,
    5000,
    6000,
    7500,
    10000
  ],
  "families": [
    {
      "name": "白卡纸 350/375/425g",
      "members": [
        [
          "白卡纸",
          350
        ],
        [
          "白卡纸",
          375
        ],
        [
          "白卡纸",
          425
        ]
      ],
      "rateTable": [
        {
          "qty": 1000,
          "rate": 3.9
        },
        {
          "qty": 1500,
          "rate": 3.7
        },
        {
          "qty": 2500,
          "rate": 3.5
        },
        {
          "qty": 4000,
          "rate": 3.3
        },
        {
          "qty": 5000,
          "rate": 2.9
        },
        {
          "qty": 6000,
          "rate": 2.8
        },
        {
          "qty": 7500,
          "rate": 2.8
        },
        {
          "qty": 10000,
          "rate": 2.7
        }
      ],
      "floorTable": [
        {
          "qty": 1000,
          "floor": 160
        },
        {
          "qty": 2000,
          "floor": 260
        },
        {
          "qty": 5000,
          "floor": 550
        },
        {
          "qty": 10000,
          "floor": 650
        }
      ]
    },
    {
      "name": "白卡纸 400g",
      "members": [
        [
          "白卡纸",
          400
        ]
      ],
      "rateTable": [
        {
          "qty": 1000,
          "rate": 4.6
        },
        {
          "qty": 1500,
          "rate": 4.2
        },
        {
          "qty": 2500,
          "rate": 4
        },
        {
          "qty": 4000,
          "rate": 3.8
        },
        {
          "qty": 5000,
          "rate": 3.5
        },
        {
          "qty": 6000,
          "rate": 3.4
        },
        {
          "qty": 7500,
          "rate": 3.2
        },
        {
          "qty": 10000,
          "rate": 3.1
        }
      ],
      "floorTable": [
        {
          "qty": 1000,
          "floor": 300
        },
        {
          "qty": 1500,
          "floor": 450
        },
        {
          "qty": 2000,
          "floor": 450
        },
        {
          "qty": 3000,
          "floor": 580
        },
        {
          "qty": 5000,
          "floor": 800
        },
        {
          "qty": 7500,
          "floor": 860
        },
        {
          "qty": 10000,
          "floor": 900
        }
      ]
    },
    {
      "name": "银卡纸 350/375/400g",
      "members": [
        [
          "银卡纸",
          350
        ],
        [
          "银卡纸",
          375
        ],
        [
          "银卡纸",
          400
        ]
      ],
      "rateTable": [
        {
          "qty": 1000,
          "rate": 6.9
        },
        {
          "qty": 1500,
          "rate": 5.9
        },
        {
          "qty": 2500,
          "rate": 4.9
        },
        {
          "qty": 4000,
          "rate": 4.5
        },
        {
          "qty": 5000,
          "rate": 3.9
        },
        {
          "qty": 6000,
          "rate": 3.8
        },
        {
          "qty": 7500,
          "rate": 3.6
        },
        {
          "qty": 10000,
          "rate": 3.3
        }
      ],
      "floorTable": [
        {
          "qty": 1000,
          "floor": 350
        },
        {
          "qty": 2000,
          "floor": 560
        },
        {
          "qty": 5000,
          "floor": 950
        }
      ]
    },
    {
      "name": "银卡纸 425g",
      "members": [
        [
          "银卡纸",
          425
        ]
      ],
      "rateTable": [
        {
          "qty": 1000,
          "rate": 7.3
        },
        {
          "qty": 1500,
          "rate": 6.2
        },
        {
          "qty": 2500,
          "rate": 5.3
        },
        {
          "qty": 4000,
          "rate": 4.8
        },
        {
          "qty": 5000,
          "rate": 4.3
        },
        {
          "qty": 6000,
          "rate": 4.1
        },
        {
          "qty": 7500,
          "rate": 3.8
        },
        {
          "qty": 10000,
          "rate": 3.6
        }
      ],
      "floorTable": [
        {
          "qty": 1000,
          "floor": 500
        },
        {
          "qty": 2000,
          "floor": 680
        },
        {
          "qty": 5000,
          "floor": 1280
        },
        {
          "qty": 10000,
          "floor": 1680
        }
      ]
    }
  ]
};

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
