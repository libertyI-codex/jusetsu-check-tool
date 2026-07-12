const STATUS_OPTIONS = ["未確認", "確認中", "確認済", "対象外"];
const PROPERTY_TYPES = ["土地", "戸建", "マンション"];
const SCHEMA_VERSION = 2;
const STORAGE_KEY = "jusetsuResearchToolV1";
const YEN_PER_MAN = 10000;
const ALLOWED_ROUNDING_UNITS = [10000, 100000, 500000, 1000000];

// 価格査定の入力値は、面積は㎡または坪、路線価は千円/㎡、坪単価は万円/坪で保存します。
const DEFAULT_ADJUSTMENTS = [
  { id: "corner-lot", name: "角地" },
  { id: "south-road", name: "南道路" },
  { id: "two-roads", name: "二方路" },
  { id: "regular-shape", name: "整形地" },
  { id: "flagpole-lot", name: "旗竿地" },
  { id: "narrow-frontage", name: "間口狭小" },
  { id: "height-difference", name: "高低差" },
  { id: "retaining-wall", name: "擁壁" },
  { id: "setback", name: "セットバック" },
  { id: "non-rebuildable", name: "再建築不可" },
  { id: "private-road-burden", name: "私道負担" },
  { id: "flood-zone", name: "浸水想定区域" },
  { id: "landslide-zone", name: "土砂災害警戒区域" },
  { id: "city-planning-road", name: "都市計画道路" },
  { id: "other", name: "その他" }
];

const checklistContainer = document.getElementById("checklistContainer");
const uncheckedList = document.getElementById("uncheckedList");
const inProgressList = document.getElementById("inProgressList");
const importantList = document.getElementById("importantList");
const resetButton = document.getElementById("resetButton");
const exportBackupButton = document.getElementById("exportBackupButton");
const importBackupFile = document.getElementById("importBackupFile");
const importBackupButton = document.getElementById("importBackupButton");
const backupMessage = document.getElementById("backupMessage");
const tabButtons = document.querySelectorAll(".tab-button");
const appViews = document.querySelectorAll(".app-view");
const valuationUnsupportedMessage = document.getElementById("valuationUnsupportedMessage");
const valuationForm = document.getElementById("valuationForm");
const adjustmentContainer = document.getElementById("adjustmentContainer");
const valuationUpdatedAt = document.getElementById("valuationUpdatedAt");
const generateCalculationMemoButton = document.getElementById("generateCalculationMemoButton");
const saveAppraisalButton = document.getElementById("saveAppraisalButton");
const appraisalHistoryList = document.getElementById("appraisalHistoryList");

const propertyInputs = {
  address: document.getElementById("propertyAddress"),
  lotNumber: document.getElementById("propertyLotNumber"),
  type: document.getElementById("propertyType")
};

const valuationInputs = {
  landAreaSqm: document.getElementById("landAreaSqm"),
  landAreaTsubo: document.getElementById("landAreaTsubo"),
  routeValueThousandYen: document.getElementById("routeValueThousandYen"),
  routeValueSymbol: document.getElementById("routeValueSymbol"),
  routeValueYear: document.getElementById("routeValueYear"),
  routeValueMultiplier: document.getElementById("routeValueMultiplier"),
  routeValueMemo: document.getElementById("routeValueMemo"),
  initialUnitPricePerTsubo: document.getElementById("initialUnitPricePerTsubo"),
  originalReferenceUnitPricePerTsubo: document.getElementById("originalReferenceUnitPricePerTsubo"),
  initialUnitPriceReason: document.getElementById("initialUnitPriceReason"),
  quickSaleFactor: document.getElementById("quickSaleFactor"),
  listingFactor: document.getElementById("listingFactor"),
  roundingUnit: document.getElementById("roundingUnit"),
  calculationMemo: document.getElementById("calculationMemo"),
  appraisalDate: document.getElementById("appraisalDate")
};

const valuationOutputs = {
  routeValueDisplay: document.getElementById("routeValueDisplay"),
  routeValueYenPerSqm: document.getElementById("routeValueYenPerSqm"),
  routeReferenceYenPerSqm: document.getElementById("routeReferenceYenPerSqm"),
  routeReferenceYenPerTsubo: document.getElementById("routeReferenceYenPerTsubo"),
  routeReferenceTotalYen: document.getElementById("routeReferenceTotalYen"),
  autoReferenceUnitPrice: document.getElementById("autoReferenceUnitPrice"),
  userInitialUnitPriceDisplay: document.getElementById("userInitialUnitPriceDisplay"),
  initialUnitPricePerSqmDisplay: document.getElementById("initialUnitPricePerSqmDisplay"),
  adjustmentAppliedList: document.getElementById("adjustmentAppliedList"),
  adjustmentTotalRate: document.getElementById("adjustmentTotalRate"),
  adjustedUnitPricePerTsuboDisplay: document.getElementById("adjustedUnitPricePerTsuboDisplay"),
  adjustmentWarning: document.getElementById("adjustmentWarning"),
  valuationErrorList: document.getElementById("valuationErrorList"),
  basePriceYen: document.getElementById("basePriceYen"),
  adjustedPriceYen: document.getElementById("adjustedPriceYen"),
  centerPriceYen: document.getElementById("centerPriceYen"),
  quickSalePriceYen: document.getElementById("quickSalePriceYen"),
  listingPriceYen: document.getElementById("listingPriceYen")
};

const VALUATION_NUMBER_FIELDS = new Set([
  "landAreaSqm", "landAreaTsubo", "routeValueThousandYen", "routeValueYear",
  "routeValueMultiplier", "initialUnitPricePerTsubo", "originalReferenceUnitPricePerTsubo",
  "quickSaleFactor", "listingFactor", "roundingUnit"
]);
const VALUATION_DERIVED_NUMBER_FIELDS = [
  "referenceUnitPricePerSqmYen", "referenceUnitPricePerTsuboYen", "referenceTotalPriceYen",
  "adjustmentTotalPercent", "adjustedUnitPricePerTsubo", "basePriceYen", "adjustedPriceYen",
  "centerPriceYen", "quickSalePriceYen", "listingPriceYen"
];

let appState = createInitialState();
let isSyncingLandArea = false;

loadState();
renderChecklist();
renderSummary();
renderAdjustments();
updateValuationInputs();
updateValuationAvailability();
updateValuationCalculations();
renderAppraisalHistory();

Object.entries(propertyInputs).forEach(([key, input]) => {
  const eventName = input.tagName === "SELECT" ? "change" : "input";
  input.addEventListener(eventName, () => {
    appState.property[key] = input.value;
    saveState();
    if (key === "type") {
      renderChecklist();
      renderSummary();
      updateValuationAvailability();
      updateValuationCalculations();
    }
  });
});

Object.entries(valuationInputs).forEach(([key, input]) => {
  if (!input) return;
  const eventName = input.tagName === "SELECT" ? "change" : "input";
  input.addEventListener(eventName, () => {
    if (key === "landAreaSqm" || key === "landAreaTsubo") {
      handleLandAreaInput(key, input.value);
      return;
    }
    updateValuationField(key, getInputValue(key, input));
  });
});

if (generateCalculationMemoButton) {
  generateCalculationMemoButton.addEventListener("click", handleGenerateCalculationMemo);
}

if (saveAppraisalButton) {
  saveAppraisalButton.addEventListener("click", handleSaveAppraisal);
}

if (appraisalHistoryList) {
  appraisalHistoryList.addEventListener("click", handleAppraisalHistoryClick);
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveView(button.dataset.view));
});

if (adjustmentContainer) {
  adjustmentContainer.addEventListener("input", handleAdjustmentInput);
  adjustmentContainer.addEventListener("change", handleAdjustmentInput);
}
if (exportBackupButton) exportBackupButton.addEventListener("click", exportBackupData);
if (importBackupButton) importBackupButton.addEventListener("click", importBackupData);
if (importBackupFile) importBackupFile.addEventListener("change", () => setBackupMessage("", ""));

resetButton.addEventListener("click", () => {
  if (!window.confirm("入力内容をすべてリセットします。よろしいですか？")) return;
  const preservedAppraisals = Array.isArray(appState.appraisals) ? appState.appraisals : [];
  appState = createInitialState();
  appState.appraisals = preservedAppraisals;
  saveState();
  updatePropertyInputs();
  renderChecklist();
  renderSummary();
  renderAdjustments();
  updateValuationInputs();
  updateValuationAvailability();
  updateValuationCalculations();
  renderAppraisalHistory();
});
function createInitialState() {
  const items = {};
  CHECKLIST_DATA.forEach((category) => {
    category.items.forEach((item) => {
      items[getItemId(category.category, item)] = getDefaultItemState();
    });
  });
  return {
    schemaVersion: SCHEMA_VERSION,
    property: { address: "", lotNumber: "", type: "土地" },
    items,
    valuation: createDefaultValuation(),
    appraisals: []
  };
}

function createDefaultValuation() {
  return {
    landAreaSqm: "",
    landAreaTsubo: "",
    routeValueThousandYen: "",
    routeValueSymbol: "",
    routeValueYear: "",
    routeValueMultiplier: 1.25,
    routeValueMemo: "",
    initialUnitPricePerTsubo: "",
    originalReferenceUnitPricePerTsubo: "",
    initialUnitPriceReason: "",
    adjustments: createDefaultAdjustments(),
    quickSaleFactor: 0.95,
    listingFactor: 1.05,
    roundingUnit: 100000,
    calculationMemo: "",
    appraisalDate: "",
    updatedAt: "",
    referenceUnitPricePerSqmYen: null,
    referenceUnitPricePerTsuboYen: null,
    referenceTotalPriceYen: null,
    adjustmentTotalPercent: null,
    adjustedUnitPricePerTsubo: null,
    basePriceYen: null,
    adjustedPriceYen: null,
    centerPriceYen: null,
    quickSalePriceYen: null,
    listingPriceYen: null
  };
}

function createDefaultAdjustments() {
  return DEFAULT_ADJUSTMENTS.map((adjustment) => ({
    id: adjustment.id,
    name: adjustment.name,
    enabled: false,
    rate: 0,
    reason: ""
  }));
}

function loadState() {
  const savedText = localStorage.getItem(STORAGE_KEY);
  if (!savedText) {
    updatePropertyInputs();
    return;
  }
  try {
    const savedState = JSON.parse(savedText);
    const validationError = validateBackupData(savedState);
    if (validationError) throw new Error(validationError);
    appState = normalizeSavedState(savedState);
  } catch (error) {
    console.warn("保存データを読み込めませんでした。初期状態で開始します。", error);
  }
  updatePropertyInputs();
}

function saveState() {
  appState.schemaVersion = SCHEMA_VERSION;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function updatePropertyInputs() {
  propertyInputs.address.value = appState.property.address;
  propertyInputs.lotNumber.value = appState.property.lotNumber;
  propertyInputs.type.value = getSelectedPropertyType();
}

function renderChecklist() {
  checklistContainer.innerHTML = "";
  const selectedPropertyType = getSelectedPropertyType();
  CHECKLIST_DATA.forEach((category) => {
    const visibleItems = getVisibleItems(category.items, selectedPropertyType);
    const categoryBlock = document.createElement("section");
    categoryBlock.className = "category-block";
    const categoryTitle = document.createElement("div");
    categoryTitle.className = "category-title";
    categoryTitle.innerHTML = `
      <h3>${escapeHtml(category.category)}</h3>
      <span class="category-count">${visibleItems.length}項目</span>
    `;
    const tableWrap = document.createElement("div");
    tableWrap.className = "checklist-table-wrap";
    const table = document.createElement("table");
    table.className = "checklist-table";
    table.innerHTML = `
      <thead><tr><th>調査項目</th><th>状態</th><th>メモ</th><th>重説反映</th></tr></thead>
    `;
    const tbody = document.createElement("tbody");
    visibleItems.forEach((item) => {
      const itemId = getItemId(category.category, item);
      const itemState = ensureItemState(itemId);
      const row = document.createElement("tr");
      row.appendChild(createItemNameCell(item));
      row.appendChild(createStatusCell(itemId, itemState));
      row.appendChild(createMemoCell(itemId, itemState));
      row.appendChild(createImportantCell(itemId, itemState));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    categoryBlock.appendChild(categoryTitle);
    categoryBlock.appendChild(tableWrap);
    checklistContainer.appendChild(categoryBlock);
  });
}

function createItemNameCell(item) {
  const cell = document.createElement("td");
  cell.className = "item-name";
  cell.innerHTML = `<div>${escapeHtml(item.name)}</div><div class="item-hint">${escapeHtml(item.hint)}</div>`;
  return cell;
}

function createStatusCell(itemId, itemState) {
  const cell = document.createElement("td");
  const select = document.createElement("select");
  select.className = "status-select";
  select.setAttribute("aria-label", "状態");
  STATUS_OPTIONS.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    option.selected = itemState.status === status;
    select.appendChild(option);
  });
  select.addEventListener("change", () => {
    appState.items[itemId].status = select.value;
    saveState();
    renderSummary();
  });
  cell.appendChild(select);
  return cell;
}

function createMemoCell(itemId, itemState) {
  const cell = document.createElement("td");
  const textarea = document.createElement("textarea");
  textarea.value = itemState.memo;
  textarea.placeholder = "確認内容、日付、注意点など";
  textarea.setAttribute("aria-label", "メモ");
  textarea.addEventListener("input", () => {
    appState.items[itemId].memo = textarea.value;
    saveState();
    renderSummary();
  });
  cell.appendChild(textarea);
  return cell;
}

function createImportantCell(itemId, itemState) {
  const cell = document.createElement("td");
  cell.className = "important-checkbox-cell";
  const label = document.createElement("label");
  label.className = "important-checkbox-label";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = itemState.important;
  checkbox.addEventListener("change", () => {
    appState.items[itemId].important = checkbox.checked;
    saveState();
    renderSummary();
  });
  label.appendChild(checkbox);
  label.append("反映");
  cell.appendChild(label);
  return cell;
}

function renderSummary() {
  const uncheckedItems = [];
  const inProgressItems = [];
  const importantItems = [];
  const selectedPropertyType = getSelectedPropertyType();
  CHECKLIST_DATA.forEach((category) => {
    getVisibleItems(category.items, selectedPropertyType).forEach((item) => {
      const itemId = getItemId(category.category, item);
      const itemState = ensureItemState(itemId);
      const summaryItem = { category: category.category, name: item.name, memo: itemState.memo };
      if (itemState.status === "未確認") uncheckedItems.push(summaryItem);
      if (itemState.status === "確認中") inProgressItems.push(summaryItem);
      if (itemState.important) importantItems.push(summaryItem);
    });
  });
  renderSummaryList(uncheckedList, uncheckedItems, "未確認の項目はありません。");
  renderSummaryList(inProgressList, inProgressItems, "確認中の項目はありません。");
  renderSummaryList(importantList, importantItems, "重説反映チェック済みの項目はありません。");
}

function renderSummaryList(listElement, items, emptyText) {
  listElement.innerHTML = "";
  if (items.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "empty-message";
    emptyItem.textContent = emptyText;
    listElement.appendChild(emptyItem);
    return;
  }
  items.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.innerHTML = `
      <span>${escapeHtml(item.name)}</span>
      <div class="summary-category">${escapeHtml(item.category)}</div>
      ${item.memo ? `<div class="summary-memo">${escapeHtml(item.memo)}</div>` : ""}
    `;
    listElement.appendChild(listItem);
  });
}
function renderAdjustments() {
  if (!adjustmentContainer) return;
  adjustmentContainer.innerHTML = "";
  appState.valuation.adjustments.forEach((adjustment) => {
    const card = document.createElement("section");
    card.className = "adjustment-card";
    card.dataset.adjustmentId = adjustment.id;
    const nameControl = adjustment.id === "other"
      ? `<label>補正項目名<input type="text" data-adjustment-field="name" value="${escapeHtml(adjustment.name)}"></label>`
      : `<span class="adjustment-name-text">${escapeHtml(adjustment.name)}</span>`;
    card.innerHTML = `
      <label class="adjustment-enabled">
        <input type="checkbox" data-adjustment-field="enabled" ${adjustment.enabled ? "checked" : ""}>
        適用する
      </label>
      ${nameControl}
      <label>
        補正率（％）
        <input type="number" inputmode="decimal" step="0.01" data-adjustment-field="rate" value="${escapeHtml(adjustment.rate)}">
        <p class="field-error" data-adjustment-error="${escapeHtml(adjustment.id)}"></p>
      </label>
      <label class="wide-field">
        理由メモ
        <textarea data-adjustment-field="reason">${escapeHtml(adjustment.reason)}</textarea>
      </label>
    `;
    adjustmentContainer.appendChild(card);
  });
}

function updateValuationInputs() {
  Object.entries(valuationInputs).forEach(([key, input]) => {
    if (input) input.value = appState.valuation[key] ?? "";
  });
  updateValuationUpdatedAt();
}

function updateValuationAvailability() {
  const isLand = getSelectedPropertyType() === "土地";
  if (valuationUnsupportedMessage) valuationUnsupportedMessage.hidden = isLand;
  if (valuationForm) valuationForm.hidden = !isLand;
}

function handleLandAreaInput(key, rawValue) {
  if (isSyncingLandArea) return;
  const otherKey = key === "landAreaSqm" ? "landAreaTsubo" : "landAreaSqm";
  const engine = getValuationEngine();
  const numberValue = parseOptionalNumber(rawValue);
  appState.valuation[key] = numberValue;

  if (rawValue === "") {
    appState.valuation[otherKey] = "";
    setValuationInputValue(otherKey, "");
    saveValuationAfterChange();
    return;
  }

  if (engine && numberValue !== "" && numberValue > 0) {
    const convertedValue = key === "landAreaSqm" ? engine.sqmToTsubo(numberValue) : engine.tsuboToSqm(numberValue);
    if (convertedValue !== null) {
      const roundedValue = Number(convertedValue.toFixed(2));
      appState.valuation[otherKey] = roundedValue;
      isSyncingLandArea = true;
      setValuationInputValue(otherKey, roundedValue.toFixed(2));
      isSyncingLandArea = false;
    }
  }

  saveValuationAfterChange();
}

function updateValuationField(key, value) {
  appState.valuation[key] = value;
  saveValuationAfterChange();
}

function saveValuationAfterChange() {
  touchValuationUpdatedAt();
  updateValuationUpdatedAt();
  updateValuationCalculations();
  saveState();
}

function handleAdjustmentInput(event) {
  const field = event.target.dataset.adjustmentField;
  if (!field) return;
  const card = event.target.closest(".adjustment-card");
  const adjustmentId = card?.dataset.adjustmentId;
  const adjustment = appState.valuation.adjustments.find((item) => item.id === adjustmentId);
  if (!adjustment) return;

  if (field === "enabled") adjustment.enabled = event.target.checked;
  if (field === "rate") adjustment.rate = parseOptionalNumber(event.target.value);
  if (field === "name" && adjustment.id === "other") adjustment.name = event.target.value;
  if (field === "reason") adjustment.reason = event.target.value;
  saveValuationAfterChange();
}

function updateValuationCalculations(options = {}) {
  const engine = getValuationEngine();
  if (!engine) {
    renderValuationErrors(["価格査定の計算エンジンを読み込めませんでした。"]); 
    clearRouteReferenceDisplay();
    clearUnitPriceDisplay();
    clearAdjustmentSummaryDisplay();
    clearPriceDisplay();
    return;
  }

  const valuation = appState.valuation;
  const routeReference = engine.calculateRouteValueReference({
    routeValueThousandYen: valuation.routeValueThousandYen,
    multiplier: valuation.routeValueMultiplier,
    landAreaSqm: valuation.landAreaSqm
  });
  const adjustmentSummary = engine.calculateAdjustmentTotal(valuation.adjustments);
  const initialUnitPricePerTsuboMan = engine.toFiniteNumber(valuation.initialUnitPricePerTsubo);
  const initialUnitPricePerTsuboYen = initialUnitPricePerTsuboMan !== null && initialUnitPricePerTsuboMan > 0
    ? initialUnitPricePerTsuboMan * YEN_PER_MAN
    : null;
  const adjustedUnitPricePerTsuboYen = adjustmentSummary.invalidAdjustments.length === 0
    ? engine.calculateAdjustedUnitPrice(initialUnitPricePerTsuboYen, adjustmentSummary.totalRatePercent)
    : null;

  maybeAutoFillReferenceUnitPrices(routeReference);
  renderRouteReference(engine, routeReference);
  renderUnitPriceResults(engine, routeReference, initialUnitPricePerTsuboYen);
  renderAdjustmentSummary(engine, adjustmentSummary, adjustedUnitPricePerTsuboYen);
  renderAdjustmentErrors(adjustmentSummary.invalidAdjustments);

  const errors = collectValuationErrors(engine, adjustmentSummary);
  if (errors.length > 0) {
    renderValuationErrors(errors);
    clearPriceDisplay();
    updateDerivedValuation(routeReference, adjustmentSummary, adjustedUnitPricePerTsuboYen, null);
    if (options.shouldSave) saveState();
    return;
  }

  const priceResult = engine.calculateValuationPrices({
    initialUnitPricePerTsuboYen,
    adjustedUnitPricePerTsuboYen,
    landAreaTsubo: valuation.landAreaTsubo,
    quickSaleFactor: valuation.quickSaleFactor,
    listingFactor: valuation.listingFactor,
    roundingUnit: valuation.roundingUnit
  });

  if (priceResult.centerPriceYen === null) {
    renderValuationErrors(["査定価格を計算できませんでした。入力内容を確認してください。"]); 
    clearPriceDisplay();
    updateDerivedValuation(routeReference, adjustmentSummary, adjustedUnitPricePerTsuboYen, null);
    if (options.shouldSave) saveState();
    return;
  }

  renderValuationErrors([]);
  renderPriceResults(engine, priceResult);
  updateDerivedValuation(routeReference, adjustmentSummary, adjustedUnitPricePerTsuboYen, priceResult);
  if (options.shouldSave) saveState();
}

function maybeAutoFillReferenceUnitPrices(routeReference) {
  if (routeReference.referenceYenPerTsubo === null) return;
  const referenceUnitPriceMan = roundToTwo(routeReference.referenceYenPerTsubo / YEN_PER_MAN);
  if (appState.valuation.originalReferenceUnitPricePerTsubo === "") {
    appState.valuation.originalReferenceUnitPricePerTsubo = referenceUnitPriceMan;
    setValuationInputValue("originalReferenceUnitPricePerTsubo", referenceUnitPriceMan);
  }
  if (appState.valuation.initialUnitPricePerTsubo === "") {
    appState.valuation.initialUnitPricePerTsubo = referenceUnitPriceMan;
    setValuationInputValue("initialUnitPricePerTsubo", referenceUnitPriceMan);
  }
}
function collectValuationErrors(engine, adjustmentSummary) {
  const valuation = appState.valuation;
  const errors = [];
  const landAreaSqm = engine.toFiniteNumber(valuation.landAreaSqm);
  const landAreaTsubo = engine.toFiniteNumber(valuation.landAreaTsubo);
  const routeValueThousandYen = engine.toFiniteNumber(valuation.routeValueThousandYen);
  const routeValueMultiplier = engine.toFiniteNumber(valuation.routeValueMultiplier);
  const initialUnitPricePerTsubo = engine.toFiniteNumber(valuation.initialUnitPricePerTsubo);
  const quickSaleFactor = engine.toFiniteNumber(valuation.quickSaleFactor);
  const listingFactor = engine.toFiniteNumber(valuation.listingFactor);
  const roundingUnit = engine.toFiniteNumber(valuation.roundingUnit);

  if (valuation.landAreaTsubo === "" || landAreaTsubo === null) errors.push("土地面積が未入力です。㎡または坪を入力してください。");
  else if (landAreaTsubo <= 0) errors.push("土地面積は0より大きい数値で入力してください。");
  if (valuation.landAreaSqm !== "" && (landAreaSqm === null || landAreaSqm <= 0)) errors.push("土地面積㎡は0より大きい数値で入力してください。");
  if (valuation.routeValueThousandYen !== "" && (routeValueThousandYen === null || routeValueThousandYen <= 0)) errors.push("路線価数値は0より大きい数値で入力してください。未使用の場合は空欄にしてください。");
  if (routeValueMultiplier === null || routeValueMultiplier < 0.5 || routeValueMultiplier > 3) errors.push("路線価倍率は0.50〜3.00の範囲で入力してください。");
  if (valuation.initialUnitPricePerTsubo === "" || initialUnitPricePerTsubo === null) errors.push("初期想定坪単価が未入力です。");
  else if (initialUnitPricePerTsubo <= 0) errors.push("初期想定坪単価は0より大きい数値で入力してください。");
  if (quickSaleFactor === null || quickSaleFactor < 0.7 || quickSaleFactor > 1) errors.push("早期売却係数は0.70〜1.00の範囲で入力してください。");
  if (listingFactor === null || listingFactor < 1 || listingFactor > 1.3) errors.push("売出提案係数は1.00〜1.30の範囲で入力してください。");
  if (!ALLOWED_ROUNDING_UNITS.includes(roundingUnit)) errors.push("丸め単位は1万円、10万円、50万円、100万円のいずれかを選択してください。");
  if (adjustmentSummary.invalidAdjustments.length > 0) errors.push("補正率が数値ではない項目があります。");
  return errors;
}

function renderRouteReference(engine, routeReference) {
  const valuation = appState.valuation;
  const routeValue = engine.toFiniteNumber(valuation.routeValueThousandYen);
  const routeSymbol = typeof valuation.routeValueSymbol === "string" ? valuation.routeValueSymbol.trim() : "";
  setText(valuationOutputs.routeValueDisplay, routeValue === null ? "未入力" : `${routeValue.toLocaleString("ja-JP")}${routeSymbol}`);
  setText(valuationOutputs.routeValueYenPerSqm, formatYenWithUnit(engine, routeReference.routeValueYenPerSqm, "／㎡"));
  setText(valuationOutputs.routeReferenceYenPerSqm, formatYenWithUnit(engine, routeReference.referenceYenPerSqm, "／㎡"));
  setText(valuationOutputs.routeReferenceYenPerTsubo, formatManYenWithUnit(engine, routeReference.referenceYenPerTsubo, "／坪", true));
  setText(valuationOutputs.routeReferenceTotalYen, formatManYenWithUnit(engine, routeReference.referenceTotalYen, "", true));
}

function renderUnitPriceResults(engine, routeReference, initialUnitPricePerTsuboYen) {
  const initialUnitPricePerTsuboMan = engine.toFiniteNumber(appState.valuation.initialUnitPricePerTsubo);
  const initialUnitPricePerSqmYen = initialUnitPricePerTsuboYen === null ? null : initialUnitPricePerTsuboYen / engine.constants.SQM_PER_TSUBO;
  setText(valuationOutputs.autoReferenceUnitPrice, formatManYenWithUnit(engine, routeReference.referenceYenPerTsubo, "／坪", true));
  setText(valuationOutputs.userInitialUnitPriceDisplay, initialUnitPricePerTsuboMan === null ? "-" : `${initialUnitPricePerTsuboMan.toLocaleString("ja-JP")}万円／坪`);
  setText(valuationOutputs.initialUnitPricePerSqmDisplay, formatManYenWithUnit(engine, initialUnitPricePerSqmYen, "／㎡", true));
}

function renderAdjustmentSummary(engine, adjustmentSummary, adjustedUnitPricePerTsuboYen) {
  const appliedText = adjustmentSummary.appliedAdjustments.length === 0
    ? "適用補正なし"
    : adjustmentSummary.appliedAdjustments.map((adjustment) => `${adjustment.name} ${formatSignedRate(adjustment.rate)}`).join("、");
  setText(valuationOutputs.adjustmentAppliedList, appliedText);
  setText(valuationOutputs.adjustmentTotalRate, formatSignedRate(adjustmentSummary.totalRatePercent));
  setText(valuationOutputs.adjustedUnitPricePerTsuboDisplay, formatManYenWithUnit(engine, adjustedUnitPricePerTsuboYen, "／坪", true));
  if (valuationOutputs.adjustmentWarning) {
    valuationOutputs.adjustmentWarning.hidden = !adjustmentSummary.warning;
    valuationOutputs.adjustmentWarning.textContent = adjustmentSummary.warning;
  }
}

function renderAdjustmentErrors(invalidAdjustments) {
  if (!adjustmentContainer) return;
  adjustmentContainer.querySelectorAll("[data-adjustment-error]").forEach((element) => { element.textContent = ""; });
  invalidAdjustments.forEach((adjustment) => {
    const errorElement = adjustmentContainer.querySelector(`[data-adjustment-error="${cssEscape(adjustment.id)}"]`);
    if (errorElement) errorElement.textContent = "補正率は数値で入力してください。";
  });
}

function renderValuationErrors(errors) {
  const errorBox = valuationOutputs.valuationErrorList;
  if (!errorBox) return;
  if (errors.length === 0) {
    errorBox.hidden = true;
    errorBox.innerHTML = "";
    return;
  }
  errorBox.hidden = false;
  errorBox.innerHTML = `<ul>${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join("")}</ul>`;
}

function renderPriceResults(engine, priceResult) {
  setText(valuationOutputs.basePriceYen, formatManYenWithUnit(engine, priceResult.basePriceYen, "", false));
  setText(valuationOutputs.adjustedPriceYen, formatManYenWithUnit(engine, priceResult.adjustedPriceYen, "", false));
  setText(valuationOutputs.centerPriceYen, formatManYenWithUnit(engine, priceResult.centerPriceYen, "", false));
  setText(valuationOutputs.quickSalePriceYen, formatManYenWithUnit(engine, priceResult.quickSalePriceYen, "", false));
  setText(valuationOutputs.listingPriceYen, formatManYenWithUnit(engine, priceResult.listingPriceYen, "", false));
}

function updateDerivedValuation(routeReference, adjustmentSummary, adjustedUnitPricePerTsuboYen, priceResult) {
  appState.valuation.referenceUnitPricePerSqmYen = routeReference.referenceYenPerSqm;
  appState.valuation.referenceUnitPricePerTsuboYen = routeReference.referenceYenPerTsubo;
  appState.valuation.referenceTotalPriceYen = routeReference.referenceTotalYen;
  appState.valuation.adjustmentTotalPercent = adjustmentSummary.totalRatePercent;
  appState.valuation.adjustedUnitPricePerTsubo = adjustedUnitPricePerTsuboYen;
  appState.valuation.basePriceYen = priceResult?.basePriceYen ?? null;
  appState.valuation.adjustedPriceYen = priceResult?.adjustedPriceYen ?? null;
  appState.valuation.centerPriceYen = priceResult?.centerPriceYen ?? null;
  appState.valuation.quickSalePriceYen = priceResult?.quickSalePriceYen ?? null;
  appState.valuation.listingPriceYen = priceResult?.listingPriceYen ?? null;
}

function clearRouteReferenceDisplay() {
  setText(valuationOutputs.routeValueDisplay, "未入力");
  setText(valuationOutputs.routeValueYenPerSqm, "-");
  setText(valuationOutputs.routeReferenceYenPerSqm, "-");
  setText(valuationOutputs.routeReferenceYenPerTsubo, "-");
  setText(valuationOutputs.routeReferenceTotalYen, "-");
}
function clearUnitPriceDisplay() {
  setText(valuationOutputs.autoReferenceUnitPrice, "-");
  setText(valuationOutputs.userInitialUnitPriceDisplay, "-");
  setText(valuationOutputs.initialUnitPricePerSqmDisplay, "-");
}
function clearAdjustmentSummaryDisplay() {
  setText(valuationOutputs.adjustmentAppliedList, "適用補正なし");
  setText(valuationOutputs.adjustmentTotalRate, "0%");
  setText(valuationOutputs.adjustedUnitPricePerTsuboDisplay, "-");
  if (valuationOutputs.adjustmentWarning) {
    valuationOutputs.adjustmentWarning.hidden = true;
    valuationOutputs.adjustmentWarning.textContent = "";
  }
}
function clearPriceDisplay() {
  setText(valuationOutputs.basePriceYen, "-");
  setText(valuationOutputs.adjustedPriceYen, "-");
  setText(valuationOutputs.centerPriceYen, "-");
  setText(valuationOutputs.quickSalePriceYen, "-");
  setText(valuationOutputs.listingPriceYen, "-");
}

function handleGenerateCalculationMemo() {
  const engine = getValuationEngine();
  if (!engine) {
    window.alert("価格査定の計算エンジンを読み込めませんでした。");
    return;
  }
  updateValuationCalculations();
  if (appState.valuation.calculationMemo && !window.confirm("既存の算出根拠メモを、作成した文章で上書きします。よろしいですか？")) return;
  const adjustmentSummary = engine.calculateAdjustmentTotal(appState.valuation.adjustments);
  const memoText = engine.generateCalculationMemo({
    routeValueThousandYen: appState.valuation.routeValueThousandYen,
    routeValueSymbol: appState.valuation.routeValueSymbol,
    routeValueYear: appState.valuation.routeValueYear,
    routeValueMultiplier: appState.valuation.routeValueMultiplier,
    referenceYenPerTsubo: appState.valuation.referenceUnitPricePerTsuboYen,
    initialUnitPricePerTsuboMan: appState.valuation.initialUnitPricePerTsubo,
    initialUnitPriceReason: appState.valuation.initialUnitPriceReason,
    appliedAdjustments: adjustmentSummary.appliedAdjustments,
    adjustmentTotalPercent: appState.valuation.adjustmentTotalPercent,
    adjustedUnitPricePerTsuboYen: appState.valuation.adjustedUnitPricePerTsubo,
    centerPriceYen: appState.valuation.centerPriceYen,
    notice: "本査定価格は入力値に基づく概算であり、実際の売却価格等を保証するものではありません。"
  });
  if (!memoText) {
    window.alert("算出根拠を作成できる入力がありません。");
    return;
  }
  appState.valuation.calculationMemo = memoText;
  setValuationInputValue("calculationMemo", memoText);
  saveValuationAfterChange();
}

function handleSaveAppraisal() {
  updateValuationCalculations();

  if (appState.valuation.centerPriceYen === null) {
    window.alert("査定中心価格を計算できる状態で保存してください。");
    return;
  }

  const appraisal = createAppraisalSnapshot();
  appState.appraisals.push(appraisal);
  saveState();
  renderAppraisalHistory();
  window.alert("査定履歴に保存しました。");
}

function createAppraisalSnapshot() {
  const valuation = appState.valuation;
  const now = new Date().toISOString();

  return {
    id: createUuid(),
    appraisalDate: valuation.appraisalDate || "",
    address: appState.property.address || "",
    lotNumber: appState.property.lotNumber || "",
    landAreaSqm: valuation.landAreaSqm,
    landAreaTsubo: valuation.landAreaTsubo,
    routeValueThousandYen: valuation.routeValueThousandYen,
    routeValueMultiplier: valuation.routeValueMultiplier,
    initialUnitPricePerTsubo: valuation.initialUnitPricePerTsubo,
    adjustedUnitPricePerTsubo: valuation.adjustedUnitPricePerTsubo,
    centerPriceYen: valuation.centerPriceYen,
    quickSalePriceYen: valuation.quickSalePriceYen,
    listingPriceYen: valuation.listingPriceYen,
    calculationMemo: valuation.calculationMemo || "",
    savedAt: now,
    adjustments: valuation.adjustments.map((adjustment) => ({ ...adjustment }))
  };
}

function handleAppraisalHistoryClick(event) {
  const item = event.target.closest("[data-appraisal-id]");

  if (!item) {
    return;
  }

  loadAppraisalToValuation(item.dataset.appraisalId);
}

function loadAppraisalToValuation(appraisalId) {
  const appraisal = appState.appraisals.find((item) => item.id === appraisalId);

  if (!appraisal) {
    return;
  }

  appState.property.address = appraisal.address || "";
  appState.property.lotNumber = appraisal.lotNumber || "";
  appState.property.type = "土地";
  appState.valuation.landAreaSqm = appraisal.landAreaSqm ?? "";
  appState.valuation.landAreaTsubo = appraisal.landAreaTsubo ?? "";
  appState.valuation.routeValueThousandYen = appraisal.routeValueThousandYen ?? "";
  appState.valuation.routeValueMultiplier = appraisal.routeValueMultiplier ?? 1.25;
  appState.valuation.initialUnitPricePerTsubo = appraisal.initialUnitPricePerTsubo ?? "";
  appState.valuation.adjustedUnitPricePerTsubo = appraisal.adjustedUnitPricePerTsubo ?? null;
  appState.valuation.centerPriceYen = appraisal.centerPriceYen ?? null;
  appState.valuation.quickSalePriceYen = appraisal.quickSalePriceYen ?? null;
  appState.valuation.listingPriceYen = appraisal.listingPriceYen ?? null;
  appState.valuation.calculationMemo = appraisal.calculationMemo || "";
  appState.valuation.appraisalDate = appraisal.appraisalDate || "";
  appState.valuation.adjustments = normalizeAdjustments(appraisal.adjustments);
  touchValuationUpdatedAt();

  updatePropertyInputs();
  renderChecklist();
  renderSummary();
  renderAdjustments();
  updateValuationInputs();
  updateValuationAvailability();
  updateValuationCalculations({ shouldSave: true });
  setActiveView("valuationView");
}

function renderAppraisalHistory() {
  if (!appraisalHistoryList) {
    return;
  }

  appraisalHistoryList.innerHTML = "";

  if (!Array.isArray(appState.appraisals) || appState.appraisals.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-history-message";
    empty.textContent = "保存済みの査定履歴はありません。";
    appraisalHistoryList.appendChild(empty);
    return;
  }

  const sortedAppraisals = [...appState.appraisals].sort((a, b) => {
    return String(b.savedAt || "").localeCompare(String(a.savedAt || ""));
  });

  sortedAppraisals.forEach((appraisal) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "appraisal-history-item";
    button.dataset.appraisalId = appraisal.id;
    button.innerHTML = `
      <span class="appraisal-history-main">${escapeHtml(appraisal.address || "所在地未入力")}</span>
      <span class="appraisal-history-sub">地番：${escapeHtml(appraisal.lotNumber || "-")} ／ 査定日：${escapeHtml(appraisal.appraisalDate || "-")}</span>
      <span class="appraisal-history-prices">査定中心：${escapeHtml(formatHistoryMoney(appraisal.centerPriceYen))} ／ 早期：${escapeHtml(formatHistoryMoney(appraisal.quickSalePriceYen))} ／ 売出：${escapeHtml(formatHistoryMoney(appraisal.listingPriceYen))}</span>
      <span class="appraisal-history-sub">保存日時：${escapeHtml(formatDateTime(appraisal.savedAt))}</span>
    `;
    appraisalHistoryList.appendChild(button);
  });
}

function normalizeAppraisals(sourceAppraisals) {
  if (!Array.isArray(sourceAppraisals)) {
    return [];
  }

  return sourceAppraisals
    .filter((appraisal) => appraisal && typeof appraisal === "object" && !Array.isArray(appraisal))
    .map((appraisal) => ({
      id: typeof appraisal.id === "string" && appraisal.id ? appraisal.id : createUuid(),
      appraisalDate: typeof appraisal.appraisalDate === "string" ? appraisal.appraisalDate : "",
      address: typeof appraisal.address === "string" ? appraisal.address : "",
      lotNumber: typeof appraisal.lotNumber === "string" ? appraisal.lotNumber : "",
      landAreaSqm: normalizeOptionalNumber(appraisal.landAreaSqm),
      landAreaTsubo: normalizeOptionalNumber(appraisal.landAreaTsubo),
      routeValueThousandYen: normalizeOptionalNumber(appraisal.routeValueThousandYen),
      routeValueMultiplier: normalizeOptionalNumber(appraisal.routeValueMultiplier),
      initialUnitPricePerTsubo: normalizeOptionalNumber(appraisal.initialUnitPricePerTsubo),
      adjustedUnitPricePerTsubo: normalizeNullableNumber(appraisal.adjustedUnitPricePerTsubo),
      centerPriceYen: normalizeNullableNumber(appraisal.centerPriceYen),
      quickSalePriceYen: normalizeNullableNumber(appraisal.quickSalePriceYen),
      listingPriceYen: normalizeNullableNumber(appraisal.listingPriceYen),
      calculationMemo: typeof appraisal.calculationMemo === "string" ? appraisal.calculationMemo : "",
      savedAt: typeof appraisal.savedAt === "string" ? appraisal.savedAt : "",
      adjustments: normalizeAdjustments(appraisal.adjustments)
    }));
}

function normalizeOptionalNumber(value) {
  if (value === "" || value === undefined || value === null) {
    return "";
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : "";
}

function normalizeNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function formatHistoryMoney(value) {
  const engine = getValuationEngine();

  if (!engine) {
    return "-";
  }

  return engine.formatManYen(value, "-");
}

function createUuid() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `appraisal-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function setActiveView(viewId) {
  tabButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.view === viewId));
  appViews.forEach((view) => view.classList.toggle("is-active", view.id === viewId));
}
function getInputValue(key, input) {
  return VALUATION_NUMBER_FIELDS.has(key) ? parseOptionalNumber(input.value) : input.value;
}
function parseOptionalNumber(value) {
  if (value === "") return "";
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : "";
}
function setValuationInputValue(key, value) {
  const input = valuationInputs[key];
  if (input) input.value = value ?? "";
}
function touchValuationUpdatedAt() {
  appState.valuation.updatedAt = new Date().toISOString();
}
function updateValuationUpdatedAt() {
  if (!valuationUpdatedAt) return;
  valuationUpdatedAt.textContent = appState.valuation.updatedAt ? formatDateTime(appState.valuation.updatedAt) : "未保存";
}
function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}/${padDatePart(date.getMonth() + 1)}/${padDatePart(date.getDate())} ${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}
function formatYenWithUnit(engine, value, unit) {
  const formattedValue = engine.formatCurrencyYen(value, "");
  return formattedValue ? `${formattedValue}${unit}` : "-";
}
function formatManYenWithUnit(engine, value, unit, withApprox) {
  const formattedValue = engine.formatManYen(value, "");
  if (!formattedValue) return "-";
  return `${withApprox ? "約" : ""}${formattedValue}${unit}`;
}
function formatSignedRate(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "-";
  return `${numberValue > 0 ? "+" : ""}${numberValue}%`;
}
function roundToTwo(value) {
  return Math.round(value * 100) / 100;
}
function setText(element, text) {
  if (element) element.textContent = text;
}
function getValuationEngine() {
  return window.ValuationEngine || null;
}
function createItemId(categoryName, itemName) {
  return `${categoryName}__${itemName}`;
}
function getItemId(categoryName, item) {
  return item.id || createItemId(categoryName, item.name);
}
function getDefaultItemState() {
  return { status: "未確認", memo: "", important: false };
}
function ensureItemState(itemId) {
  if (!appState.items[itemId]) appState.items[itemId] = getDefaultItemState();
  return appState.items[itemId];
}
function getSelectedPropertyType() {
  return PROPERTY_TYPES.includes(appState.property.type) ? appState.property.type : "土地";
}
function getVisibleItems(items, propertyType) {
  return items.filter((item) => isVisibleForProperty(item, propertyType));
}
function isVisibleForProperty(item, propertyType) {
  if (!Array.isArray(item.propertyTypes) || item.propertyTypes.length === 0) return true;
  return item.propertyTypes.includes(propertyType);
}
function applySavedItemStatesToState(targetState, savedItems) {
  if (!savedItems || typeof savedItems !== "object" || Array.isArray(savedItems)) return;
  CHECKLIST_DATA.forEach((category) => {
    category.items.forEach((item) => {
      const itemId = getItemId(category.category, item);
      const legacyItemId = createItemId(category.category, item.name);
      const savedItem = savedItems[itemId] || savedItems[legacyItemId];
      if (savedItem && typeof savedItem === "object" && !Array.isArray(savedItem)) {
        targetState.items[itemId] = normalizeItemState(savedItem, targetState.items[itemId]);
      }
    });
  });
}
function normalizeSavedState(sourceState) {
  const normalizedState = createInitialState();
  const sourceProperty = sourceState.property || {};
  normalizedState.schemaVersion = SCHEMA_VERSION;
  normalizedState.property = {
    address: typeof sourceProperty.address === "string" ? sourceProperty.address : "",
    lotNumber: typeof sourceProperty.lotNumber === "string" ? sourceProperty.lotNumber : "",
    type: PROPERTY_TYPES.includes(sourceProperty.type) ? sourceProperty.type : "土地"
  };
  applySavedItemStatesToState(normalizedState, sourceState.items);
  normalizedState.valuation = normalizeValuation(sourceState.valuation);
  normalizedState.appraisals = normalizeAppraisals(sourceState.appraisals);
  return normalizedState;
}
function normalizeItemState(sourceItem, currentItemState) {
  const normalizedItem = { ...getDefaultItemState(), ...currentItemState };
  if (STATUS_OPTIONS.includes(sourceItem.status)) normalizedItem.status = sourceItem.status;
  if (typeof sourceItem.memo === "string") normalizedItem.memo = sourceItem.memo;
  if (typeof sourceItem.important === "boolean") normalizedItem.important = sourceItem.important;
  return normalizedItem;
}
function normalizeValuation(sourceValuation) {
  const normalizedValuation = createDefaultValuation();
  if (!sourceValuation || typeof sourceValuation !== "object" || Array.isArray(sourceValuation)) return normalizedValuation;
  const numberFields = [
    "landAreaSqm", "landAreaTsubo", "routeValueThousandYen", "routeValueYear", "routeValueMultiplier",
    "initialUnitPricePerTsubo", "originalReferenceUnitPricePerTsubo", "quickSaleFactor", "listingFactor",
    "roundingUnit", ...VALUATION_DERIVED_NUMBER_FIELDS
  ];
  const stringFields = ["routeValueSymbol", "routeValueMemo", "initialUnitPriceReason", "calculationMemo", "appraisalDate", "updatedAt"];
  numberFields.forEach((field) => {
    if (sourceValuation[field] === "") {
      normalizedValuation[field] = "";
      return;
    }
    if (sourceValuation[field] === null && VALUATION_DERIVED_NUMBER_FIELDS.includes(field)) {
      normalizedValuation[field] = null;
      return;
    }
    const numberValue = Number(sourceValuation[field]);
    if (Number.isFinite(numberValue)) normalizedValuation[field] = numberValue;
  });
  stringFields.forEach((field) => {
    if (typeof sourceValuation[field] === "string") normalizedValuation[field] = sourceValuation[field];
  });
  normalizedValuation.adjustments = normalizeAdjustments(sourceValuation.adjustments);
  return normalizedValuation;
}
function normalizeAdjustments(sourceAdjustments) {
  const normalizedAdjustments = createDefaultAdjustments();
  if (!Array.isArray(sourceAdjustments)) return normalizedAdjustments;
  normalizedAdjustments.forEach((adjustment) => {
    const sourceAdjustment = sourceAdjustments.find((item) => item && item.id === adjustment.id);
    if (!sourceAdjustment || typeof sourceAdjustment !== "object") return;
    if (adjustment.id === "other" && typeof sourceAdjustment.name === "string") adjustment.name = sourceAdjustment.name;
    if (typeof sourceAdjustment.enabled === "boolean") adjustment.enabled = sourceAdjustment.enabled;
    if (sourceAdjustment.rate === "") adjustment.rate = "";
    else {
      const numberValue = Number(sourceAdjustment.rate);
      if (Number.isFinite(numberValue)) adjustment.rate = numberValue;
    }
    if (typeof sourceAdjustment.reason === "string") adjustment.reason = sourceAdjustment.reason;
  });
  return normalizedAdjustments;
}
function validateBackupData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return "バックアップデータがオブジェクト形式ではありません。";
  const schemaVersion = data.schemaVersion ?? 1;
  if (![1, 2].includes(schemaVersion)) return `未対応のschemaVersionです: ${schemaVersion}`;
  if (!data.property || typeof data.property !== "object" || Array.isArray(data.property)) return "propertyが存在しない、または形式が正しくありません。";
  if (!data.items || typeof data.items !== "object" || Array.isArray(data.items)) return "itemsが存在しない、または形式が正しくありません。";
  if (schemaVersion === 2 && data.valuation !== undefined && (!data.valuation || typeof data.valuation !== "object" || Array.isArray(data.valuation))) return "valuationの形式が正しくありません。";
  if (schemaVersion === 2 && data.appraisals !== undefined && !Array.isArray(data.appraisals)) return "appraisalsの形式が正しくありません。";
  return "";
}
function exportBackupData() {
  try {
    updateValuationCalculations();
    appState = normalizeSavedState(appState);
    updateValuationCalculations();
    saveState();
    const jsonText = JSON.stringify(appState, null, 2);
    const blob = new Blob([jsonText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = createBackupFileName();
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setBackupMessage("JSONバックアップを作成しました。", "success");
  } catch (error) {
    console.error(error);
    setBackupMessage("JSONエクスポートに失敗しました。", "error");
  }
}
function importBackupData() {
  if (!importBackupFile || !importBackupFile.files || importBackupFile.files.length === 0) {
    setBackupMessage("インポートするJSONファイルを選択してください。", "error");
    return;
  }
  if (!window.confirm("現在の入力内容を、選択したバックアップデータで上書きします。よろしいですか？")) return;
  const file = importBackupFile.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const importedData = JSON.parse(reader.result);
      const validationError = validateBackupData(importedData);
      if (validationError) throw new Error(validationError);
      appState = normalizeSavedState(importedData);
      saveState();
      updatePropertyInputs();
      renderChecklist();
      renderSummary();
      renderAdjustments();
      updateValuationInputs();
      updateValuationAvailability();
      updateValuationCalculations({ shouldSave: true });
      renderAppraisalHistory();
      importBackupFile.value = "";
      setBackupMessage("JSONバックアップを読み込みました。", "success");
    } catch (error) {
      console.error(error);
      setBackupMessage(`JSONインポートに失敗しました。${error.message}`, "error");
    }
  };
  reader.onerror = () => setBackupMessage("JSONファイルを読み込めませんでした。", "error");
  reader.readAsText(file, "UTF-8");
}
function createBackupFileName() {
  const now = new Date();
  const dateText = `${now.getFullYear()}${padDatePart(now.getMonth() + 1)}${padDatePart(now.getDate())}`;
  const timeText = `${padDatePart(now.getHours())}${padDatePart(now.getMinutes())}`;
  return `bukken-chosa-backup-${dateText}-${timeText}.json`;
}
function padDatePart(value) {
  return String(value).padStart(2, "0");
}
function setBackupMessage(message, type) {
  if (!backupMessage) return;
  backupMessage.textContent = message;
  backupMessage.classList.remove("is-success", "is-error");
  if (type) backupMessage.classList.add(`is-${type}`);
}
function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
  return String(value).replaceAll('"', '\\"');
}
// 画面に文字列を差し込む前に、HTMLとして解釈されない形に変換します。
function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}