const STATUS_OPTIONS = ["未確認", "確認中", "確認済", "対象外"];
const PROPERTY_TYPES = ["土地", "戸建", "マンション"];
const STORAGE_KEY = "jusetsuResearchToolV1";

const checklistContainer = document.getElementById("checklistContainer");
const uncheckedList = document.getElementById("uncheckedList");
const inProgressList = document.getElementById("inProgressList");
const importantList = document.getElementById("importantList");
const resetButton = document.getElementById("resetButton");

const propertyInputs = {
  address: document.getElementById("propertyAddress"),
  lotNumber: document.getElementById("propertyLotNumber"),
  type: document.getElementById("propertyType")
};

let appState = createInitialState();

// ページ読み込み時に、保存済みの入力内容があれば復元します。
loadState();
renderChecklist();
renderSummary();

Object.entries(propertyInputs).forEach(([key, input]) => {
  const eventName = input.tagName === "SELECT" ? "change" : "input";

  input.addEventListener(eventName, () => {
    appState.property[key] = input.value;
    saveState();

    if (key === "type") {
      renderChecklist();
      renderSummary();
    }
  });
});

resetButton.addEventListener("click", () => {
  const confirmed = window.confirm("入力内容をすべてリセットします。よろしいですか？");

  if (!confirmed) {
    return;
  }

  appState = createInitialState();
  localStorage.removeItem(STORAGE_KEY);
  updatePropertyInputs();
  renderChecklist();
  renderSummary();
});

function createInitialState() {
  const items = {};

  CHECKLIST_DATA.forEach((category) => {
    category.items.forEach((item) => {
      const itemId = getItemId(category.category, item);

      items[itemId] = getDefaultItemState();
    });
  });

  return {
    property: {
      address: "",
      lotNumber: "",
      type: "土地"
    },
    items
  };
}

function loadState() {
  const savedText = localStorage.getItem(STORAGE_KEY);

  if (!savedText) {
    updatePropertyInputs();
    return;
  }

  try {
    const savedState = JSON.parse(savedText);
    appState.property = {
      ...appState.property,
      ...savedState.property
    };

    if (!PROPERTY_TYPES.includes(appState.property.type)) {
      appState.property.type = "土地";
    }

    applySavedItemStates(savedState.items);
  } catch (error) {
    console.warn("保存データを読み込めませんでした。初期状態で開始します。", error);
  }

  updatePropertyInputs();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function updatePropertyInputs() {
  propertyInputs.address.value = appState.property.address;
  propertyInputs.lotNumber.value = appState.property.lotNumber;
  propertyInputs.type.value = appState.property.type;
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
      <thead>
        <tr>
          <th>調査項目</th>
          <th>状態</th>
          <th>メモ</th>
          <th>重説反映</th>
        </tr>
      </thead>
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
  cell.innerHTML = `
    <div>${escapeHtml(item.name)}</div>
    <div class="item-hint">${escapeHtml(item.hint)}</div>
  `;
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
  textarea.placeholder = "確認先、日付、注意点など";
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
    const visibleItems = getVisibleItems(category.items, selectedPropertyType);

    visibleItems.forEach((item) => {
      const itemId = getItemId(category.category, item);
      const itemState = ensureItemState(itemId);
      const summaryItem = {
        category: category.category,
        name: item.name,
        memo: itemState.memo
      };

      if (itemState.status === "未確認") {
        uncheckedItems.push(summaryItem);
      }

      if (itemState.status === "確認中") {
        inProgressItems.push(summaryItem);
      }

      if (itemState.important) {
        importantItems.push(summaryItem);
      }
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

function createItemId(categoryName, itemName) {
  return `${categoryName}__${itemName}`;
}

function getItemId(categoryName, item) {
  return item.id || createItemId(categoryName, item.name);
}

function getDefaultItemState() {
  return {
    status: "未確認",
    memo: "",
    important: false
  };
}

function ensureItemState(itemId) {
  if (!appState.items[itemId]) {
    appState.items[itemId] = getDefaultItemState();
  }

  return appState.items[itemId];
}

function applySavedItemStates(savedItems) {
  if (!savedItems) {
    return;
  }

  CHECKLIST_DATA.forEach((category) => {
    category.items.forEach((item) => {
      const itemId = getItemId(category.category, item);
      const legacyItemId = createItemId(category.category, item.name);
      const savedItem = savedItems[itemId] || savedItems[legacyItemId];

      if (savedItem) {
        appState.items[itemId] = {
          ...getDefaultItemState(),
          ...appState.items[itemId],
          ...savedItem
        };
      }
    });
  });
}

function getSelectedPropertyType() {
  if (PROPERTY_TYPES.includes(appState.property.type)) {
    return appState.property.type;
  }

  return "土地";
}

function getVisibleItems(items, propertyType) {
  return items.filter((item) => isVisibleForProperty(item, propertyType));
}

function isVisibleForProperty(item, propertyType) {
  if (!Array.isArray(item.propertyTypes) || item.propertyTypes.length === 0) {
    return true;
  }

  return item.propertyTypes.includes(propertyType);
}

// 画面に文字を差し込む前に、HTMLとして解釈されない形に変換します。
function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
