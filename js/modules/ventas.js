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


    const saleSummary =
      els.saveTransactionBtn?.closest(
        ".actions-row"
      );


    if (
      saleSummary &&
      els.dailyRows
    ) {

      els.dailyRows.parentElement?.insertBefore(
        saleSummary,
        els.dailyRows
      );

    }


    if (els.saveTransactionBtn) {

      els.saveTransactionBtn.textContent =
        "Guardar venta";

    }
  
  
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
  
  
    // ==========================================================
    // ORDEN DE CATEGORÍAS
    // ==========================================================
  
    const categories = [
  
      {
        id: "minis",
        title: "Minis",
        icon: "🍹"
      },
  
      {
        id: "copas",
        title: "Copas",
        icon: "🍷"
      },
  
      {
        id: "varios",
        title: "Varios",
        icon: "🥤"
      },
  
      {
        id: "chupitos",
        title: "Chupitos",
        icon: "🥃"
      }
  
    ];
  
  
    // ==========================================================
    // CATEGORÍAS
    // ==========================================================
  
    categories.forEach(
      (category) => {
  
        const categoryProducts =
          products
            .filter(
              (product) =>
                product.category ===
                category.id
            )
            .sort(
              (a, b) =>
                a.order -
                b.order
            );
  
  
        // Si no hay productos
        // en esta categoría,
        // no mostramos la sección.
  
        if (
          !categoryProducts.length
        ) {
  
          return;
  
        }
  
  
        // ======================================================
        // CONTENEDOR DE CATEGORÍA
        // ======================================================
  
        const section =
          document.createElement(
            "section"
          );
  
  
        section.className =
          "bar-category";
  
  
        section.dataset.category =
          category.id;
  
  
        // ======================================================
        // CABECERA DESPLEGABLE
        // ======================================================
  
        const header =
          document.createElement(
            "button"
          );
  
  
        header.type =
          "button";
  
  
        header.className =
          "bar-category-header";
  
  
        header.setAttribute(
          "aria-expanded",
          "false"
        );
  
  
        header.setAttribute(
          "aria-label",
          `Abrir categoría ${category.title}`
        );
  
  
        // ------------------------------------------------------
        // TÍTULO
        // ------------------------------------------------------
  
        const title =
          document.createElement(
            "h3"
          );
  
  
        title.className =
          "bar-category-title";
  
  
        title.textContent =
          `${category.icon} ${category.title}`;
  
  
        // ------------------------------------------------------
        // FLECHA
        // ------------------------------------------------------
  
        const arrow =
          document.createElement(
            "span"
          );
  
  
        arrow.className =
          "bar-category-arrow";
  
  
        arrow.textContent =
          "›";
  
  
        arrow.setAttribute(
          "aria-hidden",
          "true"
        );
  
  
        // ------------------------------------------------------
        // EVENTO ABRIR / CERRAR
        // ------------------------------------------------------
  
        header.addEventListener(
          "click",
          () => {
  
            const isOpen =
              section.classList.toggle(
                "is-open"
              );
  
  
            header.setAttribute(
              "aria-expanded",
              String(isOpen)
            );
  
  
            header.setAttribute(
              "aria-label",
              isOpen
                ? `Cerrar categoría ${category.title}`
                : `Abrir categoría ${category.title}`
            );
  
          }
        );
  
  
        header.append(
          title,
          arrow
        );
  
  
        section.append(
          header
        );
  
  
        // ======================================================
        // PRODUCTOS
        // ======================================================
  
        const productsContainer =
          document.createElement(
            "div"
          );
  
  
        productsContainer.className =
          "bar-category-products";
  
  
        categoryProducts.forEach(
          (product) => {
  
            const row =
              template.content
                .firstElementChild
                .cloneNode(true);
  
  
            row.dataset.productId =
              product.id;
  
  
            row.dataset.mode =
              "sale";
  
  
            // --------------------------------------------------
            // PRODUCTO SELECCIONADO
            // --------------------------------------------------
  
            row.classList.toggle(
              "is-selected",
              Boolean(
                cart[product.id]
              )
            );
  
  
            // --------------------------------------------------
            // NOMBRE
            // --------------------------------------------------
  
            const name =
              row.querySelector(
                "[data-name]"
              );
  
  
            if (name) {
  
              name.textContent =
                product.name;
  
            }
  
  
            // --------------------------------------------------
            // PRECIO
            // --------------------------------------------------
  
            const price =
              row.querySelector(
                "[data-stock]"
              );
  
  
            if (price) {
  
              price.textContent =
                `Precio: ${formatMoney(
                  product.price
                )}`;
  
            }
  
  
            // --------------------------------------------------
            // CANTIDAD
            // --------------------------------------------------
  
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
  
  
            productsContainer.append(
              row
            );
  
          }
        );
  
  
        section.append(
          productsContainer
        );
  
  
        els.dailyRows.append(
          section
        );
  
      }
    );
  
  
    // ==========================================================
    // PRODUCTOS SIN CATEGORÍA
    // ==========================================================
    //
    // Por seguridad, si algún producto nuevo se crea sin
    // categoría, no desaparece.
    //
    // ==========================================================
  
    const uncategorized =
      products.filter(
        (product) =>
          ![
            "minis",
            "copas",
            "varios",
            "chupitos"
          ].includes(
            product.category
          )
      );
  
  
    if (
      uncategorized.length
    ) {
  
      // ========================================================
      // CONTENEDOR
      // ========================================================
  
      const section =
        document.createElement(
          "section"
        );
  
  
      section.className =
        "bar-category";
  
  
      section.dataset.category =
        "otros";
  
  
      // ========================================================
      // CABECERA
      // ========================================================
  
      const header =
        document.createElement(
          "button"
        );
  
  
      header.type =
        "button";
  
  
      header.className =
        "bar-category-header";
  
  
      header.setAttribute(
        "aria-expanded",
        "false"
      );
  
  
      header.setAttribute(
        "aria-label",
        "Abrir categoría Otros"
      );
  
  
      // --------------------------------------------------------
      // TÍTULO
      // --------------------------------------------------------
  
      const title =
        document.createElement(
          "h3"
        );
  
  
      title.className =
        "bar-category-title";
  
  
      title.textContent =
        "🍺 Otros";
  
  
      // --------------------------------------------------------
      // FLECHA
      // --------------------------------------------------------
  
      const arrow =
        document.createElement(
          "span"
        );
  
  
      arrow.className =
        "bar-category-arrow";
  
  
      arrow.textContent =
        "›";
  
  
      arrow.setAttribute(
        "aria-hidden",
        "true"
      );
  
  
      // --------------------------------------------------------
      // ABRIR / CERRAR
      // --------------------------------------------------------
  
      header.addEventListener(
        "click",
        () => {
  
          const isOpen =
            section.classList.toggle(
              "is-open"
            );
  
  
          header.setAttribute(
            "aria-expanded",
            String(isOpen)
          );
  
  
          header.setAttribute(
            "aria-label",
            isOpen
              ? "Cerrar categoría Otros"
              : "Abrir categoría Otros"
          );
  
        }
      );
  
  
      header.append(
        title,
        arrow
      );
  
  
      section.append(
        header
      );
  
  
      // ========================================================
      // PRODUCTOS SIN CATEGORÍA
      // ========================================================
  
      const productsContainer =
        document.createElement(
          "div"
        );
  
  
      productsContainer.className =
        "bar-category-products";
  
  
      uncategorized.forEach(
        (product) => {
  
          const row =
            template.content
              .firstElementChild
              .cloneNode(true);
  
  
          row.dataset.productId =
            product.id;
  
  
          row.dataset.mode =
            "sale";
  
  
          // ----------------------------------------------------
          // PRODUCTO SELECCIONADO
          // ----------------------------------------------------
  
          row.classList.toggle(
            "is-selected",
            Boolean(
              cart[product.id]
            )
          );
  
  
          // ----------------------------------------------------
          // NOMBRE
          // ----------------------------------------------------
  
          const name =
            row.querySelector(
              "[data-name]"
            );
  
  
          if (name) {
  
            name.textContent =
              product.name;
  
          }
  
  
          // ----------------------------------------------------
          // PRECIO
          // ----------------------------------------------------
  
          const price =
            row.querySelector(
              "[data-stock]"
            );
  
  
          if (price) {
  
            price.textContent =
              `Precio: ${formatMoney(
                product.price
              )}`;
  
          }
  
  
          // ----------------------------------------------------
          // CANTIDAD
          // ----------------------------------------------------
  
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
  
  
          productsContainer.append(
            row
          );
  
        }
      );
  
  
      section.append(
        productsContainer
      );
  
  
      els.dailyRows.append(
        section
      );
  
    }
  
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


  // ----------------------------------------------------------
  // COMPROBAR CLICK
  // ----------------------------------------------------------

  if (
    !button ||
    !row
  ) {

    return;

  }


  // ----------------------------------------------------------
  // ID DEL PRODUCTO
  // ----------------------------------------------------------

  const productId =
    row.dataset.productId;


  if (!productId) {

    return;

  }


  // ----------------------------------------------------------
  // BUSCAR PRODUCTO
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // CANTIDAD ACTUAL
  // ----------------------------------------------------------

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

  else if (
    button.matches(
      "[data-minus]"
    )
  ) {

    next =
      Math.max(
        0,
        current - 1
      );

  }


  // ----------------------------------------------------------
  // OTRO BOTÓN
  // ----------------------------------------------------------

  else {

    return;

  }


  // ==========================================================
  // ACTUALIZAR CARRITO
  // ==========================================================

  if (
    next === 0
  ) {

    delete cart[
      productId
    ];

  } else {

    cart[
      productId
    ] = next;

  }


  // ==========================================================
  // ACTUALIZAR SOLO ESTA FILA
  // ==========================================================
  //
  // IMPORTANTE:
  // NO llamamos a renderProductSteppers().
  //
  // Si lo hacemos, renderBarProducts() reconstruye todas
  // las categorías y las cierra.
  //
  // ==========================================================

  const qty =
    row.querySelector(
      "[data-qty]"
    );


  if (qty) {

    qty.textContent =
      next;

  }


  // ----------------------------------------------------------
  // MARCAR / DESMARCAR PRODUCTO
  // ----------------------------------------------------------

  row.classList.toggle(
    "is-selected",
    next > 0
  );


  // ==========================================================
  // ACTUALIZAR RESUMEN
  // ==========================================================

  renderCartSummary();

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
