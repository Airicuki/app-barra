const STORAGE_KEY = "barraBebidas.v2";
const LEGACY_STORAGE_KEY = "barraBebidas.v1";

const users = {
  admin: { password: "admin123", role: "admin", label: "Administrador" },
  barra: { password: "barra123", role: "user", label: "Usuario normal" }
};

const cashDenominations = [
  { value: 50, label: "50 €" },
  { value: 20, label: "20 €" },
  { value: 10, label: "10 €" },
  { value: 5, label: "5 €" },
  { value: 2, label: "2 €" },
  { value: 1, label: "1 €" },
  { value: 0.5, label: "50 cent" },
  { value: 0.2, label: "20 cent" },
  { value: 0.1, label: "10 cent" },
  { value: 0.05, label: "5 cent" },
  { value: 0.02, label: "2 cent" },
  { value: 0.01, label: "1 cent" }
];

const cashSlots = ["morning", "start", "end"];
const ranchoRoles = [
  { key: "jefe", label: "Jefe de barra", max: 2 },
  { key: "caja", label: "Caja", max: 2 },
  { key: "barra", label: "Barra", max: 4 }
];

const defaultState = {
  products: [
    { id: crypto.randomUUID(), name: "Agua 50 cl", stock: 96, price: 1.5 },
    { id: crypto.randomUUID(), name: "Refresco cola", stock: 72, price: 2.5 },
    { id: crypto.randomUUID(), name: "Cerveza", stock: 120, price: 3 },
    { id: crypto.randomUUID(), name: "Tónica", stock: 48, price: 2.25 },
    { id: crypto.randomUUID(), name: "Vino copa", stock: 36, price: 3.5 }
  ],
  entries: {},
  transactions: {},
  cashCounts: {},
  notes: {},
  people: ["Ruth", "Persona 2", "Persona 3", "Persona 4"],
  rancho: {}
};

let state = loadState();
let session = null;
let cart = {};
let lossCart = {};

const els = {
  loginView: document.querySelector("#loginView"),
  dashboardView: document.querySelector("#dashboardView"),
  loginForm: document.querySelector("#loginForm"),
  loginError: document.querySelector("#loginError"),
  username: document.querySelector("#username"),
  password: document.querySelector("#password"),
  roleBadge: document.querySelector("#roleBadge"),
  logoutBtn: document.querySelector("#logoutBtn"),
  tabs: document.querySelectorAll(".tab"),
  views: document.querySelectorAll(".view"),
  adminOnly: document.querySelectorAll(".admin-only"),
  entryDate: document.querySelector("#entryDate"),
  dailyRows: document.querySelector("#dailyRows"),
  lossRows: document.querySelector("#lossRows"),
  transactionRows: document.querySelector("#transactionRows"),
  inventoryRows: document.querySelector("#inventoryRows"),
  reportRows: document.querySelector("#reportRows"),
  noteForm: document.querySelector("#noteForm"),
  noteConcept: document.querySelector("#noteConcept"),
  noteProvider: document.querySelector("#noteProvider"),
  noteAmount: document.querySelector("#noteAmount"),
  noteRows: document.querySelector("#noteRows"),
  personForm: document.querySelector("#personForm"),
  personName: document.querySelector("#personName"),
  peopleList: document.querySelector("#peopleList"),
  ranchoScheduleRows: document.querySelector("#ranchoScheduleRows"),
  ranchoMealRows: document.querySelector("#ranchoMealRows"),
  saveTransactionBtn: document.querySelector("#saveTransactionBtn"),
  saveLossBtn: document.querySelector("#saveLossBtn"),
  addProductBtn: document.querySelector("#addProductBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  saveStatus: document.querySelector("#saveStatus"),
  cartTotal: document.querySelector("#cartTotal"),
  cartUnits: document.querySelector("#cartUnits"),
  cashView: document.querySelector("#cashView"),
  cashCalculators: document.querySelectorAll("[data-cash-count]"),
  cashDiffStart: document.querySelector("#cashDiffStart"),
  cashDiffEnd: document.querySelector("#cashDiffEnd"),
  cashDiffDay: document.querySelector("#cashDiffDay"),
  cashStatus: document.querySelector("#cashStatus"),
  saveCashBtn: document.querySelector("#saveCashBtn"),
  weekSold: document.querySelector("#weekSold"),
  weekLost: document.querySelector("#weekLost"),
  weekRevenue: document.querySelector("#weekRevenue"),
  weekStock: document.querySelector("#weekStock")
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!saved) return structuredClone(defaultState);

  try {
    return normalizeState(JSON.parse(saved));
  } catch {
    return structuredClone(defaultState);
  }
}

function normalizeState(saved) {
  return {
    products: Array.isArray(saved.products) ? saved.products : structuredClone(defaultState.products),
    entries: saved.entries || {},
    transactions: saved.transactions || {},
    cashCounts: saved.cashCounts || {},
    notes: saved.notes || {},
    people: Array.isArray(saved.people) ? saved.people : structuredClone(defaultState.people),
    rancho: saved.rancho || {}
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function operationalDate(date = new Date()) {
  const adjusted = new Date(date);
  if (adjusted.getHours() < 10) adjusted.setDate(adjusted.getDate() - 1);
  return formatDate(adjusted);
}

function dateLabel(dateValue) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit"
  }).format(new Date(`${dateValue}T12:00:00`));
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

function weekBounds(dateValue) {
  const start = new Date(`${dateValue}T12:00:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: formatDate(start), end: formatDate(end) };
}

function currentWeekEntries() {
  const { start, end } = weekBounds(els.entryDate.value || formatDate());
  return Object.entries(state.entries)
    .filter(([date]) => date >= start && date <= end)
    .flatMap(([date, rows]) => rows.map((row) => ({ date, ...row })));
}

function currentWeekTransactions() {
  const { start, end } = weekBounds(els.entryDate.value || formatDate());
  return Object.entries(state.transactions)
    .filter(([date]) => date >= start && date <= end)
    .flatMap(([date, rows]) => rows.map((row) => ({ date, ...row })));
}

function currentWeekNotes() {
  const { start, end } = weekBounds(els.entryDate.value || formatDate());
  return Object.entries(state.notes)
    .filter(([date]) => date >= start && date <= end)
    .flatMap(([date, rows]) => rows.map((row) => ({ date, ...row })));
}

function login(event) {
  event.preventDefault();
  const account = users[els.username.value.trim()];

  if (!account || account.password !== els.password.value) {
    els.loginError.textContent = "Usuario o contraseña incorrectos.";
    return;
  }

  session = { username: els.username.value.trim(), ...account };
  els.loginForm.reset();
  els.loginError.textContent = "";
  showDashboard();
}

function showDashboard() {
  els.loginView.classList.add("hidden");
  els.dashboardView.classList.remove("hidden");
  els.roleBadge.textContent = session.label;
  els.adminOnly.forEach((node) => node.classList.toggle("hidden", session.role !== "admin"));
  if (session.role !== "admin") showView("dailyView");
  render();
}

function logout() {
  session = null;
  cart = {};
  lossCart = {};
  els.dashboardView.classList.add("hidden");
  els.loginView.classList.remove("hidden");
}

function showView(viewId) {
  els.views.forEach((view) => view.classList.toggle("hidden", view.id !== viewId));
  els.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === viewId));
}

function render() {
  renderProductSteppers();
  renderTransactions();
  renderCash();
  renderNotes();
  renderRancho();
  renderInventory();
  renderReports();
  renderSummary();
}

function renderProductSteppers() {
  renderStepperList(els.dailyRows, cart, "sale");
  renderStepperList(els.lossRows, lossCart, "loss");
  renderCartSummary();
}

function renderStepperList(container, source, mode) {
  const template = document.querySelector("#productStepperTemplate");
  container.replaceChildren();

  state.products.forEach((product) => {
    const row = template.content.firstElementChild.cloneNode(true);
    row.dataset.productId = product.id;
    row.dataset.mode = mode;
    row.querySelector("[data-name]").textContent = product.name;
    row.querySelector("[data-stock]").textContent = `Stock actual: ${product.stock} · ${formatMoney(product.price)}`;
    row.querySelector("[data-qty]").textContent = source[product.id] || 0;
    container.append(row);
  });
}

function renderCartSummary() {
  const items = cartItems(cart);
  const units = items.reduce((sum, item) => sum + item.qty, 0);
  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  els.cartTotal.textContent = formatMoney(total);
  els.cartUnits.textContent = `${units} ${units === 1 ? "producto" : "productos"}`;
  els.saveTransactionBtn.disabled = units === 0;
  els.saveLossBtn.disabled = Object.values(lossCart).reduce((sum, qty) => sum + qty, 0) === 0;
}

function cartItems(source) {
  return Object.entries(source)
    .map(([productId, qty]) => {
      const product = state.products.find((item) => item.id === productId);
      return product && qty > 0 ? { product, productId, qty, price: Number(product.price || 0) } : null;
    })
    .filter(Boolean);
}

function changeQuantity(event) {
  const button = event.target.closest("button");
  const row = event.target.closest(".product-stepper-row");
  if (!button || !row) return;

  const source = row.dataset.mode === "loss" ? lossCart : cart;
  const product = state.products.find((item) => item.id === row.dataset.productId);
  const current = source[product.id] || 0;
  const next = button.matches("[data-plus]") ? current + 1 : Math.max(0, current - 1);

  if (next === 0) {
    delete source[product.id];
  } else {
    source[product.id] = next;
  }

  renderProductSteppers();
}

function saveTransaction() {
  const items = cartItems(cart);
  if (!items.length) return;

  const date = els.entryDate.value;
  const transaction = {
    id: crypto.randomUUID(),
    time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    user: session.username,
    items: items.map(({ product, qty, price }) => ({
      productId: product.id,
      name: product.name,
      qty,
      price
    })),
    total: items.reduce((sum, item) => sum + item.qty * item.price, 0)
  };

  items.forEach(({ product, qty, price }) => {
    product.stock = Math.max(0, Number(product.stock || 0) - qty);
    addEntry(date, product.id, { sold: qty, lost: 0, price });
  });

  state.transactions[date] = state.transactions[date] || [];
  state.transactions[date].push(transaction);
  cart = {};
  saveState();
  render();
  flash(els.saveStatus, "Transacción guardada.");
}

function saveLosses() {
  const items = cartItems(lossCart);
  if (!items.length) return;

  const date = els.entryDate.value;
  items.forEach(({ product, qty, price }) => {
    product.stock = Math.max(0, Number(product.stock || 0) - qty);
    addEntry(date, product.id, { sold: 0, lost: qty, price });
  });

  lossCart = {};
  saveState();
  render();
  flash(els.saveStatus, "Pérdidas guardadas.");
}

function addEntry(date, productId, movement) {
  state.entries[date] = state.entries[date] || [];
  let entry = state.entries[date].find((row) => row.productId === productId);
  if (!entry) {
    entry = { productId, sold: 0, lost: 0, price: movement.price };
    state.entries[date].push(entry);
  }
  entry.sold += movement.sold;
  entry.lost += movement.lost;
  entry.price = movement.price;
}

function renderTransactions() {
  const rows = state.transactions[els.entryDate.value] || [];
  els.transactionRows.replaceChildren();

  if (!rows.length) {
    const empty = document.createElement("article");
    empty.className = "row-card";
    empty.textContent = "Todavía no hay ventas guardadas hoy.";
    els.transactionRows.append(empty);
    return;
  }

  rows.slice().reverse().forEach((transaction) => {
    const card = document.createElement("article");
    card.className = "row-card transaction-row";
    const title = document.createElement("div");
    const detail = document.createElement("div");
    const total = document.createElement("strong");

    title.className = "product-main";
    title.innerHTML = `<strong>${transaction.time} · ${transaction.user}</strong>`;
    detail.textContent = transaction.items.map((item) => `${item.qty} x ${item.name}`).join(", ");
    total.textContent = formatMoney(transaction.total);
    card.append(title, detail, total);
    els.transactionRows.append(card);
  });
}

function renderNotes() {
  const rows = state.notes[els.entryDate.value] || [];
  els.noteRows.replaceChildren();

  if (!rows.length) {
    const empty = document.createElement("article");
    empty.className = "row-card";
    empty.textContent = "Todavía no hay notas guardadas hoy.";
    els.noteRows.append(empty);
    return;
  }

  rows.slice().reverse().forEach((note) => {
    const card = document.createElement("article");
    card.className = "row-card note-row";

    const concept = document.createElement("div");
    const provider = document.createElement("div");
    const amount = document.createElement("div");
    const read = document.createElement("label");
    const meta = document.createElement("small");

    concept.innerHTML = `<strong>${escapeHtml(note.concept)}</strong>`;
    provider.textContent = note.provider;
    amount.innerHTML = `<strong>${formatMoney(note.amount)}</strong>`;
    read.className = `checkbox-field ${note.read ? "note-read" : "note-pending"}`;
    read.innerHTML = `
      <input type="checkbox" data-note-read="${note.id}" ${note.read ? "checked" : ""}>
      <span>${note.read ? "Leído" : "Pendiente"}</span>
    `;
    meta.textContent = `Guardada a las ${note.time} por ${note.savedBy}`;
    meta.className = "note-meta";

    card.append(concept, provider, amount, read, meta);
    els.noteRows.append(card);
  });
}

function saveNote(event) {
  event.preventDefault();
  const savedBy = window.prompt("Nombre de la persona que guarda la nota");
  if (!savedBy || !savedBy.trim()) return;

  const date = els.entryDate.value;
  const note = {
    id: crypto.randomUUID(),
    concept: els.noteConcept.value.trim(),
    provider: els.noteProvider.value.trim(),
    amount: Math.max(0, Number(els.noteAmount.value || 0)),
    read: false,
    savedBy: savedBy.trim(),
    time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  };

  state.notes[date] = state.notes[date] || [];
  state.notes[date].push(note);
  saveState();
  els.noteForm.reset();
  renderNotes();
}

function updateNoteRead(event) {
  const input = event.target.closest("[data-note-read]");
  if (!input) return;
  const rows = state.notes[els.entryDate.value] || [];
  const note = rows.find((item) => item.id === input.dataset.noteRead);
  if (!note) return;
  note.read = input.checked;
  saveState();
  renderNotes();
}

function ranchoWeekBounds(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);
  const day = date.getDay();
  const saturday = new Date(date);
  saturday.setDate(date.getDate() - ((day + 1) % 7));
  const days = Array.from({ length: 7 }, (_, index) => {
    const item = new Date(saturday);
    item.setDate(saturday.getDate() + index);
    return formatDate(item);
  });
  return { start: formatDate(saturday), days };
}

function getRanchoWeek() {
  const { start, days } = ranchoWeekBounds(els.entryDate.value);
  state.rancho[start] = state.rancho[start] || { schedule: {}, meals: {} };
  days.forEach((date) => {
    state.rancho[start].schedule[date] = normalizeScheduleDay(state.rancho[start].schedule[date]);
    state.rancho[start].meals[date] = normalizeMealDay(state.rancho[start].meals[date]);
  });
  return { key: start, days, data: state.rancho[start] };
}

function normalizeScheduleDay(day = {}) {
  return {
    jefe: Array.isArray(day.jefe) ? day.jefe.slice(0, 2) : ["", ""],
    caja: Array.isArray(day.caja) ? day.caja.slice(0, 2) : ["", ""],
    barra: Array.isArray(day.barra) ? day.barra.slice(0, 4) : ["", "", "", ""]
  };
}

function normalizeMealDay(day = {}) {
  return {
    comida: { people: day.comida?.people || {} },
    cena: { people: day.cena?.people || {} }
  };
}

function renderRancho() {
  renderPeople();
  renderRanchoSchedule();
  renderRanchoMeals();
}

function renderPeople() {
  els.peopleList.replaceChildren();
  state.people.forEach((person) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = person;
    els.peopleList.append(chip);
  });
}

function renderRanchoSchedule() {
  const week = getRanchoWeek();
  els.ranchoScheduleRows.replaceChildren();

  week.days.forEach((date) => {
    const card = document.createElement("article");
    card.className = "rancho-day";
    const title = document.createElement("h4");
    title.textContent = dateLabel(date);
    card.append(title);

    ranchoRoles.forEach((role) => {
      const group = document.createElement("div");
      group.className = "rancho-role";
      const label = document.createElement("strong");
      label.textContent = role.label;
      group.append(label);

      for (let index = 0; index < role.max; index += 1) {
        const select = personSelect(week.data.schedule[date][role.key][index] || "");
        select.dataset.scheduleDate = date;
        select.dataset.scheduleRole = role.key;
        select.dataset.scheduleIndex = index;
        group.append(select);
      }

      card.append(group);
    });

    els.ranchoScheduleRows.append(card);
  });
}

function renderRanchoMeals() {
  const week = getRanchoWeek();
  els.ranchoMealRows.replaceChildren();

  week.days.forEach((date) => {
    const card = document.createElement("article");
    card.className = "rancho-day meal-day";
    const title = document.createElement("h4");
    title.textContent = dateLabel(date);
    card.append(title);

    ["comida", "cena"].forEach((meal) => {
      const section = document.createElement("section");
      section.className = "meal-section";
      const head = document.createElement("div");
      head.className = "meal-head";
      head.innerHTML = `<strong>${meal === "comida" ? "Comida" : "Cena"}</strong>`;

      const add = personSelect("");
      add.dataset.mealAddDate = date;
      add.dataset.mealAddType = meal;
      head.append(add);
      section.append(head);

      getMealPeople(week.data, date, meal).forEach((person) => {
        const status = week.data.meals[date][meal].people[person] || { signed: true, paid: false };
        const row = document.createElement("div");
        row.className = "meal-person";
        row.innerHTML = `
          <span>${escapeHtml(person)}</span>
          <label class="checkbox-field">
            <input type="checkbox" data-meal-signed="${person}" data-meal-date="${date}" data-meal-type="${meal}" ${status.signed ? "checked" : ""}>
            <span>Se apunta</span>
          </label>
          <label class="checkbox-field">
            <input type="checkbox" data-meal-paid="${person}" data-meal-date="${date}" data-meal-type="${meal}" ${status.paid ? "checked" : ""}>
            <span>Pagado 1€</span>
          </label>
        `;
        section.append(row);
      });

      card.append(section);
    });

    els.ranchoMealRows.append(card);
  });
}

function personSelect(value) {
  const select = document.createElement("select");
  select.innerHTML = `<option value="">Seleccionar</option>`;
  state.people.forEach((person) => {
    const option = document.createElement("option");
    option.value = person;
    option.textContent = person;
    option.selected = person === value;
    select.append(option);
  });
  return select;
}

function scheduledPeople(scheduleDay) {
  return ranchoRoles
    .flatMap((role) => scheduleDay[role.key] || [])
    .filter(Boolean)
    .filter((person, index, list) => list.indexOf(person) === index);
}

function getMealPeople(weekData, date, meal) {
  const scheduled = scheduledPeople(weekData.schedule[date]);
  scheduled.forEach((person) => {
    weekData.meals[date][meal].people[person] = weekData.meals[date][meal].people[person] || { signed: true, paid: false };
    weekData.meals[date][meal].people[person].signed = true;
  });
  return Object.keys(weekData.meals[date][meal].people)
    .filter((person) => state.people.includes(person) || scheduled.includes(person))
    .sort((a, b) => scheduled.includes(b) - scheduled.includes(a) || a.localeCompare(b, "es"));
}

function addPerson(event) {
  event.preventDefault();
  const name = els.personName.value.trim();
  if (!name || state.people.includes(name)) return;
  state.people.push(name);
  state.people.sort((a, b) => a.localeCompare(b, "es"));
  els.personForm.reset();
  saveState();
  renderRancho();
}

function updateRanchoSchedule(event) {
  const select = event.target.closest("[data-schedule-date]");
  if (!select) return;
  const week = getRanchoWeek();
  const { scheduleDate, scheduleRole, scheduleIndex } = select.dataset;
  week.data.schedule[scheduleDate][scheduleRole][Number(scheduleIndex)] = select.value;
  saveState();
  renderRanchoMeals();
}

function updateRanchoMeal(event) {
  const addSelect = event.target.closest("[data-meal-add-date]");
  if (addSelect && addSelect.value) {
    const week = getRanchoWeek();
    const { mealAddDate, mealAddType } = addSelect.dataset;
    week.data.meals[mealAddDate][mealAddType].people[addSelect.value] = week.data.meals[mealAddDate][mealAddType].people[addSelect.value] || { signed: true, paid: false };
    week.data.meals[mealAddDate][mealAddType].people[addSelect.value].signed = true;
    saveState();
    renderRanchoMeals();
    return;
  }

  const checkbox = event.target.closest("[data-meal-signed], [data-meal-paid]");
  if (!checkbox) return;
  const week = getRanchoWeek();
  const person = checkbox.dataset.mealSigned || checkbox.dataset.mealPaid;
  const day = checkbox.dataset.mealDate;
  const meal = checkbox.dataset.mealType;
  week.data.meals[day][meal].people[person] = week.data.meals[day][meal].people[person] || { signed: true, paid: false };
  if (checkbox.dataset.mealSigned) week.data.meals[day][meal].people[person].signed = checkbox.checked;
  if (checkbox.dataset.mealPaid) week.data.meals[day][meal].people[person].paid = checkbox.checked;
  saveState();
}

function renderCash() {
  const cash = getCashForDate();
  renderCashCalculators(cash);
  renderCashDiffs(cash);
}

function getCashForDate() {
  const date = els.entryDate.value;
  state.cashCounts[date] = normalizeCashCount(state.cashCounts[date]);
  return state.cashCounts[date];
}

function normalizeCashCount(cash = {}) {
  const normalized = {};
  cashSlots.forEach((slot) => {
    const value = cash[slot];
    if (value && typeof value === "object") {
      normalized[slot] = {
        denominations: value.denominations || {},
        total: Number(value.total || 0)
      };
    } else {
      normalized[slot] = { denominations: {}, total: Number(value || 0) };
    }
  });
  return normalized;
}

function renderCashCalculators(cash) {
  els.cashCalculators.forEach((card) => {
    const slot = card.dataset.cashCount;
    const denominations = card.querySelector("[data-cash-denominations]");
    const stored = cash[slot]?.denominations || {};
    denominations.replaceChildren();

    cashDenominations.forEach((item) => {
      const label = document.createElement("label");
      label.className = "cash-denomination";
      label.innerHTML = `
        <span>${item.label}</span>
        <input type="number" min="0" step="1" inputmode="numeric" data-denomination="${item.value}" value="${stored[item.value] || ""}">
      `;
      denominations.append(label);
    });

    card.querySelector("[data-cash-total]").textContent = formatMoney(cashSlotTotal(cash[slot]));
  });
}

function saveCash() {
  const cash = readCashFromScreen();
  state.cashCounts[els.entryDate.value] = cash;
  saveState();
  renderCashDiffs(cash);
  flash(els.cashStatus, "Caja guardada.");
}

function previewCash() {
  const cash = readCashFromScreen();
  els.cashCalculators.forEach((card) => {
    const slot = card.dataset.cashCount;
    card.querySelector("[data-cash-total]").textContent = formatMoney(cash[slot].total);
  });
  renderCashDiffs(cash);
}

function readCashFromScreen() {
  const cash = {};
  els.cashCalculators.forEach((card) => {
    const denominations = {};
    card.querySelectorAll("[data-denomination]").forEach((input) => {
      const count = Math.max(0, Number(input.value || 0));
      if (count > 0) denominations[input.dataset.denomination] = count;
    });
    cash[card.dataset.cashCount] = {
      denominations,
      total: calculateCashTotal(denominations)
    };
  });
  return cash;
}

function calculateCashTotal(denominations) {
  const total = cashDenominations.reduce((sum, item) => {
    const count = Number(denominations[item.value] || 0);
    return sum + count * item.value;
  }, 0);
  return Math.round(total * 100) / 100;
}

function cashSlotTotal(slot) {
  const denominations = slot?.denominations || {};
  const calculated = calculateCashTotal(denominations);
  return Object.keys(denominations).length ? calculated : Number(slot?.total || 0);
}

function renderCashDiffs(cash) {
  const morning = cashSlotTotal(cash.morning);
  const start = cashSlotTotal(cash.start);
  const end = cashSlotTotal(cash.end);
  els.cashDiffStart.textContent = formatMoney(start - morning);
  els.cashDiffEnd.textContent = formatMoney(end - start);
  els.cashDiffDay.textContent = formatMoney(end - morning);
}

function renderInventory() {
  const template = document.querySelector("#inventoryRowTemplate");
  els.inventoryRows.replaceChildren();

  state.products.forEach((product) => {
    const row = template.content.firstElementChild.cloneNode(true);
    row.dataset.productId = product.id;
    row.querySelector("[data-name]").value = product.name;
    row.querySelector("[data-stock]").value = product.stock;
    row.querySelector("[data-price]").value = product.price;
    row.querySelectorAll("input, button").forEach((control) => {
      control.disabled = session?.role !== "admin";
    });
    els.inventoryRows.append(row);
  });
}

function renderReports() {
  els.reportRows.replaceChildren();
  const rows = currentWeekEntries();
  const transactions = currentWeekTransactions();

  if (!rows.length && !transactions.length) {
    const empty = document.createElement("article");
    empty.className = "row-card";
    empty.textContent = "Todavía no hay movimientos guardados esta semana.";
    els.reportRows.append(empty);
    return;
  }

  rows.forEach((entry) => {
    const product = state.products.find((item) => item.id === entry.productId);
    const card = document.createElement("article");
    card.className = "row-card daily-row";
    const main = document.createElement("div");
    const name = document.createElement("strong");
    const date = document.createElement("span");
    const sold = document.createElement("div");
    const lost = document.createElement("div");

    main.className = "product-main";
    name.textContent = product?.name || "Producto eliminado";
    date.textContent = entry.date;
    sold.innerHTML = `<strong>${entry.sold}</strong><br><span class="muted">Vendidas</span>`;
    lost.innerHTML = `<strong>${entry.lost}</strong><br><span class="muted">Perdidas</span>`;
    main.append(name, date);
    card.append(main, sold, lost);
    els.reportRows.append(card);
  });
}

function renderSummary() {
  const rows = currentWeekEntries();
  const totals = rows.reduce((acc, entry) => {
    const product = state.products.find((item) => item.id === entry.productId);
    acc.sold += entry.sold;
    acc.lost += entry.lost;
    acc.revenue += entry.sold * (product?.price || entry.price || 0);
    return acc;
  }, { sold: 0, lost: 0, revenue: 0 });

  els.weekSold.textContent = totals.sold;
  els.weekLost.textContent = totals.lost;
  els.weekRevenue.textContent = formatMoney(totals.revenue);
  els.weekStock.textContent = state.products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
}

function addProduct() {
  state.products.push({ id: crypto.randomUUID(), name: "Nuevo producto", stock: 0, price: 0 });
  saveState();
  render();
}

function updateInventory(event) {
  if (session?.role !== "admin") return;
  const row = event.target.closest(".inventory-row");
  if (!row) return;

  const product = state.products.find((item) => item.id === row.dataset.productId);
  if (!product) return;

  if (event.target.matches("[data-remove]")) {
    state.products = state.products.filter((item) => item.id !== product.id);
  } else {
    product.name = row.querySelector("[data-name]").value.trim() || "Sin nombre";
    product.stock = Math.max(0, Number(row.querySelector("[data-stock]").value || 0));
    product.price = Math.max(0, Number(row.querySelector("[data-price]").value || 0));
  }

  saveState();
  render();
}

function exportExcel() {
  if (session?.role !== "admin") return;
  const { start, end } = weekBounds(els.entryDate.value);
  const entries = currentWeekEntries();
  const transactions = currentWeekTransactions();
  const notes = currentWeekNotes();
  const cashRows = Object.entries(state.cashCounts)
    .filter(([date]) => date >= start && date <= end)
    .map(([date, cash]) => {
      const normalized = normalizeCashCount(cash);
      const morning = cashSlotTotal(normalized.morning);
      const barStart = cashSlotTotal(normalized.start);
      const dayEnd = cashSlotTotal(normalized.end);
      return [date, morning, barStart, dayEnd, barStart - morning, dayEnd - barStart, dayEnd - morning];
    });

  const lines = [
    ["RESUMEN PRODUCTOS"],
    ["Fecha", "Producto", "Vendidas", "Perdidas", "Precio", "Importe"],
    ...entries.map((entry) => {
      const product = state.products.find((item) => item.id === entry.productId);
      const price = product?.price || entry.price || 0;
      return [entry.date, product?.name || "Producto eliminado", entry.sold, entry.lost, price, entry.sold * price];
    }),
    [],
    ["TRANSACCIONES"],
    ["Fecha", "Hora", "Usuario", "Productos", "Total"],
    ...transactions.map((transaction) => [
      transaction.date,
      transaction.time,
      transaction.user,
      transaction.items.map((item) => `${item.qty} x ${item.name}`).join(", "),
      transaction.total
    ]),
    [],
    ["CAJA"],
    ["Fecha", "Entrada turno", "Inicio barra 19:00", "Final barra", "Inicio - Entrada", "Final - Inicio", "Final - Entrada"],
    ...cashRows,
    [],
    ["NOTAS"],
    ["Fecha", "Hora", "Guardada por", "Concepto", "Proveedor", "Importe", "Leído por siguiente turno"],
    ...notes.map((note) => [
      note.date,
      note.time,
      note.savedBy,
      note.concept,
      note.provider,
      note.amount,
      note.read ? "Sí" : "No"
    ])
  ];
  const csv = lines.map((line) => line.map(escapeCsv).join(";")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `barra-bebidas-${start}-${end}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function flash(element, message) {
  element.textContent = message;
  setTimeout(() => { element.textContent = ""; }, 2200);
}

els.loginForm.addEventListener("submit", login);
els.logoutBtn.addEventListener("click", logout);
els.tabs.forEach((tab) => tab.addEventListener("click", () => {
  if (tab.classList.contains("admin-only") && session?.role !== "admin") return;
  showView(tab.dataset.view);
}));
els.entryDate.addEventListener("change", render);
els.dailyRows.addEventListener("click", changeQuantity);
els.lossRows.addEventListener("click", changeQuantity);
els.saveTransactionBtn.addEventListener("click", saveTransaction);
els.saveLossBtn.addEventListener("click", saveLosses);
els.noteForm.addEventListener("submit", saveNote);
els.noteRows.addEventListener("change", updateNoteRead);
els.saveCashBtn.addEventListener("click", saveCash);
els.cashView.addEventListener("input", previewCash);
els.personForm.addEventListener("submit", addPerson);
els.ranchoScheduleRows.addEventListener("change", updateRanchoSchedule);
els.ranchoMealRows.addEventListener("change", updateRanchoMeal);
els.addProductBtn.addEventListener("click", addProduct);
els.inventoryRows.addEventListener("input", updateInventory);
els.inventoryRows.addEventListener("click", updateInventory);
els.exportBtn.addEventListener("click", exportExcel);

els.entryDate.value = operationalDate();
render();
