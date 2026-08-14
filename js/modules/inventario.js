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


let activeInventoryCategory =
  null;


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

export function renderInventory(
  searchTerm =
    els.inventorySearch?.value || ""
) {

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


  const query =
    searchTerm.trim().toLocaleLowerCase(
      "es"
    );


  const products =
    state.products.filter(
      (product) =>
        product.name
          .toLocaleLowerCase("es")
          .includes(query)
    );


  const categories = [
    {
      id: "refrescos",
      label: "Refrescos",
      icon: "🥤"
    },
    {
      id: "cervezas",
      label: "Cervezas",
      icon: "🍺"
    },
    {
      id: "aguas",
      label: "Aguas",
      icon: "💧"
    },
    {
      id: "copas",
      label: "Copas y licores",
      icon: "🥃"
    },
    {
      id: "otros",
      label: "Otros productos",
      icon: "📦"
    }
  ];


  categories.forEach(
    (category) => {

      const categoryProducts =
        products.filter(
          (product) =>
            getInventoryCategory(
              product.name
            ) === category.id
        );


      if (!categoryProducts.length) {
        return;
      }


      const section =
        document.createElement("section");


      section.className =
        "inventory-category";


      section.dataset.category =
        category.id;


      const isOpen =
        Boolean(query) ||
        activeInventoryCategory ===
          category.id;


      section.classList.toggle(
        "is-open",
        isOpen
      );


      section.classList.toggle(
        "is-searching",
        Boolean(query)
      );


      const totalStock =
        categoryProducts.reduce(
          (total, product) =>
            total + Number(product.stock || 0),
          0
        );


      const toggle =
        document.createElement("button");


      toggle.type = "button";
      toggle.className =
        "inventory-category-toggle";
      toggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );


      toggle.innerHTML = `
        <span class="inventory-category-title">
          ${category.icon} ${category.label}
        </span>
        <span class="inventory-category-summary">
          ${categoryProducts.length} productos ·
          <strong class="${stockStatus(totalStock)}">
            ${totalStock} uds.
          </strong>
        </span>
        <span class="inventory-category-arrow">›</span>
      `;


      toggle.addEventListener(
        "click",
        () => {

          const willOpen =
            activeInventoryCategory !==
            category.id;


          activeInventoryCategory =
            willOpen
              ? category.id
              : null;


          els.inventoryRows
            .querySelectorAll(
              ".inventory-category"
            )
            .forEach(
              (item) => {

                const isActive =
                  willOpen &&
                  item === section;


                item.classList.toggle(
                  "is-open",
                  isActive
                );


                item
                  .querySelector(
                    ".inventory-category-toggle"
                  )
                  ?.setAttribute(
                    "aria-expanded",
                    String(isActive)
                  );

              }
            );

        }
      );


      const rows =
        document.createElement("div");


      rows.className =
        "inventory-category-products";


      categoryProducts
        .sort(
          (first, second) =>
            first.name.localeCompare(
              second.name,
              "es"
            )
        )
        .forEach(
          (product) => {

            rows.append(
              createInventoryRow(
                template,
                product,
                canEdit
              )
            );

          }
        );


      section.append(
        toggle,
        rows
      );


      els.inventoryRows.append(section);

    }
  );


  if (!products.length) {

    const empty =
      document.createElement("p");


    empty.className = "muted";
    empty.textContent =
      "No hay productos que coincidan con la búsqueda.";


    els.inventoryRows.append(empty);

  }

}


function createInventoryRow(
  template,
  product,
  canEdit
) {

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


  row
    .querySelectorAll("input, button")
    .forEach(
      (control) => {
        control.disabled = !canEdit;
      }
    );


  return row;

}


function getInventoryCategory(name) {

  const value =
    name.toLocaleLowerCase("es");


  if (/agua/.test(value)) {
    return "aguas";
  }


  if (/cerveza|caña|birra/.test(value)) {
    return "cervezas";
  }


  if (/coca|cola|fanta|nestea|refresco|zumo|red bull|monster/.test(value)) {
    return "refrescos";
  }


  if (/ron|ginebra|whisky|vodka|licor|vino|copa|tónica/.test(value)) {
    return "copas";
  }


  return "otros";

}


function stockStatus(stock) {

  if (stock <= 5) {
    return "stock-critical";
  }


  if (stock <= 20) {
    return "stock-low";
  }


  return "stock-ok";

}


// ============================================================
// AÑADIR PRODUCTO
// ============================================================
//
// IMPORTANTE:
// El producto se crea directamente en Supabase.
// No se crea solamente en memoria.
// ============================================================

export async function addProduct() {

  if (
    !canManageInventory(
      appState.session
    )
  ) {

    return;
  }


  const product = {

    nombre:
      "Nuevo producto",

    stock:
      0,

    precio:
      0,

    activo:
      true

  };


  try {

    console.log(
      "➕ Creando producto en Supabase..."
    );


    const {
      data,
      error
    } = await db
      .from("productos")
      .insert(product)
      .select()
      .single();


    if (error) {

      console.error(
        "❌ Error creando producto en Supabase:",
        error
      );


      alert(
        "No se ha podido crear el producto."
      );


      return;
    }


    // --------------------------------------------------------
    // Añadir al estado local SOLO después del INSERT correcto
    // --------------------------------------------------------

    const newProduct = {

      id:
        data.id,

      name:
        data.nombre,

      stock:
        Number(
          data.stock || 0
        ),

      price:
        Number(
          data.precio || 0
        ),

      activo:
        data.activo

    };


    state.products.push(
      newProduct
    );


    saveState();


    renderInventory();


    console.log(
      "➕ Producto añadido en Supabase:",
      newProduct
    );


  } catch (error) {

    console.error(
      "❌ Error inesperado creando producto:",
      error
    );


    alert(
      "Ha ocurrido un error al crear el producto."
    );

  }

}


// ============================================================
// GUARDAR PRODUCTO
// ============================================================
//
// Aquí sí se guarda el stock/precio/nombre.
// Los botones + / - NO llaman a este método.
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


    if (!data) {

      console.error(
        "❌ Supabase no devolvió el producto actualizado."
      );


      alert(
        "No se ha podido confirmar la actualización."
      );


      return;
    }


    // --------------------------------------------------------
    // ACTUALIZAR ESTADO LOCAL
    // --------------------------------------------------------

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


    product.activo =
      data.activo;


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
//
// SOLO modifica el input.
// NO toca Supabase.
// NO llama a saveProduct().
// ============================================================

function changeStock(
  row,
  increase
) {

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


  stockInput.value =
    newStock;

}


// ============================================================
// ELIMINAR PRODUCTO
// ============================================================

async function removeProduct(row) {

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


  const confirmed =
    confirm(
      `¿Quieres eliminar "${product.name}"?`
    );


  if (!confirmed) {
    return;
  }


  const removeButton =
    row.querySelector(
      "[data-remove]"
    );


  if (removeButton) {

    removeButton.disabled =
      true;

    removeButton.textContent =
      "Eliminando...";

  }


  try {

    const {
      error
    } =
      await db
        .from("productos")
        .delete()
        .eq(
          "id",
          productId
        );


    if (error) {

      console.error(
        "❌ Error eliminando producto:",
        error
      );


      alert(
        "No se ha podido eliminar el producto."
      );


      return;
    }


    // --------------------------------------------------------
    // Eliminar del estado local
    // --------------------------------------------------------

    state.products =
      state.products.filter(
        (item) =>
          item.id !== productId
      );


    saveState();


    renderInventory();


    console.log(
      "🗑️ Producto eliminado:",
      product
    );


  } catch (error) {

    console.error(
      "❌ Error inesperado eliminando producto:",
      error
    );


    alert(
      "Ha ocurrido un error al eliminar el producto."
    );


  } finally {

    if (removeButton) {

      removeButton.disabled =
        false;

    }

  }

}


// ============================================================
// ACTUALIZAR INVENTARIO
// ============================================================
//
// Gestiona:
//
//   CLICK
//     +             → cambia stock visual
//     -             → cambia stock visual
//     Guardar       → guarda en Supabase
//     Eliminar      → elimina de Supabase
//
//   ENTER
//     → guarda el producto
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


    // --------------------------------------------------------
    // ELIMINAR
    // --------------------------------------------------------

    if (
      button.hasAttribute(
        "data-remove"
      )
    ) {

      await removeProduct(
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
