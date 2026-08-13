import { db } from "../config/supabase.js";

import * as appState from "../state/state.js";

import {
  state,
  saveState
} from "../state/state.js";

import { els } from "../utils/dom.js";

import {
  canManageInventory
} from "../utils/permissions.js";

import {
  getProducts,
  updateProduct
} from "../services/productos.service.js";


// ============================================================
// CARGAR INVENTARIO DESDE SUPABASE
// ============================================================

export async function loadProductsFromSupabase() {

  const {
    data,
    error
  } = await getProducts();


  if (error) {

    console.error(
      "❌ Error cargando inventario:",
      error
    );

    return false;
  }


  state.products =
    data.map(
      (product) => ({
        id: product.id,
        name: product.nombre,
        stock: Number(product.stock || 0),
        price: Number(product.precio || 0),
        activo: product.activo
      })
    );


  console.log(
    "✅ Inventario cargado desde Supabase:",
    state.products
  );


  return true;
}


// ============================================================
// MOSTRAR INVENTARIO
// ============================================================

export function renderInventory() {

  const template =
    document.querySelector(
      "#inventoryRowTemplate"
    );


  if (!template) {

    console.error(
      "❌ No se encuentra #inventoryRowTemplate en el HTML"
    );

    return;
  }


  if (!els.inventoryRows) {
    return;
  }


  els.inventoryRows.replaceChildren();


  const canEdit =
    canManageInventory(
      appState.session
    );


  state.products.forEach(
    (product) => {

      const row =
        template.content
          .firstElementChild
          .cloneNode(true);


      row.dataset.productId =
        product.id;


      // --------------------------------------------------------
      // PRODUCTO
      // --------------------------------------------------------

      const nameInput =
        row.querySelector(
          "[data-name]"
        );


      const stockInput =
        row.querySelector(
          "[data-stock]"
        );


      const priceInput =
        row.querySelector(
          "[data-price]"
        );


      if (nameInput) {
        nameInput.value =
          product.name;
      }


      if (stockInput) {
        stockInput.value =
          product.stock;
      }


      if (priceInput) {
        priceInput.value =
          product.price;
      }


      // --------------------------------------------------------
      // PERMISOS
      // --------------------------------------------------------

      row
        .querySelectorAll(
          "input, button"
        )
        .forEach(
          (control) => {

            control.disabled =
              !canEdit;

          }
        );


      els.inventoryRows.append(
        row
      );

    }
  );

}


// ============================================================
// AÑADIR PRODUCTO
// ============================================================

export function addProduct() {

  const product = {

    id:
      crypto.randomUUID(),

    name:
      "Nuevo producto",

    stock:
      0,

    price:
      0,

    activo:
      true

  };


  state.products.push(
    product
  );


  saveState();


  renderInventory();


  console.log(
    "➕ Producto añadido:",
    product
  );

}


// ============================================================
// GUARDAR PRODUCTO
// ============================================================

async function saveProduct(row) {

  if (
    !canManageInventory(
      appState.session
    )
  ) {
    return;
  }


  const productId =
    row.dataset.productId;


  const product =
    state.products.find(
      (item) =>
        item.id === productId
    );


  if (!product) {

    console.error(
      "❌ Producto no encontrado:",
      productId
    );

    return;
  }


  const nameInput =
    row.querySelector(
      "[data-name]"
    );


  const stockInput =
    row.querySelector(
      "[data-stock]"
    );


  const priceInput =
    row.querySelector(
      "[data-price]"
    );


  const button =
    row.querySelector(
      "[data-save-product]"
    );


  const nombre =
    nameInput
      ?.value
      .trim() ||
    "Sin nombre";


  const stock =
    Math.max(
      0,
      Number(
        stockInput?.value || 0
      )
    );


  const precio =
    Math.max(
      0,
      Number(
        priceInput?.value || 0
      )
    );


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Guardando...";

  }


  try {

    const {
      data,
      error
    } =
      await updateProduct(
        product.id,
        {
          nombre,
          stock,
          precio
        }
      );


    if (error) {

      console.error(
        "❌ Error actualizando producto:",
        error
      );


      alert(
        "No se ha podido guardar el producto."
      );


      return;
    }


    // Actualizar estado local

    product.name =
      data.nombre;


    product.stock =
      Number(
        data.stock || 0
      );


    product.price =
      Number(
        data.precio || 0
      );


    saveState();


    console.log(
      "✅ Producto actualizado:",
      data
    );


    if (button) {

      button.textContent =
        "Guardado ✓";


      setTimeout(
        () => {

          button.textContent =
            "Guardar";

        },
        1200
      );

    }

  } catch (error) {

    console.error(
      "❌ Error guardando producto:",
      error
    );


    alert(
      "Ha ocurrido un error al guardar."
    );

  } finally {

    if (button) {

      button.disabled =
        false;

    }

  }

}


// ============================================================
// CAMBIAR STOCK CON + / -
// ============================================================

function changeStock(row, increase) {

  if (
    !canManageInventory(
      appState.session
    )
  ) {
    return;
  }


  const stockInput =
    row.querySelector(
      "[data-stock]"
    );


  if (!stockInput) {
    return;
  }


  const currentStock =
    Number(
      stockInput.value || 0
    );


  const newStock =
    increase
      ? currentStock + 1
      : Math.max(
          0,
          currentStock - 1
        );


  // Solo cambia el valor visual.
  // NO se guarda en Supabase.

  stockInput.value =
    newStock;

}


// ============================================================
// ACTUALIZAR INVENTARIO
// ============================================================
//
// Esta función gestiona:
//   - Enter sobre un campo → guardar
//   - Botón Guardar → guardar
//   - Botón + → aumentar stock
//   - Botón − → disminuir stock
//
// ============================================================

export async function updateInventory(event) {

  if (
    !canManageInventory(
      appState.session
    )
  ) {
    return;
  }


  const row =
    event.target.closest(
      ".inventory-row"
    );


  if (!row) {
    return;
  }


  // ==========================================================
  // CLICK
  // ==========================================================

  if (
    event.type === "click"
  ) {

    const button =
      event.target.closest(
        "button"
      );


    if (!button) {
      return;
    }


    // --------------------------------------------------------
    // MENOS
    // --------------------------------------------------------

    if (
      button.hasAttribute(
        "data-stock-minus"
      )
    ) {

      changeStock(
        row,
        false
      );

      return;
    }


    // --------------------------------------------------------
    // MÁS
    // --------------------------------------------------------

    if (
      button.hasAttribute(
        "data-stock-plus"
      )
    ) {

      changeStock(
        row,
        true
      );

      return;
    }


    // --------------------------------------------------------
    // GUARDAR
    // --------------------------------------------------------

    if (
      button.hasAttribute(
        "data-save-product"
      )
    ) {

      await saveProduct(
        row
      );

      return;
    }


    return;
  }


  // ==========================================================
  // ENTER
  // ==========================================================

  if (
    event.type === "keydown" &&
    event.key === "Enter"
  ) {

    event.preventDefault();

    await saveProduct(
      row
    );

  }

}