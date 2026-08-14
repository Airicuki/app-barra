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


let activeInventoryCategory = null;


// ============================================================
// CATEGORÍAS DEL INVENTARIO
// ============================================================

const INVENTORY_CATEGORIES = [
  {
    id: "con_alcohol",
    label: "Bebidas CON Alcohol",
    icon: "🍺"
  },
  {
    id: "sin_alcohol",
    label: "Bebidas SIN Alcohol",
    icon: "🥤"
  }
];


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

        id:
          product.id,

        name:
          product.nombre,

        stock:
          Number(
            product.stock || 0
          ),

        price:
          Number(
            product.precio || 0
          ),

        activo:
          product.activo,

        category:
          product.categoria

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
    searchTerm
      .trim()
      .toLocaleLowerCase("es");


  const products =
    state.products.filter(
      (product) => {

        const name =
          String(
            product.name || ""
          )
            .toLocaleLowerCase("es");

        return name.includes(
          query
        );

      }
    );


  // ==========================================================
  // CATEGORÍAS
  // ==========================================================

  INVENTORY_CATEGORIES.forEach(
    (category) => {

      const categoryProducts =
        products.filter(
          (product) =>
            getInventoryCategory(
              product
            ) === category.id
        );


      if (
        !categoryProducts.length
      ) {

        return;

      }


      const section =
        document.createElement(
          "section"
        );


      section.className =
        "inventory-category";


      section.dataset.category =
        category.id;


      // ======================================================
      // ESTADO ABIERTO / CERRADO
      // ======================================================

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


      // ======================================================
      // STOCK TOTAL
      // ======================================================

      const totalStock =
        categoryProducts.reduce(
          (
            total,
            product
          ) =>
            total +
            Number(
              product.stock || 0
            ),
          0
        );


      // ======================================================
      // CABECERA DE CATEGORÍA
      // ======================================================

      const toggle =
        document.createElement(
          "button"
        );


      toggle.type =
        "button";


      toggle.className =
        "inventory-category-toggle";


      toggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );


      toggle.innerHTML = `
        <span class="inventory-category-title">
          ${category.icon}
          ${category.label}
        </span>

        <span class="inventory-category-summary">
          ${categoryProducts.length}
          productos ·

          <strong class="${stockStatus(totalStock)}">
            ${totalStock} uds.
          </strong>
        </span>

        <span class="inventory-category-arrow">
          ›
        </span>
      `;


      // ======================================================
      // ABRIR / CERRAR
      // ======================================================

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
                    String(
                      isActive
                    )
                  );

              }
            );

        }
      );


      // ======================================================
      // PRODUCTOS
      // ======================================================

      const rows =
        document.createElement(
          "div"
        );


      rows.className =
        "inventory-category-products";


      categoryProducts
        .sort(
          (
            first,
            second
          ) =>
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


      els.inventoryRows.append(
        section
      );

    }
  );


  // ==========================================================
  // SIN RESULTADOS
  // ==========================================================

  if (!products.length) {

    const empty =
      document.createElement(
        "p"
      );


    empty.className =
      "muted";


    empty.textContent =
      "No hay productos que coincidan con la búsqueda.";


    els.inventoryRows.append(
      empty
    );

  }

}


// ============================================================
// CREAR FILA DE INVENTARIO
// ============================================================

function createInventoryRow(
  template,
  product,
  canEdit
) {

  const row =
    document.createElement("article");

  row.className =
    "row-card inventory-row";

  row.dataset.productId =
    product.id;


  // ==========================================================
  // ICONOS
  // ==========================================================

  const saveIcon = `
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      class="inventory-action-icon"
    >
      <path d="M5 3h12l2 2v16H5V3Z"></path>
      <path d="M8 3v6h8V3"></path>
      <path d="M8 21v-6h8v6"></path>
    </svg>
  `;


  const deleteIcon = `
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      class="inventory-action-icon"
    >
      <path d="M4 7h16"></path>
      <path d="M9 7V4h6v3"></path>
      <path d="M7 7l1 14h8l1-14"></path>
      <path d="M10 11v6"></path>
      <path d="M14 11v6"></path>
    </svg>
  `;


  // ==========================================================
  // CONTENIDO
  // ==========================================================

  row.innerHTML = `

    <div class="inventory-product-main">

      <button
        type="button"
        class="inventory-product-name"
        data-toggle-category
        aria-expanded="false"
        title="Editar categoría"
      >
        <span class="inventory-product-icon">
          ${getCategoryIcon(product.category)}
        </span>

        <span
          class="inventory-product-name-text"
        >
          ${escapeInventoryHtml(product.name)}
        </span>

      </button>


      <input
        type="text"
        class="inventory-name-input"
        data-name
        value="${escapeInventoryHtml(product.name)}"
        aria-label="Nombre del producto"
      />


      <div
        class="inventory-category-editor"
        data-category-editor
        hidden
      >

        <select
          data-category
          aria-label="Categoría del producto"
        >

          <option
            value="con_alcohol"
            ${product.category === "con_alcohol" ? "selected" : ""}
          >
            🍺 Bebidas CON Alcohol
          </option>

          <option
            value="sin_alcohol"
            ${product.category === "sin_alcohol" ? "selected" : ""}
          >
            🥤 Bebidas SIN Alcohol
          </option>

        </select>

      </div>

    </div>


    <div class="inventory-stock-area">

      <button
        type="button"
        class="inventory-stepper-btn"
        data-stock-minus
        aria-label="Disminuir stock"
      >
        −
      </button>


      <input
        data-stock
        type="number"
        min="0"
        step="1"
        inputmode="numeric"
        value="${Number(product.stock || 0)}"
        aria-label="Stock"
      />


      <button
        type="button"
        class="inventory-stepper-btn"
        data-stock-plus
        aria-label="Aumentar stock"
      >
        +
      </button>

    </div>


    <div class="inventory-actions">

      <button
        type="button"
        class="inventory-action-save"
        data-save-product
        aria-label="Guardar producto"
        title="Guardar"
      >
        ${saveIcon}
      </button>


      <button
        type="button"
        class="inventory-action-delete"
        data-remove
        aria-label="Eliminar producto"
        title="Eliminar"
      >
        ${deleteIcon}
      </button>

    </div>

  `;


  // ==========================================================
  // ELEMENTOS
  // ==========================================================

  const nameButton =
    row.querySelector(
      "[data-toggle-category]"
    );


  const nameInput =
    row.querySelector(
      "[data-name]"
    );


  const categoryEditor =
    row.querySelector(
      "[data-category-editor]"
    );


  // ==========================================================
  // MOSTRAR / OCULTAR EDICIÓN
  // ==========================================================

  if (nameButton) {

    nameButton.addEventListener(
      "click",
      () => {

        if (!canEdit) {
          return;
        }


        const isOpen =
          !categoryEditor.hidden;


        categoryEditor.hidden =
          isOpen;


        nameButton.setAttribute(
          "aria-expanded",
          String(!isOpen)
        );


        row.classList.toggle(
          "category-editing",
          !isOpen
        );


        if (!isOpen) {

          nameInput.focus();

        }

      }
    );

  }


  // ==========================================================
  // PERMISOS
  // ==========================================================

  row
    .querySelectorAll(
      "input, select, button"
    )
    .forEach(
      (control) => {

        /*
         * El nombre del producto se muestra
         * como botón pero la edición real
         * se hace en el input oculto.
         */

        control.disabled =
          !canEdit;

      }
    );


  return row;

}

// ============================================================
// ICONO DE CATEGORÍA
// ============================================================

function getCategoryIcon(
  category
) {

  if (
    category ===
    "con_alcohol"
  ) {

    return "🍺";

  }


  if (
    category ===
    "sin_alcohol"
  ) {

    return "🥤";

  }


  return "📦";

}


// ============================================================
// ESCAPAR HTML
// ============================================================

function escapeInventoryHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


// ============================================================
// OBTENER CATEGORÍA
// ============================================================

function getInventoryCategory(
  product
) {

  if (
    product.category ===
    "con_alcohol"
  ) {

    return "con_alcohol";

  }


  if (
    product.category ===
    "sin_alcohol"
  ) {

    return "sin_alcohol";

  }


  return null;

}


// ============================================================
// ESTADO DEL STOCK
// ============================================================

function stockStatus(
  stock
) {

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

export async function addProduct() {

  if (
    !canManageInventory(
      appState.session
    )
  ) {

    return;

  }


  // ==========================================================
  // CREAR MODAL
  // ==========================================================

  const overlay =
    document.createElement(
      "div"
    );


  overlay.className =
    "inventory-add-overlay";


  overlay.innerHTML = `
    <div
      class="inventory-add-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inventoryAddTitle"
    >

      <div class="inventory-add-header">

        <div>

          <h3 id="inventoryAddTitle">
            Añadir producto
          </h3>

          <p>
            Introduce los datos del nuevo producto.
          </p>

        </div>

        <button
          type="button"
          class="inventory-add-close"
          data-close-add-product
          aria-label="Cerrar"
        >
          ×
        </button>

      </div>


      <div class="inventory-add-body">

        <label>
          Nombre del producto

          <input
            type="text"
            data-new-product-name
            placeholder="Ej. Coca-Cola"
            autocomplete="off"
          >
        </label>


        <label>
          Tipo de bebida

          <select
            data-new-product-category
          >

            <option value="con_alcohol">
              🍺 Bebidas CON Alcohol
            </option>

            <option value="sin_alcohol">
              🥤 Bebidas SIN Alcohol
            </option>

          </select>

        </label>


        <label>
          Stock inicial

          <input
            type="number"
            min="0"
            step="1"
            value="0"
            data-new-product-stock
          >

        </label>

      </div>


      <div class="inventory-add-actions">

        <button
          type="button"
          class="btn-secondary"
          data-close-add-product
        >
          Cancelar
        </button>

        <button
          type="button"
          class="btn-primary"
          data-confirm-add-product
        >
          Añadir producto
        </button>

      </div>

    </div>
  `;


  document.body.append(
    overlay
  );


  const nameInput =
    overlay.querySelector(
      "[data-new-product-name]"
    );


  const categoryInput =
    overlay.querySelector(
      "[data-new-product-category]"
    );


  const stockInput =
    overlay.querySelector(
      "[data-new-product-stock]"
    );


  const closeModal =
    () => {

      overlay.remove();

    };


  // ==========================================================
  // CERRAR
  // ==========================================================

  overlay
    .querySelectorAll(
      "[data-close-add-product]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          closeModal
        );

      }
    );


  overlay.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        overlay
      ) {

        closeModal();

      }

    }
  );


  // ==========================================================
  // ESC
  // ==========================================================

  const handleEscape =
    (event) => {

      if (
        event.key ===
        "Escape"
      ) {

        closeModal();

        document.removeEventListener(
          "keydown",
          handleEscape
        );

      }

    };


  document.addEventListener(
    "keydown",
    handleEscape
  );


  // ==========================================================
  // CREAR PRODUCTO
  // ==========================================================

  const confirmButton =
    overlay.querySelector(
      "[data-confirm-add-product]"
    );


  confirmButton.addEventListener(
    "click",
    async () => {

      const nombre =
        nameInput
          .value
          .trim();


      const categoria =
        categoryInput
          .value;


      const stock =
        Math.max(
          0,
          Number(
            stockInput.value ||
            0
          )
        );


      if (!nombre) {

        nameInput.focus();

        nameInput.classList.add(
          "input-error"
        );

        return;

      }


      if (
        ![
          "con_alcohol",
          "sin_alcohol"
        ].includes(
          categoria
        )
      ) {

        return;

      }


      confirmButton.disabled =
        true;


      confirmButton.textContent =
        "Añadiendo...";


      try {

        console.log(
          "➕ Creando producto en Supabase..."
        );


        const {
          data,
          error
        } =
          await db
            .from("productos")
            .insert({

              nombre,

              stock,

              precio:
                0,

              activo:
                true,

              categoria

            })
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
            data.activo,

          category:
            data.categoria

        };


        state.products.push(
          newProduct
        );


        saveState();


        closeModal();


        /*
         * Abrimos automáticamente la categoría
         * donde se ha creado el producto.
         */

        activeInventoryCategory =
          categoria;


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


      } finally {

        confirmButton.disabled =
          false;


        confirmButton.textContent =
          "Añadir producto";

      }

    }
  );


  // ==========================================================
  // ENTER
  // ==========================================================

  nameInput.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key ===
        "Enter"
      ) {

        event.preventDefault();

        confirmButton.click();

      }

    }
  );


  setTimeout(
    () => {

      nameInput.focus();

    },
    0
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


  // ==========================================================
  // CAMPOS
  // ==========================================================

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


  const categoryInput =
    row.querySelector(
      "[data-category]"
    );


  const button =
    row.querySelector(
      "[data-save-product]"
    );


  // ==========================================================
  // VALORES
  // ==========================================================

  const nombre =
    nameInput?.value
      ?.trim() ||
    "Sin nombre";


  const stock =
    Math.max(
      0,
      Number(
        stockInput?.value || 0
      )
    );


  /*
   * El precio no se muestra en el inventario,
   * pero lo mantenemos para no perder el valor
   * que pueda existir actualmente en Supabase.
   */

  const precio =
    product.price ??
    Number(
      priceInput?.value || 0
    );


  const categoria =
    categoryInput?.value ||
    product.category ||
    "sin_alcohol";


  // ==========================================================
  // VALIDAR CATEGORÍA
  // ==========================================================

  if (
    ![
      "con_alcohol",
      "sin_alcohol"
    ].includes(
      categoria
    )
  ) {

    alert(
      "Selecciona una categoría válida."
    );

    return;
  }


  // ==========================================================
  // ESTADO BOTÓN
  // ==========================================================

  if (button) {

    button.disabled =
      true;

    button.classList.add(
      "is-saving"
    );

    button.setAttribute(
      "aria-label",
      "Guardando..."
    );

    button.setAttribute(
      "title",
      "Guardando..."
    );

  }


  try {

    console.log(
      "💾 Guardando producto:",
      {
        id: product.id,
        nombre,
        stock,
        categoria
      }
    );


    // ========================================================
    // ACTUALIZAR SUPABASE
    // ========================================================

    const {
      data,
      error
    } =
      await updateProduct(
        product.id,
        {
          nombre,
          stock,
          precio,
          categoria
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


    // ========================================================
    // ACTUALIZAR ESTADO LOCAL
    // ========================================================

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


    product.category =
      data.categoria;


    saveState();


    console.log(
      "✅ Producto actualizado:",
      data
    );


    // ========================================================
    // CERRAR EDICIÓN DE CATEGORÍA
    // ========================================================

    const categoryEditor =
      row.querySelector(
        "[data-category-editor]"
      );


    const nameButton =
      row.querySelector(
        "[data-toggle-category]"
      );


    if (categoryEditor) {

      categoryEditor.hidden =
        true;

    }


    if (nameButton) {

      nameButton.setAttribute(
        "aria-expanded",
        "false"
      );

    }


    row.classList.remove(
      "category-editing"
    );


    // ========================================================
    // REABRIR LA CATEGORÍA CORRESPONDIENTE
    // ========================================================

    activeInventoryCategory =
      product.category;


    renderInventory();


  } catch (error) {

    console.error(
      "❌ Error guardando producto:",
      error
    );


    alert(
      "Ha ocurrido un error al guardar el producto."
    );

  } finally {

    if (button) {

      button.disabled =
        false;

      button.classList.remove(
        "is-saving"
      );

      button.setAttribute(
        "aria-label",
        "Guardar producto"
      );

      button.setAttribute(
        "title",
        "Guardar"
      );

    }

  }

}


// ============================================================
// CAMBIAR STOCK CON + / -
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

async function removeProduct(
  row
) {

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
//   - Botón −
//   - Botón +
//   - Botón 💾 Guardar
//   - Botón 🗑️ Eliminar
//   - Enter sobre un campo
//
// ============================================================

export async function updateInventory(
  event
) {

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