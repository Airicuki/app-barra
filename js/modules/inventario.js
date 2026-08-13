import { db } from "../config/supabase.js";

import * as appState from "../state/state.js";

import {
  state,
  saveState
} from "../state/state.js";

import { els } from "../utils/dom.js";

import { escapeHtml } from "../utils/format.js";

import {
  formatMoney
} from "../utils/format.js";

import {
  canManageInventory
} from "../utils/permissions.js";

import {
  getProducts,
  updateProduct
} from "../services/productos.service.js";

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
    data.map((product) => ({
      id: product.id,
      name: product.nombre,
      stock: product.stock,
      price: Number(product.precio),
      activo: product.activo
    }));

  console.log(
    "✅ Inventario cargado desde Supabase:",
    state.products
  );

  return true;
}

export function renderInventory() {
    const template = document.querySelector("#inventoryRowTemplate");
  
    if (!template) {
      console.error(
        "❌ No se encuentra #inventoryRowTemplate en el HTML"
      );
      return;
    }
  
    els.inventoryRows.replaceChildren();
  
    state.products.forEach((product) => {
  
      const row =
        template.content
          .firstElementChild
          .cloneNode(true);
  
      row.dataset.productId = product.id;
  
      row.querySelector("[data-name]").value =
        product.name;
  
      row.querySelector("[data-stock]").value =
        product.stock;
  
      row.querySelector("[data-price]").value =
        product.price;
  
      // Solo admin y jefe de barra pueden modificar
      const canEdit =
        ["admin", "jefeBarra"].includes(
          appState.session?.role
        );
  
      row
        .querySelectorAll("input, button")
        .forEach((control) => {
          control.disabled = !canEdit;
        });
  
      els.inventoryRows.append(row);
    });
  }

async function saveInventoryRow(row) {

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

const stockInput =
    row.querySelector("[data-stock]");

const priceInput =
    row.querySelector("[data-price]");

const stock =
    Math.max(
    0,
    Number(stockInput.value || 0)
    );

const price =
    Math.max(
    0,
    Number(priceInput.value || 0)
    );

const button =
    row.querySelector(
    "[data-save-product]"
    );

const originalText =
    button.textContent;

button.disabled = true;
button.textContent = "Guardando...";

try {

    const {
    data,
    error
    } = await updateProduct(
    product.id,
    {
        nombre: product.name,
        stock,
        precio: price
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

    product.stock =
    Number(data.stock);

    product.price =
    Number(data.precio);

    saveState();

    console.log(
    "✅ Producto actualizado:",
    data
    );

    button.textContent =
    "Guardado ✓";

    setTimeout(() => {
    button.textContent =
        originalText;
    }, 1500);

} catch (error) {

    console.error(
    "❌ Error guardando producto:",
    error
    );

    alert(
    "Ha ocurrido un error al guardar."
    );

} finally {

    button.disabled = false;
}
}

export function addProduct() {

  state.products.push({
    id: crypto.randomUUID(),
    name: "Nuevo producto",
    stock: 0,
    price: 0
  });

  saveState();

  renderInventory();
}

export async function updateInventory(event) {

    if (
      !["admin", "jefeBarra"].includes(
        appState.session?.role
      )
    ) {
      return;
    }
  
    const row =
      event.target.closest(".inventory-row");
  
    if (!row) {
      return;
    }
  
    // Solo guardamos al pulsar Enter
    if (
      event.type === "keydown" &&
      event.key !== "Enter"
    ) {
      return;
    }
  
    if (event.type !== "keydown") {
      return;
    }
  
    const product =
      state.products.find(
        (item) =>
          item.id === row.dataset.productId
      );
  
    if (!product) {
      return;
    }
  
    const nombre =
      row
        .querySelector("[data-name]")
        .value
        .trim() || "Sin nombre";
  
    const stock =
      Math.max(
        0,
        Number(
          row
            .querySelector("[data-stock]")
            .value || 0
        )
      );
  
    const precio =
      Math.max(
        0,
        Number(
          row
            .querySelector("[data-price]")
            .value || 0
        )
      );
  
    try {
  
      const {
        data,
        error
      } = await db
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
        data.stock;
  
      product.price =
        Number(data.precio);
  
      console.log(
        "✅ Producto guardado en Supabase:",
        data
      );
  
      renderInventory();
  
    } catch (error) {
  
      console.error(
        "❌ Error inesperado actualizando producto:",
        error
      );
  
      alert(
        "Ha ocurrido un error al guardar el producto."
      );
    }
  }