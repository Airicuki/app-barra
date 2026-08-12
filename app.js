alert("APP.JS CARGADO");

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
  reportDate: document.getElementById("reportDate"),
  loadCashReportBtn: document.getElementById("loadCashReportBtn"),
  cashReport: document.getElementById("cashReport"),
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

async function login(event) {
  event.preventDefault();
  console.log("📱 LOGIN EJECUTADO");
  alert("Login ejecutado");
  const username = els.username.value.trim();
  const password = els.password.value;

  els.loginError.textContent = "";

  if (!username || !password) {
    els.loginError.textContent = "Introduce usuario y contraseña.";
    return;
  }

  try {
    // 1. Buscar el email asociado al username
    const { data: email, error: emailError } = await db.rpc(
      "get_login_email",
      {
        p_username: username
      }
    );

    if (emailError || !email) {
      els.loginError.textContent = "Usuario o contraseña incorrectos.";
      return;
    }

    // 2. Iniciar sesión en Supabase Auth
    const { data: authData, error: authError } =
      await db.auth.signInWithPassword({
        email: email,
        password: password
      });

    if (authError) {
      console.error("❌ Error de autenticación:", authError);
      els.loginError.textContent = "Usuario o contraseña incorrectos.";
      return;
    }

    // 3. Obtener los datos y el rol del usuario
    const { data: profile, error: profileError } = await db
      .from("usuarios")
      .select("id, username, email, rol")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      console.error("❌ No se pudo obtener el perfil:", profileError);

      await db.auth.signOut();

      els.loginError.textContent = "No se ha podido cargar el perfil del usuario.";
      return;
    }

    // 4. Crear la sesión de nuestra aplicación
    session = {
      userId: authData.user.id,
      username: profile.username,
      email: profile.email,
      role: profile.rol
    };

    console.log("✅ Login correcto");
    console.log("👤 Usuario:", session.username);
    console.log("🔐 Rol:", session.role);

    // 5. Ahora que estamos autenticados, cargar productos
    const productsLoaded = await loadProductsFromSupabase();

    if (!productsLoaded) {
      console.error("❌ No se pudo cargar el inventario.");

      await db.auth.signOut();

      els.loginError.textContent = "No se ha podido cargar el inventario.";
      return;
    }

    // 6. Limpiar formulario y entrar
    els.loginForm.reset();
    els.loginError.textContent = "";

    showDashboard();

  } catch (error) {
    console.error("❌ Error inesperado durante el login:", error);
    els.loginError.textContent = "Ha ocurrido un error al iniciar sesión.";
  }
}

async function showDashboard() {
  els.loginView.classList.add("hidden");
  els.dashboardView.classList.remove("hidden");

  els.roleBadge.textContent = session.label;

  els.adminOnly.forEach((node) =>
    node.classList.toggle("hidden", session.role !== "admin")
  );

  if (session.role !== "admin") {
    showView("dailyView");
  }

  // Cargar la caja real desde Supabase
  await loadCashFromSupabase();

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

async function saveTransaction() {
  const items = cartItems(cart);

  if (!items.length) return;

  // Comprobar que hay stock suficiente antes de enviar la venta
  const sinStock = items.find(
    ({ product, qty }) => Number(product.stock || 0) < qty
  );

  if (sinStock) {
    alert(
      `No hay suficiente stock de ${sinStock.product.name}. ` +
      `Stock disponible: ${sinStock.product.stock}`
    );
    return;
  }

  const date = els.entryDate.value;

  const total = items.reduce(
    (sum, item) => sum + item.qty * item.price,
    0
  );

  // Evitar dobles pulsaciones mientras se guarda
  els.saveTransactionBtn.disabled = true;

  try {
    // Preparar los productos para Supabase
    const supabaseItems = items.map(({ product, qty, price }) => ({
      productId: product.id,
      qty: qty,
      price: price
    }));

    console.log("🛒 Guardando venta en Supabase:", {
      usuario: session.username,
      total,
      items: supabaseItems
    });

    // Registrar venta + detalle + descuento de stock
    // Todo se realiza dentro de la función PostgreSQL
    const { data: ventaId, error } = await db.rpc(
      "registrar_venta",
      {
        p_fecha: date,
        p_usuario: session.username,
        p_total: total,
        p_items: supabaseItems
      }
    );

    if (error) {
      console.error("❌ Error guardando venta:", error);

      if (error.message?.toLowerCase().includes("stock insuficiente")) {
        alert("No hay suficiente stock para realizar la venta.");
      } else {
        alert("No se ha podido guardar la venta.");
      }

      return;
    }

    console.log("✅ Venta guardada en Supabase:", ventaId);

    // Actualizar la copia local SOLO después de que Supabase
    // haya confirmado correctamente la operación
    items.forEach(({ product, qty, price }) => {
      product.stock = Math.max(
        0,
        Number(product.stock || 0) - qty
      );

      addEntry(date, product.id, {
        sold: qty,
        lost: 0,
        price
      });
    });

    // Mantener también la venta en el estado local
    // para que la aplicación pueda mostrarla inmediatamente
    const transaction = {
      id: ventaId,
      time: new Date().toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit"
      }),
      user: session.username,
      items: items.map(({ product, qty, price }) => ({
        productId: product.id,
        name: product.name,
        qty,
        price
      })),
      total
    };

    state.transactions[date] = state.transactions[date] || [];
    state.transactions[date].push(transaction);

    // Vaciar carrito
    cart = {};

    // Guardamos el estado local como caché de la aplicación
    saveState();

    // Volver a cargar el inventario desde Supabase
    // para asegurarnos de que tenemos los valores reales
    await loadProductsFromSupabase();

    render();

    flash(
      els.saveStatus,
      "Venta guardada correctamente."
    );

  } catch (error) {
    console.error("❌ Error inesperado guardando venta:", error);
    alert("Ha ocurrido un error al guardar la venta.");

  } finally {
    els.saveTransactionBtn.disabled = false;
  }
}

async function saveLosses() {
  const items = cartItems(lossCart);

  if (!items.length) return;

  // Comprobar stock antes de enviar
  const sinStock = items.find(
    ({ product, qty }) => Number(product.stock || 0) < qty
  );

  if (sinStock) {
    alert(
      `No hay suficiente stock de ${sinStock.product.name}. ` +
      `Stock disponible: ${sinStock.product.stock}`
    );
    return;
  }

  const date = els.entryDate.value;

  // Evitar dobles pulsaciones
  els.saveLossBtn.disabled = true;

  try {
    for (const { product, qty, price } of items) {

      console.log("📦 Registrando pérdida:", {
        usuario: session.username,
        producto: product.name,
        cantidad: qty
      });

      const { data: perdidaId, error } = await db.rpc(
        "registrar_perdida",
        {
          p_fecha: date,
          p_usuario: session.username,
          p_producto_id: product.id,
          p_cantidad: qty,
          p_precio: price
        }
      );

      if (error) {
        console.error("❌ Error registrando pérdida:", error);

        if (error.message?.toLowerCase().includes("stock insuficiente")) {
          alert(
            `No hay suficiente stock de ${product.name}.`
          );
        } else {
          alert(
            `No se ha podido registrar la pérdida de ${product.name}.`
          );
        }

        return;
      }

      console.log(
        "✅ Pérdida guardada en Supabase:",
        perdidaId
      );

      // Actualizar el registro diario de la aplicación
      addEntry(date, product.id, {
        sold: 0,
        lost: qty,
        price
      });
    }

    // Vaciar carrito
    lossCart = {};

    // Recargar el inventario real desde Supabase
    await loadProductsFromSupabase();

    // Guardamos el resto del estado local
    saveState();

    render();

    flash(
      els.saveStatus,
      "Pérdidas guardadas correctamente."
    );

  } catch (error) {
    console.error(
      "❌ Error inesperado guardando pérdidas:",
      error
    );

    alert("Ha ocurrido un error al guardar las pérdidas.");

  } finally {
    els.saveLossBtn.disabled = false;
  }
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

  // Solo estos roles pueden gestionar las notas:
  // marcar como leído y eliminar.
  const canManageNotes =
    session?.role === "admin" ||
    session?.role === "jefeBarra";

  rows
    .slice()
    .reverse()
    .forEach((note) => {

      const card = document.createElement("article");
      card.className = "row-card note-row";

      // =====================================================
      // CONCEPTO
      // =====================================================

      const concept = document.createElement("div");

      const conceptStrong = document.createElement("strong");
      conceptStrong.textContent = note.concept;

      concept.append(conceptStrong);

      // =====================================================
      // PROVEEDOR
      // =====================================================

      const provider = document.createElement("div");
      provider.textContent = note.provider;

      // =====================================================
      // IMPORTE
      // =====================================================

      const amount = document.createElement("div");

      const amountStrong = document.createElement("strong");
      amountStrong.textContent = formatMoney(note.amount);

      amount.append(amountStrong);

      // =====================================================
      // CHECK LEÍDO / PENDIENTE
      // =====================================================

      const read = document.createElement("label");

      read.className =
        `checkbox-field ${
          note.read
            ? "note-read"
            : "note-pending"
        }`;

      const checkbox = document.createElement("input");

      checkbox.type = "checkbox";
      checkbox.dataset.noteRead = note.id;
      checkbox.checked = Boolean(note.read);

      // Solo admin y jefeBarra pueden modificarlo.
      checkbox.disabled = !canManageNotes;

      const readText = document.createElement("span");

      readText.textContent =
        note.read
          ? "Leído"
          : "Pendiente";

      read.append(
        checkbox,
        readText
      );

      // =====================================================
      // INFORMACIÓN DE LA NOTA
      // =====================================================

      const meta = document.createElement("small");

      meta.className = "note-meta";

      meta.textContent =
        `Guardada a las ${note.time || "—"} por ${
          note.savedBy || "—"
        }`;

      // =====================================================
      // IMAGEN
      // =====================================================

      let image = null;

      if (note.imageUrl) {

        image = document.createElement("div");

        image.className = "note-image";

        const link = document.createElement("a");

        link.href = note.imageUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        const img = document.createElement("img");

        img.src = note.imageUrl;
        img.alt = "Imagen adjunta a la nota";
        img.loading = "lazy";

        link.append(img);
        image.append(link);
      }

      // =====================================================
      // BOTÓN ELIMINAR
      // =====================================================

      let actions = null;

      if (canManageNotes) {

        actions = document.createElement("div");

        actions.className = "note-actions";

        const deleteButton =
          document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className =
          "danger note-delete-btn";

        deleteButton.dataset.noteDelete =
          note.id;

        deleteButton.textContent =
          "🗑️ Eliminar";

        actions.append(deleteButton);
      }

      // =====================================================
      // CONSTRUIR TARJETA
      // =====================================================

      card.append(
        concept,
        provider,
        amount,
        read,
        meta
      );

      if (image) {
        card.append(image);
      }

      if (actions) {
        card.append(actions);
      }

      els.noteRows.append(card);
    });
}

async function saveNote(event) {
  event.preventDefault();

  const savedBy = window.prompt(
    "Nombre de la persona que guarda la nota"
  );

  if (!savedBy || !savedBy.trim()) return;

  const date = els.entryDate.value;
  const concept = els.noteConcept.value.trim();
  const provider = els.noteProvider.value.trim();
  const amount = Math.max(
    0,
    Number(els.noteAmount.value || 0)
  );

  if (!concept || !provider) {
    alert("Completa el concepto y el proveedor.");
    return;
  }

  const imageInput = document.getElementById("noteImage");
  const imageFile = imageInput?.files?.[0] || null;

  const now = new Date();

  const time = now.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const submitButton =
    els.noteForm.querySelector('button[type="submit"]');

  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    let imageUrl = null;

    // =====================================================
    // SUBIR IMAGEN SI SE HA SELECCIONADO
    // =====================================================

    if (imageFile) {
      if (!imageFile.type.startsWith("image/")) {
        alert("El archivo seleccionado no es una imagen.");
        return;
      }

      // Limitar tamaño a 5 MB
      if (imageFile.size > 5 * 1024 * 1024) {
        alert("La imagen no puede superar los 5 MB.");
        return;
      }

      const extension =
        imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

      const fileName =
        `${crypto.randomUUID()}.${extension}`;

      const filePath =
        `${date}/${fileName}`;

      const { error: uploadError } = await db
        .storage
        .from("notas")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false
        });

      if (uploadError) {
        console.error(
          "❌ Error subiendo imagen:",
          uploadError
        );

        alert(
          "No se ha podido subir la imagen."
        );

        return;
      }

      const { data: publicUrlData } =
        db.storage
          .from("notas")
          .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;

      console.log(
        "✅ Imagen subida:",
        imageUrl
      );
    }

    // =====================================================
    // GUARDAR NOTA
    // =====================================================

    const { data, error } = await db
      .from("notas")
      .insert({
        fecha: date,
        hora: time,
        usuario: savedBy.trim(),
        concepto: concept,
        proveedor: provider,
        importe: amount,
        leido: false,
        imagen_url: imageUrl
      })
      .select()
      .single();

    if (error) {
      console.error(
        "❌ Error guardando nota en Supabase:",
        error
      );

      alert(
        "No se ha podido guardar la nota."
      );

      return;
    }

    console.log(
      "✅ Nota guardada en Supabase:",
      data
    );

    // =====================================================
    // ACTUALIZAR ESTADO LOCAL
    // =====================================================

    const note = {
      id: data.id,
      concept: data.concepto,
      provider: data.proveedor,
      amount: Number(data.importe || 0),
      read: data.leido,
      savedBy: data.usuario,
      time: data.hora,
      imageUrl: data.imagen_url || null
    };

    state.notes[date] =
      state.notes[date] || [];

    state.notes[date].push(note);

    saveState();

    els.noteForm.reset();

    renderNotes();

    console.log(
      "✅ Nota añadida correctamente:",
      note
    );

  } catch (error) {

    console.error(
      "❌ Error inesperado guardando nota:",
      error
    );

    alert(
      "Ha ocurrido un error al guardar la nota."
    );

  } finally {

    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

async function updateNoteRead(event) {
  const input = event.target.closest("[data-note-read]");

  if (!input) return;

  // Solo admin y jefeBarra pueden marcar notas
  if (!["admin", "jefeBarra"].includes(session?.role)) {
    return;
  }

  const noteId = input.dataset.noteRead;
  const read = input.checked;

  const rows = state.notes[els.entryDate.value] || [];

  const note = rows.find(
    (item) => item.id === noteId
  );

  if (!note) return;

  // Desactivar mientras se guarda
  input.disabled = true;

  try {
    const { data, error } = await db
      .from("notas")
      .update({
        leido: read
      })
      .eq("id", noteId)
      .select()
      .single();

    if (error) {
      console.error(
        "❌ Error actualizando estado de nota:",
        error
      );

      // Volvemos a poner el checkbox como estaba
      input.checked = note.read;

      alert(
        "No se ha podido actualizar el estado de la nota."
      );

      return;
    }

    // Actualizamos nuestra copia local
    note.read = data.leido;

    saveState();
    renderNotes();

    console.log(
      "✅ Estado de nota actualizado en Supabase:",
      data
    );

  } catch (error) {
    console.error(
      "❌ Error inesperado actualizando nota:",
      error
    );

    input.checked = note.read;

  } finally {
    input.disabled = false;
  }
}

async function deleteNote(event) {
  const button = event.target.closest("[data-note-delete]");

  if (!button) return;

  // Solo admin y jefeBarra pueden eliminar
  if (!["admin", "jefeBarra"].includes(session?.role)) {
    return;
  }

  const noteId = button.dataset.noteDelete;

  const rows = state.notes[els.entryDate.value] || [];

  const note = rows.find(
    (item) => item.id === noteId
  );

  if (!note) return;

  const confirmed = window.confirm(
    `¿Quieres eliminar la nota "${note.concept}"?`
  );

  if (!confirmed) return;

  button.disabled = true;

  try {
    const { error } = await db
      .from("notas")
      .delete()
      .eq("id", noteId);

    if (error) {
      console.error(
        "❌ Error eliminando nota de Supabase:",
        error
      );

      alert(
        "No se ha podido eliminar la nota."
      );

      return;
    }

    // Eliminar también de nuestra copia local
    state.notes[els.entryDate.value] =
      rows.filter(
        (item) => item.id !== noteId
      );

    saveState();
    renderNotes();

    console.log(
      "🗑️ Nota eliminada correctamente:",
      noteId
    );

  } catch (error) {
    console.error(
      "❌ Error inesperado eliminando nota:",
      error
    );

    alert(
      "Ha ocurrido un error al eliminar la nota."
    );

  } finally {
    button.disabled = false;
  }
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

async function saveCash() {
  const date = els.entryDate.value;
  const cash = readCashFromScreen();

  try {
    // Guardamos exactamente el conteo que ya utiliza la aplicación
    const { data, error } = await db
      .from("caja")
      .upsert(
        {
          fecha: date,
          tipo: "diaria",
          datos: cash,
          usuario: session.username,
          actualizado_en: new Date().toISOString()
        },
        {
          onConflict: "fecha"
        }
      )
      .select()
      .single();

    if (error) {
      console.error("❌ Error guardando caja:", error);
      alert("No se ha podido guardar la caja.");
      return;
    }

    console.log("✅ Caja guardada en Supabase:", data);

    // Mantener la copia local para que la aplicación siga funcionando
    // mientras terminamos de migrar todos los módulos.
    state.cashCounts[date] = cash;
    saveState();

    renderCashDiffs(cash);

    flash(
      els.cashStatus,
      "Caja guardada correctamente."
    );

  } catch (error) {
    console.error("❌ Error inesperado guardando caja:", error);
    alert("Ha ocurrido un error al guardar la caja.");
  }
}

async function loadCashFromSupabase(date = els.entryDate.value) {
  const { data, error } = await db
    .from("caja")
    .select("id, fecha, tipo, datos, usuario, actualizado_en")
    .eq("fecha", date)
    .maybeSingle();

  if (error) {
    console.error("❌ Error cargando caja desde Supabase:", error);
    return false;
  }

  if (!data) {
    console.log("ℹ️ No existe caja para:", date);

    state.cashCounts[date] = normalizeCashCount({});
    return true;
  }

  state.cashCounts[date] = normalizeCashCount(data.datos);

  console.log("✅ Caja cargada desde Supabase:", data);

  return true;
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
      control.disabled = !["admin", "jefeBarra"].includes(session?.role);
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

async function updateInventory(event) {
  if (!["admin", "jefeBarra"].includes(session?.role)) return;

  const row = event.target.closest(".inventory-row");
  if (!row) return;

  // Solo guardamos al pulsar Enter
  if (event.type === "keydown" && event.key !== "Enter") {
    return;
  }

  if (event.type !== "keydown") {
    return;
  }

  const product = state.products.find(
    (item) => item.id === row.dataset.productId
  );

  if (!product) return;

  const nombre =
    row.querySelector("[data-name]").value.trim() || "Sin nombre";

  const stock = Math.max(
    0,
    Number(row.querySelector("[data-stock]").value || 0)
  );

  const precio = Math.max(
    0,
    Number(row.querySelector("[data-price]").value || 0)
  );

  const { data, error } = await db
    .from("productos")
    .update({
      nombre,
      stock,
      precio
    })
    .eq("id", product.id)
    .select()
    .single();

  if (error) {
    console.error("❌ Error actualizando producto:", error);
    alert("No se ha podido guardar el producto.");
    return;
  }

  // Actualizamos nuestra copia local
  product.name = data.nombre;
  product.stock = data.stock;
  product.price = Number(data.precio);

  console.log("✅ Producto guardado en Supabase:", data);

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
alert("LLEGANDO AL LISTENER DEL LOGIN");
els.loginForm.addEventListener("submit", login);
els.logoutBtn.addEventListener("click", logout);
els.tabs.forEach((tab) => tab.addEventListener("click", () => {
  if (tab.classList.contains("admin-only") && session?.role !== "admin") return;
  showView(tab.dataset.view);
}));
els.entryDate.addEventListener("change", async () => {
  await loadCashFromSupabase();
  render();
});
els.dailyRows.addEventListener("click", changeQuantity);
els.lossRows.addEventListener("click", changeQuantity);
els.saveTransactionBtn.addEventListener("click", saveTransaction);
els.saveLossBtn.addEventListener("click", saveLosses);
els.noteForm.addEventListener("submit", saveNote);

els.noteRows.addEventListener(
  "change",
  updateNoteRead
);

els.noteRows.addEventListener(
  "click",
  deleteNote
);
els.saveCashBtn.addEventListener("click", saveCash);
els.cashView.addEventListener("input", previewCash);
els.personForm.addEventListener("submit", addPerson);
els.ranchoScheduleRows.addEventListener("change", updateRanchoSchedule);
els.ranchoMealRows.addEventListener("change", updateRanchoMeal);
els.addProductBtn.addEventListener("click", addProduct);
els.inventoryRows.addEventListener("keydown", updateInventory);
els.exportBtn.addEventListener("click", exportExcel);
els.loadCashReportBtn.addEventListener("click", loadCashReport);
els.reportDate.addEventListener("change", loadCashReport);

els.entryDate.value = operationalDate();

async function initializeApp() {
  await loadProductsFromSupabase();
  render();
}

initializeApp();


async function testSupabaseConnection() {
  const { data, error } = await db
    .from("productos")
    .select("*");

  if (error) {
    console.error("❌ Error conectando con Supabase:", error);
    return;
  }

  console.log("✅ Conexión con Supabase correcta");
  console.log("Productos encontrados:", data);
}

testSupabaseConnection();

async function migrateProductsToSupabase() {
  const products = defaultState.products;

  const rows = products.map(product => ({
    id: product.id,
    nombre: product.name,
    stock: product.stock,
    precio: product.price,
    activo: true
  }));

  const { data, error } = await db
    .from("productos")
    .insert(rows)
    .select();

  if (error) {
    console.error("❌ Error migrando productos:", error);
    return;
  }

  console.log("✅ Productos migrados a Supabase:", data);
}

async function loadProductsFromSupabase() {
  const { data, error } = await db
    .from("productos")
    .select("*")
    .eq("activo", true)
    .order("nombre");

  if (error) {
    console.error("❌ Error cargando inventario:", error);
    return false;
  }

  state.products = data.map(product => ({
    id: product.id,
    name: product.nombre,
    stock: product.stock,
    price: Number(product.precio),
    activo: product.activo
  }));

  console.log("✅ Inventario cargado desde Supabase:", state.products);

  return true;
}

async function loginSupabase(email, password) {
  const { data, error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error("❌ Error de login:", error);
    return false;
  }

  console.log("✅ Login correcto:", data.user.email);
  return true;
}


async function getCurrentUserRole() {
  const {
    data: { user },
    error
  } = await db.auth.getUser();

  if (error || !user) {
    console.log("No hay usuario autenticado");
    return null;
  }

  const { data, error: roleError } = await db
    .from("usuarios")
    .select("nombre, email, rol")
    .eq("id", user.id)
    .single();

  if (roleError) {
    console.error("❌ No se pudo obtener el rol:", roleError);
    return null;
  }

  console.log("👤 Usuario:", data);
  return data;
}


async function logoutSupabase() {
  const { error } = await db.auth.signOut();

  if (error) {
    console.error("❌ Error cerrando sesión:", error);
    return;
  }

  console.log("✅ Sesión cerrada");
}


async function loadCashReport() {
  const date = els.reportDate.value;

  if (!date) {
    alert("Selecciona un día.");
    return;
  }

  els.cashReport.innerHTML = "Cargando...";

  try {
    // 1. Obtener la caja del día
    const { data: caja, error: cajaError } = await db
      .from("caja")
      .select("id, fecha, datos, usuario, actualizado_en")
      .eq("fecha", date)
      .maybeSingle();

    if (cajaError) {
      console.error("❌ Error consultando caja:", cajaError);
      els.cashReport.innerHTML =
        "<p class='error'>No se pudo consultar la caja.</p>";
      return;
    }

    if (!caja) {
      els.cashReport.innerHTML =
        `<p class="muted">No existe una caja registrada para ${date}.</p>`;
      return;
    }

    // 2. Obtener las ventas de esa caja
    // Lo hacemos por separado para evitar problemas con
    // las relaciones anidadas de Supabase.
    const { data: ventasBase, error: ventasError } = await db
      .from("ventas")
      .select("id, fecha, usuario, total")
      .eq("caja_id", caja.id)
      .order("fecha", { ascending: true });

    if (ventasError) {
      console.error("❌ Error consultando ventas:", ventasError);
      throw ventasError;
    }

    const ventas = ventasBase || [];

    console.log("✅ Ventas encontradas:", ventas);

    // 3. Obtener los detalles de las ventas
    let detallesVentas = [];

    if (ventas.length) {
      const ventaIds = ventas.map((venta) => venta.id);

      const { data: detalles, error: detallesError } = await db
        .from("detalle_ventas")
        .select("id, venta_id, producto_id, cantidad, precio")
        .in("venta_id", ventaIds);

      if (detallesError) {
        console.error(
          "❌ Error consultando detalle de ventas:",
          detallesError
        );
        throw detallesError;
      }

      detallesVentas = detalles || [];

      console.log(
        "✅ Detalles de ventas encontrados:",
        detallesVentas
      );
    }

    // 4. Obtener los productos de esas ventas
    let productosVentas = [];

    if (detallesVentas.length) {
      const productoIds = [
        ...new Set(
          detallesVentas.map(
            (detalle) => detalle.producto_id
          )
        )
      ];

      const { data: productos, error: productosError } = await db
        .from("productos")
        .select("id, nombre")
        .in("id", productoIds);

      if (productosError) {
        console.error(
          "❌ Error consultando productos de ventas:",
          productosError
        );
        throw productosError;
      }

      productosVentas = productos || [];

      console.log(
        "✅ Productos de ventas encontrados:",
        productosVentas
      );
    }

    // 5. Asociar cada detalle con su producto
    ventas.forEach((venta) => {
      venta.detalle_ventas = detallesVentas
        .filter(
          (detalle) => detalle.venta_id === venta.id
        )
        .map((detalle) => {
          const producto = productosVentas.find(
            (producto) =>
              producto.id === detalle.producto_id
          );

          return {
            ...detalle,
            productos: producto || null
          };
        });
    });

    // 6. Obtener pérdidas de esa caja
    const { data: perdidasBase, error: perdidasError } = await db
      .from("perdidas")
      .select(`
        id,
        fecha,
        usuario,
        cantidad,
        precio,
        producto_id
      `)
      .eq("caja_id", caja.id)
      .order("fecha", { ascending: true });

    if (perdidasError) {
      console.error(
        "❌ Error consultando pérdidas:",
        perdidasError
      );
      throw perdidasError;
    }

    const perdidas = perdidasBase || [];

    // 7. Obtener productos de las pérdidas
    let productosPerdidas = [];

    if (perdidas.length) {
      const productoIdsPerdidas = [
        ...new Set(
          perdidas
            .map((perdida) => perdida.producto_id)
            .filter(Boolean)
        )
      ];

      if (productoIdsPerdidas.length) {
        const { data: productos, error: productosError } =
          await db
            .from("productos")
            .select("id, nombre")
            .in("id", productoIdsPerdidas);

        if (productosError) {
          console.error(
            "❌ Error consultando productos de pérdidas:",
            productosError
          );
          throw productosError;
        }

        productosPerdidas = productos || [];
      }
    }

    // 8. Asociar cada pérdida con su producto
    const perdidasConProducto = perdidas.map((perdida) => ({
      ...perdida,
      productos:
        productosPerdidas.find(
          (producto) =>
            producto.id === perdida.producto_id
        ) || null
    }));

    console.log("✅ Caja consultada:", caja);
    console.log("✅ Ventas:", ventas);
    console.log(
      "✅ Pérdidas:",
      perdidasConProducto
    );

    // 9. Pintar el informe
    renderCashReport(
      caja,
      ventas,
      perdidasConProducto
    );

  } catch (error) {
    console.error(
      "❌ Error generando informe de caja:",
      error
    );

    els.cashReport.innerHTML =
      "<p class='error'>Error al generar el informe.</p>";
  }
}

function renderCashDenominations(count, title) {
  if (!count) {
    return `
      <div class="cash-report-count">
        <h4>${title}</h4>
        <p class="muted">Sin conteo registrado.</p>
      </div>
    `;
  }

  const denominations = count.denominations || {};

  const rows = cashDenominations
    .map(({ value, label }) => {
      const quantity = Number(denominations[String(value)] || 0);
      const subtotal = quantity * value;

      return `
        <tr>
          <td>${label}</td>
          <td>${quantity}</td>
          <td>${subtotal.toFixed(2)} €</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="cash-report-count">
      <h4>${title}</h4>

      <table>
        <thead>
          <tr>
            <th>Denominación</th>
            <th>Unidades</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>

        <tfoot>
          <tr>
            <th colspan="2">Total contado</th>
            <th>${Number(count.total || 0).toFixed(2)} €</th>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
}


function renderCashReport(caja, ventas, perdidas) {
  const datos = caja.datos || {};

  const morning = datos.morning?.total || 0;
  const start = datos.start?.total || 0;
  const end = datos.end?.total || 0;

  const diffStart = start - morning;
  const diffEnd = end - start;
  const diffDay = end - morning;

  const conteoMorning = renderCashDenominations(
    datos.morning,
    "Entrada de turno"
  );
  
  const conteoStart = renderCashDenominations(
    datos.start,
    "Inicio de barra"
  );
  
  const conteoEnd = renderCashDenominations(
    datos.end,
    "Final de barra"
  );

  const totalVentas = ventas.reduce(
    (sum, venta) => sum + Number(venta.total || 0),
    0
  );

  const totalPerdidas = perdidas.reduce(
    (sum, perdida) =>
      sum + Number(perdida.cantidad || 0) * Number(perdida.precio || 0),
    0
  );

  const ventasHTML = ventas.length
    ? ventas.map(venta => {
        const hora = new Date(venta.fecha).toLocaleTimeString(
          "es-ES",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        );

        const productos = (venta.detalle_ventas || [])
          .map(detalle => {
            const nombre =
              detalle.productos?.nombre || "Producto";

            return `${nombre} × ${detalle.cantidad}`;
          })
          .join(", ");

        return `
          <tr>
            <td>${hora}</td>
            <td>${venta.usuario}</td>
            <td>${productos}</td>
            <td>${Number(venta.total).toFixed(2)} €</td>
          </tr>
        `;
      }).join("")
    : `
      <tr>
        <td colspan="4">No hay ventas.</td>
      </tr>
    `;

  const perdidasHTML = perdidas.length
    ? perdidas.map(perdida => {
        const hora = new Date(perdida.fecha).toLocaleTimeString(
          "es-ES",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        );

        return `
          <tr>
            <td>${hora}</td>
            <td>${perdida.usuario}</td>
            <td>${perdida.productos?.nombre || "Producto"}</td>
            <td>${perdida.cantidad}</td>
            <td>
              ${(Number(perdida.cantidad) * Number(perdida.precio)).toFixed(2)}
              €
            </td>
          </tr>
        `;
      }).join("")
    : `
      <tr>
        <td colspan="5">No hay pérdidas.</td>
      </tr>
    `;

  els.cashReport.innerHTML = `
    <section class="report-card">

      <h3>💰 Caja del ${caja.fecha}</h3>

      <div class="summary-grid compact">

        <article>
          <span>Entrada</span>
          <strong>${morning.toFixed(2)} €</strong>
        </article>

        <article>
          <span>Inicio</span>
          <strong>${start.toFixed(2)} €</strong>
        </article>

        <article>
          <span>Final</span>
          <strong>${end.toFixed(2)} €</strong>
        </article>

        <article>
          <span>Final - Entrada</span>
          <strong>${diffDay.toFixed(2)} €</strong>
        </article>

      </div>

      <h3>💶 Conteo de efectivo</h3>

      <div class="cash-report-counts">

        ${conteoMorning}

        ${conteoStart}

        ${conteoEnd}

      </div>

      <h3>🛒 Ventas</h3>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Hora</th>
              <th>Usuario</th>
              <th>Productos</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            ${ventasHTML}
          </tbody>

          <tfoot>
            <tr>
              <th colspan="3">Total ventas</th>
              <th>${totalVentas.toFixed(2)} €</th>
            </tr>
          </tfoot>
        </table>
      </div>

      <h3>❌ Pérdidas</h3>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Hora</th>
              <th>Usuario</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Valor</th>
            </tr>
          </thead>

          <tbody>
            ${perdidasHTML}
          </tbody>

          <tfoot>
            <tr>
              <th colspan="4">Valor pérdidas</th>
              <th>${totalPerdidas.toFixed(2)} €</th>
            </tr>
          </tfoot>
        </table>
      </div>

    </section>
  `;
}

async function testAuth() {
  const {
    data: { session }
  } = await db.auth.getSession();

  if (session) {
    console.log("🔐 Ya hay una sesión:", session.user.email);
  } else {
    console.log("🔓 No hay sesión activa");
  }
}

testAuth();