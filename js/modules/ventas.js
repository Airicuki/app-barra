import {
    state,
    session,
    cart,
    setCart,
    saveState
  } from "../state/state.js";
  
  import { els } from "../utils/dom.js";
  
  import { formatMoney } from "../utils/format.js";
  
  import {
    registrarVenta
  } from "../services/ventas.service.js";
  
  import {
    loadProductsFromSupabase
  } from "./inventario.js";
  
  
  // ============================================================
  // INICIALIZACIÓN
  // ============================================================
  
  export function initVentas() {
  
    if (els.dailyRows) {
      els.dailyRows.addEventListener(
        "click",
        changeQuantity
      );
    }
  
    if (els.saveTransactionBtn) {
      els.saveTransactionBtn.addEventListener(
        "click",
        saveTransaction
      );
    }
  }
  
  
  // ============================================================
  // RENDER
  // ============================================================
  
  export function renderVentas() {
  
    renderProductSteppers();
  
    renderTransactions();
  }
  
  
  // ============================================================
  // PRODUCTOS PARA VENTA
  // ============================================================
  
  function renderProductSteppers() {
  
    renderStepperList(
      els.dailyRows,
      cart,
      "sale"
    );
  
    renderCartSummary();
  }
  
  
  function renderStepperList(
    container,
    source,
    mode
  ) {
  
    if (!container) {
      return;
    }
  
    const template =
      document.querySelector(
        "#productStepperTemplate"
      );
  
    if (!template) {
  
      console.error(
        "❌ No se encuentra #productStepperTemplate"
      );
  
      return;
    }
  
    container.replaceChildren();
  
    state.products.forEach(
      (product) => {
  
        const row =
          template.content
            .firstElementChild
            .cloneNode(true);
  
        row.dataset.productId =
          product.id;
  
        row.dataset.mode =
          mode;
  
        const name =
          row.querySelector(
            "[data-name]"
          );
  
        const stock =
          row.querySelector(
            "[data-stock]"
          );
  
        const qty =
          row.querySelector(
            "[data-qty]"
          );
  
        if (name) {
          name.textContent =
            product.name;
        }
  
        if (stock) {
          stock.textContent =
            `Stock actual: ${
              product.stock
            } · ${
              formatMoney(
                product.price
              )
            }`;
        }
  
        if (qty) {
          qty.textContent =
            source[product.id] || 0;
        }
  
        container.append(row);
      }
    );
  }
  
  
  // ============================================================
  // RESUMEN DEL CARRITO
  // ============================================================
  
  function renderCartSummary() {
  
    const items =
      cartItems(cart);
  
    const units =
      items.reduce(
        (sum, item) =>
          sum + item.qty,
        0
      );
  
    const total =
      items.reduce(
        (sum, item) =>
          sum +
          item.qty *
          item.price,
        0
      );
  
    if (els.cartTotal) {
      els.cartTotal.textContent =
        formatMoney(total);
    }
  
    if (els.cartUnits) {
      els.cartUnits.textContent =
        `${units} ${
          units === 1
            ? "producto"
            : "productos"
        }`;
    }
  
    if (els.saveTransactionBtn) {
      els.saveTransactionBtn.disabled =
        units === 0;
    }
  }
  
  
  // ============================================================
  // OBTENER PRODUCTOS DEL CARRITO
  // ============================================================
  
  function cartItems(source) {
  
    return Object.entries(source)
      .map(
        ([productId, qty]) => {
  
          const product =
            state.products.find(
              (item) =>
                item.id === productId
            );
  
          if (
            !product ||
            qty <= 0
          ) {
            return null;
          }
  
          return {
            product,
            productId,
            qty,
            price:
              Number(
                product.price || 0
              )
          };
        }
      )
      .filter(Boolean);
  }
  
  
  // ============================================================
  // CAMBIAR CANTIDAD
  // ============================================================
  
  function changeQuantity(event) {
  
    const button =
      event.target.closest(
        "button"
      );
  
    const row =
      event.target.closest(
        ".product-stepper-row"
      );
  
    if (!button || !row) {
      return;
    }
  
    const product =
      state.products.find(
        (item) =>
          item.id ===
          row.dataset.productId
      );
  
    if (!product) {
      return;
    }
  
    const current =
      cart[product.id] || 0;
  
    const next =
      button.matches(
        "[data-plus]"
      )
        ? current + 1
        : Math.max(
            0,
            current - 1
          );
  
    const newCart = {
      ...cart
    };
  
    if (next === 0) {
  
      delete newCart[
        product.id
      ];
  
    } else {
  
      newCart[
        product.id
      ] = next;
    }
  
    setCart(newCart);
  
    renderProductSteppers();
  }
  
  
  // ============================================================
  // GUARDAR VENTA
  // ============================================================
  
  async function saveTransaction() {
  
    const items =
      cartItems(cart);
  
    if (!items.length) {
      return;
    }
  
  
    // ----------------------------------------------------------
    // COMPROBAR STOCK
    // ----------------------------------------------------------
  
    const sinStock =
      items.find(
        ({
          product,
          qty
        }) =>
          Number(
            product.stock || 0
          ) < qty
      );
  
    if (sinStock) {
  
      alert(
        `No hay suficiente stock de ${
          sinStock.product.name
        }. Stock disponible: ${
          sinStock.product.stock
        }`
      );
  
      return;
    }
  
  
    // ----------------------------------------------------------
    // DATOS
    // ----------------------------------------------------------
  
    const date =
      els.entryDate.value;
  
    const total =
      items.reduce(
        (sum, item) =>
          sum +
          item.qty *
          item.price,
        0
      );
  
  
    if (els.saveTransactionBtn) {
      els.saveTransactionBtn.disabled =
        true;
    }
  
  
    try {
  
      // --------------------------------------------------------
      // PREPARAR ITEMS
      // --------------------------------------------------------
  
      const supabaseItems =
        items.map(
          ({
            product,
            qty,
            price
          }) => ({
            productId:
              product.id,
            qty,
            price
          })
        );
  
  
      console.log(
        "🛒 Guardando venta en Supabase:",
        {
          usuario:
            session?.username,
          total,
          items:
            supabaseItems
        }
      );
  
  
      // --------------------------------------------------------
      // GUARDAR EN SUPABASE
      // --------------------------------------------------------
  
      const {
        data: ventaId,
        error
      } =
        await registrarVenta(
          date,
          session.username,
          total,
          supabaseItems
        );
  
  
      if (error) {
  
        console.error(
          "❌ Error guardando venta:",
          error
        );
  
        if (
          error.message
            ?.toLowerCase()
            .includes(
              "stock insuficiente"
            )
        ) {
  
          alert(
            "No hay suficiente stock para realizar la venta."
          );
  
        } else {
  
          alert(
            "No se ha podido guardar la venta."
          );
        }
  
        return;
      }
  
  
      console.log(
        "✅ Venta guardada en Supabase:",
        ventaId
      );
  
  
      // --------------------------------------------------------
      // ACTUALIZAR ENTRADAS DIARIAS
      // --------------------------------------------------------
  
      items.forEach(
        ({
          product,
          qty,
          price
        }) => {
  
          product.stock =
            Math.max(
              0,
              Number(
                product.stock || 0
              ) - qty
            );
  
          addEntry(
            date,
            product.id,
            {
              sold: qty,
              lost: 0,
              price
            }
          );
        }
      );
  
  
      // --------------------------------------------------------
      // GUARDAR TRANSACCIÓN LOCAL
      // --------------------------------------------------------
  
      const transaction = {
  
        id: ventaId,
  
        time:
          new Date()
            .toLocaleTimeString(
              "es-ES",
              {
                hour:
                  "2-digit",
                minute:
                  "2-digit"
              }
            ),
  
        user:
          session.username,
  
        items:
          items.map(
            ({
              product,
              qty,
              price
            }) => ({
              productId:
                product.id,
              name:
                product.name,
              qty,
              price
            })
          ),
  
        total
      };
  
  
      state.transactions[date] =
        state.transactions[date] ||
        [];
  
      state.transactions[
        date
      ].push(transaction);
  
  
      // --------------------------------------------------------
      // VACIAR CARRITO
      // --------------------------------------------------------
  
      setCart({});
  
  
      // --------------------------------------------------------
      // GUARDAR CACHE LOCAL
      // --------------------------------------------------------
  
      saveState();
  
  
      // --------------------------------------------------------
      // RECARGAR INVENTARIO DESDE SUPABASE
      // --------------------------------------------------------
  
      await loadProductsFromSupabase();
  
  
      // --------------------------------------------------------
      // ACTUALIZAR PANTALLA
      // --------------------------------------------------------
  
      renderVentas();
  
  
      // --------------------------------------------------------
      // MENSAJE
      // --------------------------------------------------------
  
      if (els.saveStatus) {
  
        els.saveStatus.textContent =
          "Venta guardada correctamente.";
  
        setTimeout(
          () => {
            els.saveStatus.textContent =
              "";
          },
          2200
        );
      }
  
  
    } catch (error) {
  
      console.error(
        "❌ Error inesperado guardando venta:",
        error
      );
  
      alert(
        "Ha ocurrido un error al guardar la venta."
      );
  
    } finally {
  
      if (els.saveTransactionBtn) {
        els.saveTransactionBtn.disabled =
          false;
      }
    }
  }
  
  
  // ============================================================
  // ENTRADA DIARIA
  // ============================================================
  
  function addEntry(
    date,
    productId,
    movement
  ) {
  
    state.entries[date] =
      state.entries[date] ||
      [];
  
    let entry =
      state.entries[date].find(
        (row) =>
          row.productId ===
          productId
      );
  
    if (!entry) {
  
      entry = {
        productId,
        sold: 0,
        lost: 0,
        price:
          movement.price
      };
  
      state.entries[date].push(
        entry
      );
    }
  
    entry.sold +=
      movement.sold;
  
    entry.lost +=
      movement.lost;
  
    entry.price =
      movement.price;
  }
  
  
  // ============================================================
  // HISTORIAL DE VENTAS
  // ============================================================
  
  function renderTransactions() {
  
    if (!els.transactionRows) {
      return;
    }
  
    const rows =
      state.transactions[
        els.entryDate.value
      ] || [];
  
  
    els.transactionRows.replaceChildren();
  
  
    if (!rows.length) {
  
      const empty =
        document.createElement(
          "article"
        );
  
      empty.className =
        "row-card";
  
      empty.textContent =
        "Todavía no hay ventas guardadas hoy.";
  
      els.transactionRows.append(
        empty
      );
  
      return;
    }
  
  
    rows
      .slice()
      .reverse()
      .forEach(
        (transaction) => {
  
          const card =
            document.createElement(
              "article"
            );
  
          card.className =
            "row-card transaction-row";
  
  
          const title =
            document.createElement(
              "div"
            );
  
          const detail =
            document.createElement(
              "div"
            );
  
          const total =
            document.createElement(
              "strong"
            );
  
  
          title.className =
            "product-main";
  
  
          const titleStrong =
            document.createElement(
              "strong"
            );
  
          titleStrong.textContent =
            `${transaction.time} · ${transaction.user}`;
  
          title.append(
            titleStrong
          );
  
  
          detail.textContent =
            transaction.items
              .map(
                (item) =>
                  `${item.qty} x ${item.name}`
              )
              .join(", ");
  
  
          total.textContent =
            formatMoney(
              transaction.total
            );
  
  
          card.append(
            title,
            detail,
            total
          );
  
  
          els.transactionRows.append(
            card
          );
        }
      );
  }