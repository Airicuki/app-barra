import {
    state,
    session,
    saveState,
    cashDenominations,
    cashSlots
  } from "../state/state.js";
  
  import { els } from "../utils/dom.js";
  
  import {
    formatMoney
  } from "../utils/format.js";

  import {
    canAccessReports
  } from "../utils/permissions.js";
  
  import {
    saveCaja,
    getCaja,
    getCajaAnterior
  } from "../services/caja.service.js";
  
  
  // ============================================================
  // INICIALIZACIÓN
  // ============================================================
  
  export function initCaja() {
  
    // Cambiar fecha operativa
    if (els.entryDate) {
  
      els.entryDate.addEventListener(
        "change",
        handleDateChange
      );
  
    }
  
  
    // Guardar caja
    if (els.saveCashBtn) {
  
      els.saveCashBtn.addEventListener(
        "click",
        saveCash
      );
  
    }
  
  
    // Actualizar cálculos al escribir
    if (els.cashView) {
  
      els.cashView.addEventListener(
        "input",
        previewCash
      );
  
    }
  
  }
  
  
  // ============================================================
  // CAMBIO DE FECHA
  // ============================================================
  
  async function handleDateChange() {
  
    await loadCashFromSupabase();

    renderCaja();
  
  }
  
  
  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  
  export function renderCaja() {
  
    const cash =
      getCashForDate();
  
    renderCashCalculators(
      cash
    );
  
    renderCashDiffs(
      cash
    );

    renderCashTpvTotal(
      cash
    );

    applyCashPermissions();
  
  }


  // ============================================================
  // PERMISOS
  // ============================================================

  function applyCashPermissions() {

    const canEditCash =
      canAccessReports(
        session
      );

    els.cashView
      ?.querySelectorAll(
        "[data-denomination]"
      )
      .forEach(
        input => {
          input.disabled =
            !canEditCash;
        }
      );

    [
      els.cashTpvDay,
      els.cashTpvNight
    ].forEach(
      input => {
        if (!input) {
          return;
        }

        input.disabled =
        !canEditCash;
      }
    );

    if (els.saveCashBtn) {

      els.saveCashBtn.disabled =
        !canEditCash;

      els.saveCashBtn.title =
        canEditCash
          ? ""
          : "Solo Jefe Barra y Directiva pueden modificar la caja.";

    }

  }
  
  
  // ============================================================
  // OBTENER CAJA DEL DÍA
  // ============================================================
  
  function getCashForDate() {
  
    const date =
      els.entryDate.value;
  
    state.cashCounts[date] =
      normalizeCashCount(
        state.cashCounts[date]
      );
  
    return state.cashCounts[
      date
    ];
  }
  
  
  // ============================================================
  // NORMALIZAR CAJA
  // ============================================================
  
  function normalizeCashCount(
    cash = {}
  ) {
  
    const normalized = {};
  
    cashSlots.forEach(
      (slot) => {
  
        const value =
          cash[slot];
  
        if (
          value &&
          typeof value ===
            "object"
        ) {
  
          normalized[slot] = {
  
            denominations:
              value.denominations ||
              {},
  
            total:
              Number(
                value.total || 0
              )
  
          };
  
        } else {
  
          normalized[slot] = {
  
            denominations:
              {},
  
            total:
              Number(
                value || 0
              )
  
          };
  
        }
  
      }
    );

    normalized.tpvDay =
      Math.max(
        0,
        Number(
          cash.tpvDay ??
          cash.tpvTotal ??
          0
        )
      );

    normalized.tpvNight =
      Math.max(
        0,
        Number(
          cash.tpvNight || 0
        )
      );

    normalized.previousTpvNight =
      Math.max(
        0,
        Number(cash.previousTpvNight || 0)
      );

    normalized.tpvTotal =
      normalized.tpvDay -
      normalized.previousTpvNight +
      normalized.tpvNight;
  
    return normalized;
  }
  
  
  // ============================================================
  // RENDER DE LOS TRES CONTEOS
  // ============================================================
  
  function renderCashCalculators(
    cash
  ) {
  
    els.cashCalculators.forEach(
      (card) => {
  
        const slot =
          card.dataset.cashCount;
  
        const denominations =
          card.querySelector(
            "[data-cash-denominations]"
          );
  
        const stored =
          cash[slot]
            ?.denominations ||
          {};
  
        if (!denominations) {
          return;
        }
  
        denominations.replaceChildren();
  
  
        cashDenominations.forEach(
          (item) => {
  
            const label =
              document.createElement(
                "label"
              );
  
            label.className =
              "cash-denomination";
  
            label.innerHTML = `
              <span>${item.label}</span>
  
              <input
                type="number"
                min="0"
                step="1"
                inputmode="numeric"
                data-denomination="${item.value}"
                value="${
                  stored[item.value] || ""
                }"
              >
            `;
  
            denominations.append(
              label
            );
  
          }
        );
  
  
        const totalElement =
          card.querySelector(
            "[data-cash-total]"
          );
  
        if (totalElement) {
  
          totalElement.textContent =
            formatMoney(
              cashSlotTotal(
                cash[slot]
              )
            );
  
        }
  
      }
    );
  
  }
  
  
  // ============================================================
  // GUARDAR CAJA
  // ============================================================
  
  async function saveCash() {

    if (
      !canAccessReports(
        session
      )
    ) {

      return;

    }
  
    const date =
      els.entryDate.value;
  
    const cash =
      readCashFromScreen();
  
  
    if (!date) {
  
      console.error(
        "❌ No existe fecha operativa."
      );
  
      return;
    }
  
  
    try {
  
      const {
        data,
        error
      } =
        await saveCaja(
          date,
          session.username,
          cash,
          cash.tpvTotal,
          cash.tpvDay,
          cash.tpvNight
        );
  
  
      if (error) {
  
        console.error(
          "❌ Error guardando caja:",
          error
        );
  
        alert(
          "No se ha podido guardar la caja."
        );
  
        return;
      }
  
  
      console.log(
        "✅ Caja guardada en Supabase:",
        data
      );
  
  
      // Mantener copia local
      state.cashCounts[date] =
        cash;
  
      saveState();
  
  
      renderCashDiffs(
        cash
      );
  
  
      flash(
        els.cashStatus,
        "Caja guardada correctamente."
      );
  
  
    } catch (error) {
  
      console.error(
        "❌ Error inesperado guardando caja:",
        error
      );
  
      alert(
        "Ha ocurrido un error al guardar la caja."
      );
  
    }
  
  }
  
  
  // ============================================================
  // CARGAR CAJA DESDE SUPABASE
  // ============================================================
  
  export async function loadCashFromSupabase(
    date = els.entryDate.value
  ) {
  
    const [
      { data, error },
      { data: previousCaja, error: previousCajaError }
    ] = await Promise.all([
      getCaja(date),
      getCajaAnterior(date)
    ]);
  
  
    if (error) {
  
      console.error(
        "❌ Error cargando caja desde Supabase:",
        error
      );
  
      return false;
    }

    if (previousCajaError) {
      console.error("❌ Error cargando el cierre TPV anterior:", previousCajaError);
      return false;
    }
  
  
    if (!data) {
  
      console.log(
        "ℹ️ No existe caja para:",
        date
      );
  
  
      state.cashCounts[date] =
        normalizeCashCount(
          {
            previousTpvNight: previousCaja?.tpv_0000_1000
          }
        );
  
      return true;
    }
  
  
    state.cashCounts[date] =
      normalizeCashCount(
        {
          ...data.datos,
          tpvTotal:
            data.total_tpv,
          tpvDay:
            data.tpv_1000_0000,
          tpvNight:
            data.tpv_0000_1000,
          previousTpvNight:
            previousCaja?.tpv_0000_1000
        }
      );
  
  
    console.log(
      "✅ Caja cargada desde Supabase:",
      data
    );
  
  
    return true;
  }
  
  
  // ============================================================
  // PREVISUALIZACIÓN DEL CONTEO
  // ============================================================
  
  function previewCash() {
  
    const cash =
      readCashFromScreen();
  
  
    els.cashCalculators.forEach(
      (card) => {
  
        const slot =
          card.dataset.cashCount;
  
        const totalElement =
          card.querySelector(
            "[data-cash-total]"
          );
  
        if (totalElement) {
  
          totalElement.textContent =
            formatMoney(
              cashSlotTotal(
                cash[slot]
              )
            );
  
        }
  
      }
    );
  
  
    renderCashDiffs(
      cash
    );

    renderCashTpvSummary(
      cash
    );
  
  }
  
  
  // ============================================================
  // LEER LOS TRES CONTEOS DE LA PANTALLA
  // ============================================================
  
  function readCashFromScreen() {
  
    const cash = {};
  
  
    els.cashCalculators.forEach(
      (card) => {
  
        const denominations =
          {};
  
  
        card
          .querySelectorAll(
            "[data-denomination]"
          )
          .forEach(
            (input) => {
  
              const count =
                Math.max(
                  0,
                  Number(
                    input.value || 0
                  )
                );
  
  
              if (count > 0) {
  
                denominations[
                  input.dataset
                    .denomination
                ] = count;
  
              }
  
            }
          );
  
  
        cash[
          card.dataset.cashCount
        ] = {
  
          denominations,
  
          total:
            calculateCashTotal(
              denominations
            )
  
        };
  
      }
    );

    cash.tpvDay =
      Math.max(
        0,
        Number(
          els.cashTpvDay?.value || 0
        )
      );

    cash.tpvNight =
      Math.max(
        0,
        Number(
          els.cashTpvNight?.value || 0
        )
      );

    cash.tpvTotal =
      cash.tpvDay +
      cash.tpvNight;
  
  
    return cash;
  }
  
  
  // ============================================================
  // CALCULAR TOTAL POR DENOMINACIONES
  // ============================================================
  
  function calculateCashTotal(
    denominations
  ) {
  
    const total =
      cashDenominations.reduce(
        (
          sum,
          item
        ) => {
  
          const count =
            Number(
              denominations[
                item.value
              ] || 0
            );
  
          return (
            sum +
            count *
              item.value
          );
  
        },
        0
      );
  
  
    return Math.round(
      total * 100
    ) / 100;
  }


  // ============================================================
  // TOTAL TPV
  // ============================================================

  function renderCashTpvTotal(
    cash
  ) {

    if (!els.cashTpvTotal) {
      return;
    }

    const tpvDay =
      Number(
        cash.tpvDay || 0
      );

    const tpvNight =
      Number(
        cash.tpvNight || 0
      );

    if (els.cashTpvDay) {
      els.cashTpvDay.value =
        tpvDay > 0
          ? tpvDay.toFixed(2)
          : "";
    }

    if (els.cashTpvNight) {
      els.cashTpvNight.value =
        tpvNight > 0
          ? tpvNight.toFixed(2)
          : "";
    }

    renderCashTpvSummary(
      cash
    );

  }

  function renderCashTpvSummary(
    cash
  ) {

    const total =
      Number(
        cash.tpvTotal || 0
      );

    if (els.cashTpvTotal) {
      els.cashTpvTotal.textContent =
        formatMoney(total);
    }

    if (els.cashTpvDate) {
      els.cashTpvDate.textContent =
        formatTpvDate(
          els.entryDate?.value
        );
    }

  }

  function formatTpvDate(date) {

    if (!date) {
      return "—";
    }

    const [year, month, day] =
      date.split("-");

    return `${day}/${month}/${year}`;

  }
  
  
  // ============================================================
  // TOTAL DE UN CONTEO
  // ============================================================
  
  function cashSlotTotal(
    slot
  ) {
  
    const denominations =
      slot?.denominations ||
      {};
  
  
    const calculated =
      calculateCashTotal(
        denominations
      );
  
  
    return Object.keys(
      denominations
    ).length
  
      ? calculated
  
      : Number(
          slot?.total || 0
        );
  }
  
  
  // ============================================================
  // DIFERENCIAS
  // ============================================================
  
  function renderCashDiffs(
    cash
  ) {
  
    const morning =
      cashSlotTotal(
        cash.morning
      );
  
    const start =
      cashSlotTotal(
        cash.start
      );
  
    const end =
      cashSlotTotal(
        cash.end
      );
  
  
    if (els.cashDiffStart) {
  
      els.cashDiffStart.textContent =
        formatMoney(
          start - morning
        );
  
    }
  
  
    if (els.cashDiffEnd) {
  
      els.cashDiffEnd.textContent =
        formatMoney(
          end - start
        );
  
    }
  
  
    if (els.cashDiffDay) {
  
      els.cashDiffDay.textContent =
        formatMoney(
          end - morning
        );
  
    }
  
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
  
  
    setTimeout(
      () => {
  
        element.textContent =
          "";
  
      },
      2200
    );
  
  }
