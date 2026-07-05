// チェックリストの元データです。
// propertyTypes で、物件種別ごとの表示対象を指定します。
const CHECKLIST_DATA = [
  {
    category: "登記関係",
    items: [
      {
        id: "registry-certificate",
        name: "登記事項証明書の取得",
        hint: "土地・建物・区分建物の所在、地番、家屋番号、地目、地積、構造、床面積を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "registry-owner-shares",
        name: "所有者・共有者・持分の確認",
        hint: "売主と登記名義人、共有者、持分割合、相続未登記の有無を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "registry-mortgage",
        name: "抵当権・根抵当権の確認",
        hint: "抹消予定、残債、決済時の抹消手続き、金融機関の確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "registry-seizure-provisional",
        name: "差押・仮差押・仮登記の確認",
        hint: "処分制限、仮登記、買戻特約など引渡しに影響する権利を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "registry-lease-easement",
        name: "賃借権・地上権・地役権の確認",
        hint: "借地権、通行地役権、送電線地役権、敷地利用権など利用制限を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "registry-public-map",
        name: "公図の取得・筆界の確認",
        hint: "対象地の位置、隣接地、道路、水路、筆の形状を確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "registry-survey-boundary",
        name: "地積測量図・確定測量・境界確認書",
        hint: "地積測量図、確定測量図、境界確認書、地積更正登記の要否を確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "registry-building-drawing",
        name: "建物図面・各階平面図の確認",
        hint: "登記建物の配置、床面積、増築部分、現況との相違を確認",
        propertyTypes: ["戸建"]
      },
      {
        id: "registry-unregistered-building",
        name: "未登記建物・附属建物の確認",
        hint: "物置、車庫、増築部分など未登記建物の有無と取扱いを確認",
        propertyTypes: ["戸建"]
      },
      {
        id: "registry-condo-rights",
        name: "敷地権・専有部分の登記確認",
        hint: "敷地権割合、専有部分の床面積、共用部分との関係を確認",
        propertyTypes: ["マンション"]
      }
    ]
  },
  {
    category: "都市計画・法令制限",
    items: [
      {
        id: "planning-area",
        name: "都市計画区域・市街化区域等",
        hint: "都市計画区域、市街化区域、市街化調整区域、非線引区域を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "planning-zoning",
        name: "用途地域",
        hint: "用途地域、建築可能用途、用途制限、特別用途地区を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "planning-coverage-ratio",
        name: "建ぺい率・容積率",
        hint: "指定建ぺい率、指定容積率、前面道路幅員による容積率制限を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "planning-fire-zone",
        name: "防火地域・準防火地域",
        hint: "防火・準防火の指定、建築時の構造制限を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "planning-height-district",
        name: "高度地区・高さ制限",
        hint: "高度地区、斜線制限、日影規制、絶対高さ制限を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "planning-landscape",
        name: "景観計画・屋外広告物規制",
        hint: "景観区域、届出要否、色彩・高さ・広告物の制限を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "planning-district-plan",
        name: "地区計画・建築協定",
        hint: "地区計画、建築協定、まちづくり条例など独自制限を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "planning-fill-regulation",
        name: "宅地造成及び特定盛土等規制法",
        hint: "規制区域、許可・届出、擁壁や盛土履歴の確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "planning-development-permit",
        name: "開発許可・造成履歴",
        hint: "開発許可、検査済証、開発登録簿、造成工事の履歴を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "planning-cultural-property",
        name: "埋蔵文化財包蔵地",
        hint: "包蔵地該当、試掘・届出・工事制限の要否を確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "planning-agricultural-land",
        name: "農地法・生産緑地",
        hint: "地目が農地の場合の許可、届出、生産緑地指定の有無を確認",
        propertyTypes: ["土地"]
      }
    ]
  },
  {
    category: "道路・接道",
    items: [
      {
        id: "road-type",
        name: "前面道路の種別",
        hint: "建築基準法上の道路種別、道路法道路、位置指定道路、私道を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "road-width",
        name: "道路幅員",
        hint: "現況幅員、指定幅員、道路台帳、役所調査結果を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "road-frontage",
        name: "接道間口・接道義務",
        hint: "接道長さ、敷地の間口、2m接道の充足を確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "road-setback",
        name: "セットバックの有無",
        hint: "2項道路、後退距離、後退部分の面積、整備状況を確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "road-private-burden",
        name: "私道負担",
        hint: "私道持分、負担面積、通行利用、維持管理負担を確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "road-consent",
        name: "通行承諾・掘削承諾",
        hint: "私道所有者の承諾、上下水道・ガス工事時の掘削承諾を確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "road-boundary",
        name: "道路境界・官民境界",
        hint: "道路境界確定、境界標、道路査定図、境界未確定の有無を確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "road-encroachment",
        name: "道路内占用物・越境物",
        hint: "塀、階段、植栽、配管、看板など道路への越境・占用を確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "road-rebuildability",
        name: "再建築可否",
        hint: "接道条件、路地状敷地、但し書き道路、再建築時の制限を確認",
        propertyTypes: ["土地", "戸建"]
      }
    ]
  },
  {
    category: "ライフライン",
    items: [
      {
        id: "utility-water-main",
        name: "上水道の前面道路配管",
        hint: "前面道路の配水管有無、管種、口径、管理者を確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "utility-water-service-line",
        name: "上水道の敷地内引込",
        hint: "引込管、メーター、口径、引込位置、共同管の有無を確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "utility-sewer-main",
        name: "下水道の前面道路配管",
        hint: "公共下水、合流・分流、汚水・雨水管の有無を確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "utility-sewer-usage",
        name: "下水道・浄化槽の利用状況",
        hint: "公共下水接続、浄化槽、汲取り、排水先を確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "utility-gas",
        name: "都市ガス・プロパンガス",
        hint: "ガス種別、前面配管、引込管、メーター、供給会社を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "utility-electricity",
        name: "電気設備",
        hint: "引込方法、容量、電柱、支線、越境配線、共用設備を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "utility-private-shared-pipes",
        name: "私設管・共同管",
        hint: "私設水道管、共同排水管、維持管理者、利用承諾を確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "utility-crossing-pipes",
        name: "越境配管・他人地通過配管",
        hint: "水道、下水、ガス管が隣地や私道を通過していないか確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "utility-connection-cost",
        name: "引込工事・負担金の有無",
        hint: "新規引込、増径、接続替え、加入金、工事負担金を確認",
        propertyTypes: ["土地", "戸建"]
      }
    ]
  },
  {
    category: "ハザード",
    items: [
      {
        id: "hazard-flood",
        name: "洪水ハザード",
        hint: "洪水浸水想定区域、想定浸水深、家屋倒壊等氾濫想定区域を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "hazard-inland-water",
        name: "内水ハザード",
        hint: "雨水排水能力を超える浸水、過去の内水被害情報を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "hazard-storm-surge",
        name: "高潮ハザード",
        hint: "高潮浸水想定区域、想定浸水深、避難情報を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "hazard-tsunami",
        name: "津波ハザード",
        hint: "津波災害警戒区域、津波浸水想定、避難対象区域を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "hazard-landslide",
        name: "土砂災害警戒区域",
        hint: "土砂災害警戒区域、特別警戒区域、区域種別を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "hazard-steep-slope",
        name: "急傾斜地・地すべり・砂防指定",
        hint: "急傾斜地崩壊危険区域、地すべり防止区域、砂防指定地を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "hazard-liquefaction",
        name: "液状化リスク",
        hint: "自治体公表資料、地盤情報、埋立地・旧河道の該当を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "hazard-history",
        name: "過去の浸水・災害履歴",
        hint: "自治体資料、売主ヒアリング、近隣情報で過去被害を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "hazard-evacuation",
        name: "避難場所・避難経路",
        hint: "指定緊急避難場所、避難所、避難経路、周辺高低差を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      }
    ]
  },
  {
    category: "現地確認",
    items: [
      {
        id: "site-boundary-markers",
        name: "境界標の有無",
        hint: "境界杭、鋲、プレート、境界標の欠損・不明箇所を確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "site-encroachments",
        name: "越境物",
        hint: "塀、フェンス、庇、雨樋、樹木、配管、室外機の越境を確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "site-retaining-wall",
        name: "擁壁・ブロック塀",
        hint: "高さ、ひび割れ、傾き、水抜き穴、建築基準法適合性を確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "site-elevation-drainage",
        name: "高低差・排水状況",
        hint: "敷地内外の高低差、雨水排水、隣地への流入・流出を確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "site-utility-poles",
        name: "電柱・支線・電線",
        hint: "敷地内電柱、支線、上空越境、移設可否や費用負担を確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "site-leftover-structures",
        name: "残置物・工作物",
        hint: "物置、庭石、井戸、浄化槽、古い配管、残置設備を確認",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "house-building-permit-inspection",
        name: "建築確認済証・検査済証",
        hint: "確認済証、検査済証、台帳記載事項証明、建築計画概要書を確認",
        propertyTypes: ["戸建"]
      },
      {
        id: "house-renovation-history",
        name: "増改築履歴・未登記部分",
        hint: "増築、用途変更、リフォーム、未登記部分、登記との相違を確認",
        propertyTypes: ["戸建"]
      },
      {
        id: "house-condition-survey",
        name: "雨漏り・シロアリ・建物状況調査",
        hint: "雨漏り、白蟻被害、建物状況調査、インスペクション実施状況を確認",
        propertyTypes: ["戸建"]
      },
      {
        id: "site-surroundings",
        name: "周辺環境・嫌悪施設",
        hint: "騒音、臭気、振動、墓地、工場、線路、交通量、近隣状況を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      }
    ]
  },
  {
    category: "重説記載時の注意点",
    items: [
      {
        id: "disclosure-source-record",
        name: "調査資料の出典記録",
        hint: "役所、法務局、管理会社、現地、売主など確認先と確認日を記録",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "disclosure-open-issues",
        name: "未確定事項・追加確認事項",
        hint: "調査継続中の事項、確認期限、買主への説明方法を整理",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "disclosure-legal-restrictions",
        name: "法令制限の記載漏れ確認",
        hint: "用途地域、建ぺい率、容積率、地区計画、条例などを転記確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "disclosure-road-private-burden",
        name: "道路・私道負担の記載確認",
        hint: "道路種別、幅員、接道、セットバック、私道負担、承諾事項を整理",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "disclosure-utilities",
        name: "ライフラインの記載確認",
        hint: "上水、下水、ガス、電気、私設管、越境配管、負担金を整理",
        propertyTypes: ["土地", "戸建"]
      },
      {
        id: "disclosure-hazard",
        name: "ハザード情報の記載確認",
        hint: "水害、土砂災害、津波、高潮、液状化など公表資料を確認",
        propertyTypes: ["土地", "戸建", "マンション"]
      },
      {
        id: "mansion-rules-bylaws",
        name: "管理規約・使用細則",
        hint: "管理規約、使用細則、専有部分の利用制限、改定予定を確認",
        propertyTypes: ["マンション"]
      },
      {
        id: "mansion-management-report",
        name: "重要事項調査報告書の取得",
        hint: "管理会社から重要事項調査報告書を取得し、管理状況を確認",
        propertyTypes: ["マンション"]
      },
      {
        id: "mansion-fees-arrears",
        name: "管理費・修繕積立金・滞納",
        hint: "月額、改定予定、滞納、専用使用料、修繕積立基金を確認",
        propertyTypes: ["マンション"]
      },
      {
        id: "mansion-repair-plan-history",
        name: "長期修繕計画・大規模修繕履歴",
        hint: "長期修繕計画、修繕積立金の見通し、過去の大規模修繕を確認",
        propertyTypes: ["マンション"]
      },
      {
        id: "mansion-exclusive-common-use",
        name: "専有部分・共用部分・専用使用権",
        hint: "専有部分、共用部分、バルコニー、専用庭、トランクルーム等を確認",
        propertyTypes: ["マンション"]
      },
      {
        id: "mansion-use-restrictions",
        name: "マンション使用制限",
        hint: "ペット、駐車場、駐輪場、バイク置場、事務所利用、民泊利用を確認",
        propertyTypes: ["マンション"]
      }
    ]
  }
];
