import {
    state,
    session,
    lossCart,
    setLossCart,
    saveState
  } from "../state/state.js";
  
  import { els } from "../utils/dom.js";
  
  import { registrarPerdida } from "../services/perdidas.service.js";
  
  import {
    loadProductsFromSupabase
  } from "./inventario.js";
  
  import { formatMoney } from "../utils/format.js";
  
  
  // ============================================================
  // INICIALIZACIÓN
  // ============================================================
  
  export function initPerdidas() {
  
    if (els.lossRows) {
      els.lossRows.addEventListener(
        "click",
        changeLossQuantity
      );
    }
  
    if (els.saveLossBtn) {
      els.saveLossBtn.addEventListener(
        "click",
        saveLosses
      );
    }
  }
  
  
  // ============================================================
  // RENDER
  // ============================================================
  
  export function renderPerdidas() {
  
    renderLossSteppers();
  
  }
  
  
  // ============================================================
  // PRODUCTOS
  // ============================================================
  
  function renderLossSteppers() {
  
    if (!els.lossRows) {
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
  
    els.lossRows.replaceChildren();
  
    state.products.forEach(
      (product) => {
  
        const row =
          template.content
            .firstElementChild
            .cloneNode(true);
  
        row.dataset.productId =
          product.id;
  
        row.dataset.mode =
          "loss";
  
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
            lossCart[
              product.id
            ] || 0;
        }
  
        els.lossRows.append(row);
      }
    );
  
    updateLossButton();
  
  }
  
  
  // ============================================================
  // CAMBIAR CANTIDAD
  // ============================================================
  
  function changeLossQuantity(event) {
  
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
      lossCart[
        product.id
      ] || 0;
  
    const next =
      button.matches(
        "[data-plus]"
      )
        ? current + 1
        : Math.max(
            0,
            current - 1
          );
  
    const newLossCart = {
      ...lossCart
    };
  
    if (next === 0) {
  
      delete newLossCart[
        product.id
      ];
  
    } else {
  
      newLossCart[
        product.id
      ] = next;
    }
  
    setLossCart(
      newLossCart
    );
  
    renderLossSteppers();
  }
  
  
  // ============================================================
  // BOTÓN GUARDAR
  // ============================================================
  
  function updateLossButton() {
  
    if (!els.saveLossBtn) {
      return;
    }
  
    const units =
      Object.values(
        lossCart
      ).reduce(
        (sum, qty) =>
          sum + Number(qty || 0),
        0
      );
  
    els.saveLossBtn.disabled =
      units === 0;
  }
  
  
  // ============================================================
  // OBTENER PRODUCTOS SELECCIONADOS
  // ============================================================
  
  function lossItems() {
  
    return Object.entries(
      lossCart
    )
      .map(
        ([productId, qty]) => {
  
          const product =
            state.products.find(
              (item) =>
                item.id ===
                productId
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
  // GUARDAR PÉRDIDAS
  // ============================================================
  
  async function saveLosses() {
  
    const items =
      lossItems();
  
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
    // FECHA OPERATIVA
    // ----------------------------------------------------------
  
    const date =
      els.entryDate.value;
  
    if (!date) {
  
      console.error(
        "❌ No existe fecha operativa."
      );
  
      return;
    }
  
  
    // ----------------------------------------------------------
    // EVITAR DOBLE PULSACIÓN
    // ----------------------------------------------------------
  
    els.saveLossBtn.disabled =
      true;
  
  
    try {
  
      // --------------------------------------------------------
      // REGISTRAR CADA PÉRDIDA
      // --------------------------------------------------------
  
      for (
        const {
          product,
          qty,
          price
        } of items
      ) {
  
        console.log(
          "📦 Registrando pérdida:",
          {
            usuario:
              session.username,
            producto:
              product.name,
            cantidad:
              qty
          }
        );
  
  
        const {
          data: perdidaId,
          error
        } =
          await registrarPerdida(
            date,
            session.username,
            product.id,
            qty,
            price
          );
  
  
        if (error) {
  
          console.error(
            "❌ Error registrando pérdida:",
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
              `No hay suficiente stock de ${
                product.name
              }.`
            );
  
          } else {
  
            alert(
              `No se ha podido registrar la pérdida de ${
                product.name
              }.`
            );
          }
  
          return;
        }
  
  
        console.log(
          "✅ Pérdida guardada en Supabase:",
          perdidaId
        );
  
  
        // ------------------------------------------------------
        // ACTUALIZAR MOVIMIENTO DIARIO
        // ------------------------------------------------------
  
        addLossEntry(
          date,
          product.id,
          {
            lost:
              qty,
            price
          }
        );
      }
  
  
      // --------------------------------------------------------
      // VACIAR CARRITO
      // --------------------------------------------------------
  
      setLossCart({});
  
  
      // --------------------------------------------------------
      // RECARGAR INVENTARIO REAL
      // --------------------------------------------------------
  
      await loadProductsFromSupabase();
  
  
      // --------------------------------------------------------
      // GUARDAR ESTADO LOCAL
      // --------------------------------------------------------
  
      saveState();
  
  
      // --------------------------------------------------------
      // RENDER
      // --------------------------------------------------------
  
      renderPerdidas();
  
  
      // --------------------------------------------------------
      // MENSAJE
      // --------------------------------------------------------
  
      if (els.saveStatus) {
  
        els.saveStatus.textContent =
          "Pérdidas guardadas correctamente.";
  
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
        "❌ Error inesperado guardando pérdidas:",
        error
      );
  
      alert(
        "Ha ocurrido un error al guardar las pérdidas."
      );
  
  
    } finally {
  
      els.saveLossBtn.disabled =
        false;
    }
  }
  
  
  // ============================================================
  // ACTUALIZAR ENTRADA DIARIA
  // ============================================================
  
  function addLossEntry(
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
  
      state.entries[
        date
      ].push(entry);
    }
  
  
    entry.lost +=
      movement.lost;
  
    entry.price =
      movement.price;
  }