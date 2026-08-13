import {
    state,
    session,
    cart,
    setCart,
    saveState
  } from "../state/state.js";
  
  import { els } from "../utils/dom.js";
  
  import { formatMoney } from "../utils/format.js";
  
  import { db } from "../config/supabase.js";
  
  import {
    loadBarProductsFromSupabase
  } from "../services/productos-barra.service.js";
  
  
  // ============================================================
  // INICIALIZACIÓN
  // ============================================================
  
  export async function initVentas() {
  
    console.log(
      "🍺 Inicializando módulo de ventas de barra..."
    );
  
  
    // ----------------------------------------------------------
    // BOTONES DE CANTIDAD
    // ----------------------------------------------------------
  
    if (els.dailyRows) {
  
      els.dailyRows.addEventListener(
        "click",
        changeQuantity
      );
  
    }
  
  
    // ----------------------------------------------------------
    // BOTÓN GUARDAR VENTA
    // ----------------------------------------------------------
  
    if (els.saveTransactionBtn) {
  
      els.saveTransactionBtn.addEventListener(
        "click",
        saveTransaction
      );
  
    }
  
  
    // ----------------------------------------------------------
    // CARGAR PRODUCTOS DE BARRA
    // ----------------------------------------------------------
  
    const loaded =
      await loadBarProductsFromSupabase();
  
  
    if (!loaded) {
  
      console.error(
        "❌ No se pudieron cargar los productos de barra."
      );
  
      return false;
  
    }
  
  
    // ----------------------------------------------------------
    // RENDER
    // ----------------------------------------------------------
  
    renderProductSteppers();
  
  
    return true;
  
  }
  
  
  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  
  export function renderVentas() {
  
    renderProductSteppers();
  
    renderTransactions();
  
  }
  
  
  // ============================================================
  // PRODUCTOS PARA VENTA
  // ============================================================
  
  export function renderProductSteppers() {
  
    renderBarProducts();
  
    renderCartSummary();
  
  }
  
  
  // ============================================================
  // RENDER PRODUCTOS DE BARRA
  // ============================================================
  
  function renderBarProducts() {
  
    if (!els.dailyRows) {
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
  
  
    els.dailyRows.replaceChildren();
  
  
    const products =
      state.barProducts || [];
  
  
    // ----------------------------------------------------------
    // SIN PRODUCTOS
    // ----------------------------------------------------------
  
    if (!products.length) {
  
      const empty =
        document.createElement(
          "article"
        );
  
  
      empty.className =
        "row-card";
  
  
      empty.textContent =
        "No hay productos configurados para la barra.";
  
  
      els.dailyRows.append(
        empty
      );
  
  
      return;
  
    }
  
  
    // ----------------------------------------------------------
    // PRODUCTOS
    // ----------------------------------------------------------
  
    products.forEach(
      (product) => {
  
        const row =
          template.content
            .firstElementChild
            .cloneNode(true);
  
  
        row.dataset.productId =
          product.id;
  
  
        row.dataset.mode =
          "sale";
  
  
        // ------------------------------------------------------
        // NOMBRE
        // ------------------------------------------------------
  
        const name =
          row.querySelector(
            "[data-name]"
          );
  
  
        if (name) {
  
          name.textContent =
            product.name;
  
        }
  
  
        // ------------------------------------------------------
        // PRECIO
        // ------------------------------------------------------
  
        const price =
          row.querySelector(
            "[data-stock]"
          );
  
  
        if (price) {
  
          price.textContent =
            `Precio: ${formatMoney(product.price)}`;
  
        }
  
  
        // ------------------------------------------------------
        // CANTIDAD
        // ------------------------------------------------------
  
        const qty =
          row.querySelector(
            "[data-qty]"
          );
  
  
        if (qty) {
  
          qty.textContent =
            cart[
              product.id
            ] || 0;
  
        }
  
  
        els.dailyRows.append(
          row
        );
  
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
  
  
    // ----------------------------------------------------------
    // TOTAL
    // ----------------------------------------------------------
  
    if (els.cartTotal) {
  
      els.cartTotal.textContent =
        formatMoney(total);
  
    }
  
  
    // ----------------------------------------------------------
    // UNIDADES
    // ----------------------------------------------------------
  
    if (els.cartUnits) {
  
      els.cartUnits.textContent =
        `${units} ${
          units === 1
            ? "producto"
            : "productos"
        }`;
  
    }
  
  
    // ----------------------------------------------------------
    // BOTÓN GUARDAR
    // ----------------------------------------------------------
  
    if (els.saveTransactionBtn) {
  
      els.saveTransactionBtn.disabled =
        units === 0;
  
    }
  
  }
  
  
  // ============================================================
  // OBTENER PRODUCTOS DEL CARRITO
  // ============================================================
  
  function cartItems(source) {
  
    return Object.entries(
      source || {}
    )
      .map(
        ([productId, qty]) => {
  
          const product =
            (
              state.barProducts || []
            ).find(
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
  
  
    if (
      !button ||
      !row
    ) {
  
      return;
  
    }
  
  
    const productId =
      row.dataset.productId;
  
  
    const product =
      (
        state.barProducts || []
      ).find(
        (item) =>
          item.id === productId
      );
  
  
    if (!product) {
  
      console.warn(
        "⚠️ Producto de barra no encontrado:",
        productId
      );
  
      return;
  
    }
  
  
    const current =
      cart[
        productId
      ] || 0;
  
  
    let next;
  
  
    // ----------------------------------------------------------
    // AÑADIR
    // ----------------------------------------------------------
  
    if (
      button.matches(
        "[data-plus]"
      )
    ) {
  
      next =
        current + 1;
  
    }
  
    // ----------------------------------------------------------
    // RESTAR
    // ----------------------------------------------------------
  
    else {
  
      next =
        Math.max(
          0,
          current - 1
        );
  
    }
  
  
    // ----------------------------------------------------------
    // ACTUALIZAR CARRITO
    // ----------------------------------------------------------
  
    if (next === 0) {
  
      delete cart[
        productId
      ];
  
    } else {
  
      cart[
        productId
      ] = next;
  
    }
  
  
    renderProductSteppers();
  
  }
  
  
  // ============================================================
  // GUARDAR VENTA DE BARRA
  // ============================================================
  
  async function saveTransaction() {
  
    const items =
      cartItems(cart);
  
  
    // ----------------------------------------------------------
    // COMPROBAR CARRITO
    // ----------------------------------------------------------
  
    if (!items.length) {
  
      return;
  
    }
  
  
    // ----------------------------------------------------------
    // DÍA OPERATIVO
    // ----------------------------------------------------------
  
    const date =
      els.entryDate?.value;
  
  
    if (!date) {
  
      console.error(
        "❌ No se ha podido determinar el día operativo."
      );
  
      alert(
        "No se ha podido determinar el día operativo."
      );
  
      return;
  
    }
  
  
    // ----------------------------------------------------------
    // CALCULAR TOTAL
    // ----------------------------------------------------------
  
    const total =
      items.reduce(
        (sum, item) =>
          sum +
          item.qty *
          item.price,
        0
      );
  
  
    if (
      !els.saveTransactionBtn
    ) {
  
      return;
  
    }
  
  
    els.saveTransactionBtn.disabled =
      true;
  
  
    try {
  
      // ========================================================
      // PREPARAR LÍNEAS
      // ========================================================
  
      const supabaseItems =
        items.map(
          ({
            product,
            qty,
            price
          }) => ({
  
            producto_id:
              product.id,
  
            cantidad:
              qty,
  
            precio:
              price
  
          })
        );
  
  
      console.log(
        "🍺 Guardando venta de barra:",
        {
          usuario:
            session.username,
  
          fecha:
            date,
  
          total,
  
          items:
            supabaseItems
        }
      );
  
  
      // ========================================================
      // GUARDAR EN SUPABASE
      // ========================================================
  
      const {
        data: ventaId,
        error
      } = await db.rpc(
        "registrar_venta_barra",
        {
  
          p_fecha:
            date,
  
          p_usuario:
            session.username,
  
          p_total:
            total,
  
          p_items:
            supabaseItems
  
        }
      );
  
  
      // ========================================================
      // ERROR
      // ========================================================
  
      if (error) {
  
        console.error(
          "❌ Error guardando venta de barra:",
          error
        );
  
  
        alert(
          "No se ha podido guardar la venta."
        );
  
  
        return;
  
      }
  
  
      console.log(
        "✅ Venta de barra guardada en Supabase:",
        ventaId
      );
  
  
      // ========================================================
      // ACTUALIZAR ESTADO LOCAL
      // ========================================================
  
      const transaction = {
  
        id:
          ventaId,
  
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
  
  
      if (
        !state.transactions[
          date
        ]
      ) {
  
        state.transactions[
          date
        ] = [];
  
      }
  
  
      state.transactions[
        date
      ].push(
        transaction
      );
  
  
      // ========================================================
      // VACIAR CARRITO
      // ========================================================
  
      setCart({});
  
  
      saveState();
  
  
      // ========================================================
      // ACTUALIZAR PANTALLA
      // ========================================================
  
      renderProductSteppers();
  
      renderTransactions();
  
  
      flash(
        els.saveStatus,
        "Venta guardada correctamente."
      );
  
  
    } catch (error) {
  
      console.error(
        "❌ Error inesperado guardando venta de barra:",
        error
      );
  
  
      alert(
        "Ha ocurrido un error al guardar la venta."
      );
  
  
    } finally {
  
      els.saveTransactionBtn.disabled =
        false;
  
  
      renderCartSummary();
  
    }
  
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
        els.entryDate?.value
      ] || [];
  
  
    els.transactionRows.replaceChildren();
  
  
    // ----------------------------------------------------------
    // SIN VENTAS
    // ----------------------------------------------------------
  
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
  
  
    // ----------------------------------------------------------
    // VENTAS
    // ----------------------------------------------------------
  
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
  
  
          // ----------------------------------------------------
          // CABECERA
          // ----------------------------------------------------
  
          const title =
            document.createElement(
              "div"
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
  
  
          // ----------------------------------------------------
          // DETALLE
          // ----------------------------------------------------
  
          const detail =
            document.createElement(
              "div"
            );
  
  
          detail.textContent =
            transaction.items
              .map(
                (item) =>
                  `${item.qty} x ${item.name}`
              )
              .join(", ");
  
  
          // ----------------------------------------------------
          // TOTAL
          // ----------------------------------------------------
  
          const total =
            document.createElement(
              "strong"
            );
  
  
          total.textContent =
            formatMoney(
              transaction.total
            );
  
  
          // ----------------------------------------------------
          // AÑADIR
          // ----------------------------------------------------
  
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
  
  
  // ============================================================
  // MENSAJE TEMPORAL
  // ============================================================
  
  function flash(
    element,
    message
  ) {
  
    if (!element) {
  
      return;
  
    }
  
  
    element.textContent =
      message;
  
  
    element.classList.remove(
      "hidden"
    );
  
  
    clearTimeout(
      element._flashTimeout
    );
  
  
    element._flashTimeout =
      setTimeout(
        () => {
  
          element.classList.add(
            "hidden"
          );
  
        },
        3000
      );
  
  }