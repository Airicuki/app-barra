import { db } from "../config/supabase.js";
import { els } from "../utils/dom.js";
import {
  loadCashFromSupabase,
  renderCaja
} from "../modules/caja.js";
import {
  loadBarProductsFromSupabase
} from "./productos-barra.service.js";
import {
  renderVentas,
  loadTransactionsFromSupabase
} from "../modules/ventas.js";
import {
  loadProductsFromSupabase,
  renderInventory
} from "../modules/inventario.js";
import {
  loadNotas,
  renderNotas
} from "../modules/notas.js";
import {
  loadRancho,
  renderRancho
} from "../modules/rancho.js";
import { renderDashboard } from "../modules/dashboard.js";
import { loadCashReport } from "../modules/informes.js";

let channel = null;
const queuedUpdates = new Map();

function queueUpdate(key, update) {
  clearTimeout(queuedUpdates.get(key));

  queuedUpdates.set(
    key,
    setTimeout(async () => {
      queuedUpdates.delete(key);

      try {
        await update();
      } catch (error) {
        console.error(
          `❌ Error sincronizando ${key}:`,
          error
        );
      }
    }, 250)
  );
}

function currentOperationalDate() {
  return els.entryDate?.value || "";
}

function refreshOpenReport(date) {
  if (els.reportDate?.value === date) {
    return loadCashReport();
  }

  return Promise.resolve();
}

export function initRealtime() {
  if (channel) {
    return;
  }

  channel = db
    .channel("app-live-sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "caja" },
      payload => {
        const date = payload.new?.fecha || payload.old?.fecha;

        queueUpdate("caja", async () => {
          if (date === currentOperationalDate()) {
            await loadCashFromSupabase(date);
            renderCaja();
          }

          await refreshOpenReport(date);
        });
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "ventas" },
      payload => {
        const date = payload.new?.fecha || payload.old?.fecha;

        queueUpdate("ventas", async () => {
          if (date === currentOperationalDate()) {
            await renderDashboard();
            await loadTransactionsFromSupabase(date);
          }

          await refreshOpenReport(date);
        });
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "detalle_ventas_barra" },
      () => {
        queueUpdate(
          "detalle-ventas-barra",
          renderDashboard
        );
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "productos_barra" },
      () => {
        queueUpdate("productos-barra", async () => {
          await loadBarProductsFromSupabase();
          renderVentas();
        });
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "productos" },
      () => {
        queueUpdate("inventario", async () => {
          await loadProductsFromSupabase();
          renderInventory();
          await renderDashboard();
        });
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notas" },
      () => {
        queueUpdate("notas", async () => {
          await loadNotas();
          renderNotas();
        });
      }
    );

  [
    "rancho_personas",
    "rancho_turnos",
    "rancho_comidas"
  ].forEach(table => {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      () => {
        queueUpdate("rancho", async () => {
          await loadRancho();
          renderRancho();
        });
      }
    );
  });

  channel.subscribe(status => {
    console.log(
      "📡 Sincronización en tiempo real:",
      status
    );
  });
}
