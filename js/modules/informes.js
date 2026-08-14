import {
    cashDenominations
  } from "../state/state.js";
  
  import {
    els
  } from "../utils/dom.js";
  
  import {
    getCajaInforme,
    getVentasCaja,
    getDetallesVentas,
    getProductosVentas,
    getPerdidasCaja,
    getProductosPerdidas
  } from "../services/informes.service.js";
  
  
  // ============================================================
  // INICIALIZACIÓN
  // ============================================================
  
  export function initInformes() {
  
    if (els.loadCashReportBtn) {
  
      els.loadCashReportBtn.addEventListener(
        "click",
        loadCashReport
      );
  
    }
  
    if (els.reportDate) {
  
      els.reportDate.addEventListener(
        "change",
        loadCashReport
      );
  
    }
  
  }
  
  
  // ============================================================
  // CARGAR INFORME DE CAJA
  // ============================================================
  
  export async function loadCashReport() {
  
    const date =
      els.reportDate.value;
  
  
    if (!date) {
  
      alert(
        "Selecciona un día."
      );
  
      return;
    }
  
  
    els.cashReport.innerHTML =
      "Cargando...";
  
  
    try {
  
      // ========================================================
      // 1. OBTENER CAJA
      // ========================================================
  
      const {
        data: caja,
        error: cajaError
      } =
        await getCajaInforme(
          date
        );
  
  
      if (cajaError) {
  
        console.error(
          "❌ Error consultando caja:",
          cajaError
        );
  
        els.cashReport.innerHTML =
          "<p class='error'>No se pudo consultar la caja.</p>";
  
        return;
      }
  
  
      if (!caja) {
  
        els.cashReport.innerHTML =
          `<p class="muted">
            No existe una caja registrada para ${date}.
          </p>`;
  
        return;
      }
  
  
      // ========================================================
      // 2. OBTENER VENTAS
      // ========================================================
  
      const {
        data: ventasBase,
        error: ventasError
      } =
        await getVentasCaja(
          caja.id
        );
  
  
      if (ventasError) {
  
        console.error(
          "❌ Error consultando ventas:",
          ventasError
        );
  
        throw ventasError;
      }
  
  
      const ventas =
        ventasBase || [];
  
  
      console.log(
        "✅ Ventas encontradas:",
        ventas
      );
  
  
      // ========================================================
      // 3. OBTENER DETALLES
      // ========================================================
  
      let detallesVentas = [];
  
  
      if (ventas.length) {
  
        const ventaIds =
          ventas.map(
            (venta) =>
              venta.id
          );
  
  
        const {
          data: detalles,
          error: detallesError
        } =
          await getDetallesVentas(
            ventaIds
          );
  
  
        if (detallesError) {
  
          console.error(
            "❌ Error consultando detalle de ventas:",
            detallesError
          );
  
          throw detallesError;
        }
  
  
        detallesVentas =
          detalles || [];
  
  
        console.log(
          "✅ Detalles de ventas encontrados:",
          detallesVentas
        );
  
      }
  
  
      // ========================================================
      // 4. OBTENER PRODUCTOS DE LAS VENTAS
      // ========================================================
  
      let productosVentas = [];
  
  
      if (detallesVentas.length) {
  
        const productoIds = [
          ...new Set(
            detallesVentas.map(
              (detalle) =>
                detalle.producto_id
            )
          )
        ];
  
  
        const {
          data: productos,
          error: productosError
        } =
          await getProductosVentas(
            productoIds
          );
  
  
        if (productosError) {
  
          console.error(
            "❌ Error consultando productos de ventas:",
            productosError
          );
  
          throw productosError;
        }
  
  
        productosVentas =
          productos || [];
  
  
        console.log(
          "✅ Productos de ventas encontrados:",
          productosVentas
        );
  
      }
  
  
      // ========================================================
      // 5. ASOCIAR DETALLES CON PRODUCTOS
      // ========================================================
  
      ventas.forEach(
        (venta) => {
  
          venta.detalle_ventas =
            detallesVentas
  
              .filter(
                (detalle) =>
                  detalle.venta_id ===
                  venta.id
              )
  
              .map(
                (detalle) => {
  
                  const producto =
                    productosVentas.find(
                      (producto) =>
                        producto.id ===
                        detalle.producto_id
                    );
  
  
                  return {
                    ...detalle,
                    productos:
                      producto || null
                  };
  
                }
              );
  
        }
      );
  
  
      // ========================================================
      // 6. OBTENER PÉRDIDAS
      // ========================================================
  
      const {
        data: perdidasBase,
        error: perdidasError
      } =
        await getPerdidasCaja(
          caja.id
        );
  
  
      if (perdidasError) {
  
        console.error(
          "❌ Error consultando pérdidas:",
          perdidasError
        );
  
        throw perdidasError;
      }
  
  
      const perdidas =
        perdidasBase || [];
  
  
      // ========================================================
      // 7. PRODUCTOS DE LAS PÉRDIDAS
      // ========================================================
  
      let productosPerdidas = [];
  
  
      if (perdidas.length) {
  
        const productoIdsPerdidas = [
          ...new Set(
            perdidas
              .map(
                (perdida) =>
                  perdida.producto_id
              )
              .filter(Boolean)
          )
        ];
  
  
        if (
          productoIdsPerdidas.length
        ) {
  
          const {
            data: productos,
            error: productosError
          } =
            await getProductosPerdidas(
              productoIdsPerdidas
            );
  
  
          if (productosError) {
  
            console.error(
              "❌ Error consultando productos de pérdidas:",
              productosError
            );
  
            throw productosError;
          }
  
  
          productosPerdidas =
            productos || [];
  
        }
  
      }
  
  
      // ========================================================
      // 8. ASOCIAR PRODUCTOS A LAS PÉRDIDAS
      // ========================================================
  
      const perdidasConProducto =
        perdidas.map(
          (perdida) => ({
  
            ...perdida,
  
            productos:
              productosPerdidas.find(
                (producto) =>
                  producto.id ===
                  perdida.producto_id
              ) || null
  
          })
        );
  
  
      console.log(
        "✅ Caja consultada:",
        caja
      );
  
      console.log(
        "✅ Ventas:",
        ventas
      );
  
      console.log(
        "✅ Pérdidas:",
        perdidasConProducto
      );
  
  
      // ========================================================
      // 9. RENDERIZAR
      // ========================================================
  
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
  
  
  // ============================================================
  // RENDER DENOMINACIONES
  // ============================================================
  
  function renderCashDenominations(
    count,
    title
  ) {
  
    if (!count) {
  
      return `
        <div class="cash-report-count">
  
          <h4>${title}</h4>
  
          <p class="muted">
            Sin conteo registrado.
          </p>
  
        </div>
      `;
  
    }
  
  
    const denominations =
      count.denominations || {};
  
  
    const rows =
      cashDenominations
  
        .map(
          ({
            value,
            label
          }) => {
  
            const quantity =
              Number(
                denominations[
                  String(value)
                ] || 0
              );
  
  
            const subtotal =
              quantity * value;
  
  
            return `
              <tr>
  
                <td>${label}</td>
  
                <td>${quantity}</td>
  
                <td>
                  ${subtotal.toFixed(2)} €
                </td>
  
              </tr>
            `;
  
          }
        )
  
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
  
              <th colspan="2">
                Total contado
              </th>
  
              <th>
                ${Number(
                  count.total || 0
                ).toFixed(2)} €
              </th>
  
            </tr>
  
          </tfoot>
  
        </table>
  
      </div>
    `;
  
  }
  
  
  // ============================================================
  // RENDER INFORME COMPLETO
  // ============================================================
  
  function renderCashReport(
    caja,
    ventas,
    perdidas
  ) {
  
    const datos =
      caja.datos || {};
  
  
    const morning =
      datos.morning?.total || 0;
  
    const start =
      datos.start?.total || 0;
  
    const end =
      datos.end?.total || 0;
  
  
    const diffStart =
      start - morning;
  
    const diffEnd =
      end - start;
  
    const diffDay =
      end - morning;
  
  
    // ========================================================
    // CONTEOS
    // ========================================================
  
    const conteoMorning =
      renderCashDenominations(
        datos.morning,
        "Entrada de turno"
      );
  
  
    const conteoStart =
      renderCashDenominations(
        datos.start,
        "Inicio de barra"
      );
  
  
    const conteoEnd =
      renderCashDenominations(
        datos.end,
        "Final de barra"
      );
  
  
    // ========================================================
    // TOTAL VENTAS
    // ========================================================
  
    const totalVentas =
      ventas.reduce(
        (sum, venta) =>
          sum +
          Number(
            venta.total || 0
          ),
        0
      );
  
  
    // ========================================================
    // TOTAL PÉRDIDAS
    // ========================================================
  
    const totalPerdidas =
      perdidas.reduce(
        (
          sum,
          perdida
        ) =>
          sum +
          Number(
            perdida.cantidad || 0
          ) *
          Number(
            perdida.precio || 0
          ),
        0
      );
  
  
    // ========================================================
    // HTML VENTAS
    // ========================================================
  
    const ventasHTML =
      ventas.length
  
        ? ventas
  
            .map(
              (venta) => {
  
                const hora =
                  new Date(
                    venta.fecha
                  ).toLocaleTimeString(
                    "es-ES",
                    {
                      hour:
                        "2-digit",
                      minute:
                        "2-digit"
                    }
                  );
  
  
                const productos =
                  (
                    venta.detalle_ventas ||
                    []
                  )
  
                    .map(
                      (detalle) => {
  
                        const nombre =
                          detalle.productos
                            ?.nombre ||
                          "Producto";
  
  
                        return `
                          ${nombre}
                          × ${detalle.cantidad}
                        `;
  
                      }
                    )
  
                    .join(", ");
  
  
                return `
                  <tr>
  
                    <td>${hora}</td>
  
                    <td>
                      ${venta.usuario}
                    </td>
  
                    <td>
                      ${productos}
                    </td>
  
                    <td>
                      ${Number(
                        venta.total
                      ).toFixed(2)} €
                    </td>
  
                  </tr>
                `;
  
              }
            )
  
            .join("")
  
        : `
            <tr>
  
              <td colspan="4">
                No hay ventas.
              </td>
  
            </tr>
          `;
  
  
    // ========================================================
    // HTML PÉRDIDAS
    // ========================================================
  
    const perdidasHTML =
      perdidas.length
  
        ? perdidas
  
            .map(
              (perdida) => {
  
                const hora =
                  new Date(
                    perdida.fecha
                  ).toLocaleTimeString(
                    "es-ES",
                    {
                      hour:
                        "2-digit",
                      minute:
                        "2-digit"
                    }
                  );
  
  
                return `
                  <tr>
  
                    <td>
                      ${hora}
                    </td>
  
                    <td>
                      ${perdida.usuario}
                    </td>
  
                    <td>
                      ${
                        perdida.productos
                          ?.nombre ||
                        "Producto"
                      }
                    </td>
  
                    <td>
                      ${perdida.cantidad}
                    </td>
  
                    <td>
                      ${
                        (
                          Number(
                            perdida.cantidad
                          ) *
                          Number(
                            perdida.precio
                          )
                        ).toFixed(2)
                      } €
                    </td>
  
                  </tr>
                `;
  
              }
            )
  
            .join("")
  
        : `
            <tr>
  
              <td colspan="5">
                No hay pérdidas.
              </td>
  
            </tr>
          `;
  
  
    // ========================================================
    // PINTAR INFORME
    // ========================================================
  
    els.cashReport.innerHTML = `
  
      <section class="report-card">
  
        <h3>
          💰 Caja del ${caja.fecha}
        </h3>
  
  
        <div class="summary-grid compact">
  
          <article>
  
            <span>
              Entrada
            </span>
  
            <strong>
              ${morning.toFixed(2)} €
            </strong>
  
          </article>
  
  
          <article>
  
            <span>
              Inicio
            </span>
  
            <strong>
              ${start.toFixed(2)} €
            </strong>
  
          </article>
  
  
          <article>
  
            <span>
              Final
            </span>
  
            <strong>
              ${end.toFixed(2)} €
            </strong>
  
          </article>
  
  
          <article>
  
            <span>
              Final - Entrada
            </span>
  
            <strong>
              ${diffDay.toFixed(2)} €
            </strong>
  
          </article>
  
        </div>
  
  
        <h3>
          💶 Conteo de efectivo
        </h3>
  
  
        <div class="cash-report-counts">
  
          ${conteoMorning}
  
          ${conteoStart}
  
          ${conteoEnd}
  
        </div>
  
  
        <h3>
          🛒 Ventas
        </h3>
  
  
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
  
                <th colspan="3">
                  Total ventas
                </th>
  
                <th>
                  ${totalVentas.toFixed(2)} €
                </th>
  
              </tr>
  
            </tfoot>
  
          </table>
  
        </div>
  
  
        <h3>
          ❌ Pérdidas
        </h3>
  
  
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
  
                <th colspan="4">
                  Valor pérdidas
                </th>
  
                <th>
                  ${totalPerdidas.toFixed(2)} €
                </th>
  
              </tr>
  
            </tfoot>
  
          </table>
  
        </div>
  
      </section>
  
    `;


    // El informe muestra únicamente las ventas. Las pérdidas se
    // registran en su sección propia, pero no forman parte de esta vista.
    const headings =
      els.cashReport.querySelectorAll(
        ".report-card > h3"
      );


    const tables =
      els.cashReport.querySelectorAll(
        ".report-card > .table-wrapper"
      );


    tables[0]?.replaceWith(
      renderProductSalesTable(
        ventas,
        totalVentas
      )
    );


    headings[2]?.classList.add(
      "report-sales-heading"
    );

    headings[3]?.remove();
    tables[1]?.remove();
  
  }


function renderProductSalesTable(
  ventas,
  totalVentas
) {

  const products =
    new Map();


  ventas.forEach(
    (venta) => {

      (venta.detalle_ventas || []).forEach(
        (detalle) => {

          const name =
            detalle.productos?.nombre ||
            "Producto";


          const quantity =
            Number(
              detalle.cantidad || 0
            );


          const amount =
            quantity * Number(
              detalle.precio || 0
            );


          const current =
            products.get(name) || {
              quantity: 0,
              amount: 0
            };


          current.quantity +=
            quantity;


          current.amount +=
            amount;


          products.set(
            name,
            current
          );

        }
      );

    }
  );


  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.className =
    "table-wrapper report-sales-table";


  const table =
    document.createElement(
      "table"
    );


  const head =
    document.createElement(
      "thead"
    );


  head.innerHTML = `
    <tr>
      <th>Producto</th>
      <th>Unidades</th>
      <th>Importe</th>
    </tr>
  `;


  const body =
    document.createElement(
      "tbody"
    );


  const rows =
    [...products.entries()]
      .sort(
        ([firstName], [secondName]) =>
          firstName.localeCompare(
            secondName,
            "es"
          )
      );


  if (!rows.length) {

    body.innerHTML = `
      <tr>
        <td colspan="3">No hay ventas.</td>
      </tr>
    `;

  } else {

    rows.forEach(
      ([name, values]) => {

        const row =
          document.createElement(
            "tr"
          );


        row.innerHTML = `
          <td>${name}</td>
          <td>${values.quantity}</td>
          <td>${values.amount.toFixed(2)} €</td>
        `;


        body.append(
          row
        );

      }
    );

  }


  const foot =
    document.createElement(
      "tfoot"
    );


  foot.innerHTML = `
    <tr>
      <th colspan="2">Total ventas</th>
      <th>${totalVentas.toFixed(2)} €</th>
    </tr>
  `;


  table.append(
    head,
    body,
    foot
  );


  wrapper.append(
    table
  );


  return wrapper;

}
