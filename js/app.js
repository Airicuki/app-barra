import * as appState from "./state/state.js";

import { els } from "./utils/dom.js";

import {
  operationalDate
} from "./utils/format.js";

import {
  initVentas,
  renderVentas
} from "./modules/ventas.js";

import {
  initCaja,
  renderCaja,
  loadCashFromSupabase
} from "./modules/caja.js";

import {
  showDashboard,
  login,
  logout,
  showView,
  testAuth
} from "./auth/auth.js";

import {
  loadProductsFromSupabase,
  renderInventory,
  addProduct,
  updateInventory
} from "./modules/inventario.js";

import {
  initPerdidas,
  renderPerdidas
} from "./modules/perdidas.js";

import {
  initInformes
} from "./modules/informes.js";

import {
  initNotas,
  renderNotas,
  loadNotas
} from "./modules/notas.js";

import {
  initRancho,
  renderRancho,
  loadRancho
} from "./modules/rancho.js";

import {
  initDashboard,
  renderDashboard
} from "./modules/dashboard.js";


// =====================================================
// CARGAR TODOS LOS DATOS DE LA APLICACIÓN
// =====================================================

async function loadApplicationData() {

  console.log(
    "📦 Cargando datos de la aplicación..."
  );


  // ===================================================
  // CARGAR DATOS DESDE SUPABASE
  // ===================================================

  await loadProductsFromSupabase();

  await loadCashFromSupabase();

  await loadNotas();

  await loadRancho();


  // ===================================================
  // RENDERIZAR MÓDULOS
  // ===================================================

  renderInventory();

  renderVentas();

  renderPerdidas();

  renderCaja();

  renderNotas();

  renderRancho();


  // ===================================================
  // DASHBOARD
  // ===================================================

  await renderDashboard();


  console.log(
    "✅ Datos de la aplicación cargados"
  );

}


// =====================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "🚀 Nueva aplicación modular iniciada"
    );


    // =================================================
    // LOGIN
    // =================================================

    if (els.loginForm) {

      els.loginForm.addEventListener(
        "submit",
        login
      );

    }


    // =================================================
    // MOSTRAR / OCULTAR CONTRASEÑA
    // =================================================

    if (
      els.togglePassword &&
      els.password
    ) {

      els.togglePassword.addEventListener(
        "click",
        () => {

          const visible =
            els.password.type === "text";


          els.password.type =
            visible
              ? "password"
              : "text";


          els.togglePassword.setAttribute(
            "aria-label",
            visible
              ? "Mostrar contraseña"
              : "Ocultar contraseña"
          );


          els.togglePassword.setAttribute(
            "title",
            visible
              ? "Mostrar contraseña"
              : "Ocultar contraseña"
          );


          // -------------------------------------------------
          // CAMBIAR ICONO
          // -------------------------------------------------

          els.togglePassword.innerHTML =
            visible

              ? `
                <svg
                  class="password-eye"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >

                  <path
                    d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                  />

                  <circle
                    cx="12"
                    cy="12"
                    r="2.8"
                  />

                </svg>
              `

              : `
                <svg
                  class="password-eye"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >

                  <path
                    d="M3 3l18 18"
                  />

                  <path
                    d="M10.6 6.2A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.1 3.7"
                  />

                  <path
                    d="M6.2 6.7C3.9 8.1 2.5 12 2.5 12s3.5 6 9.5 6c1.3 0 2.5-.3 3.5-.7"
                  />

                  <path
                    d="M9.9 9.9a3 3 0 0 0 4.2 4.2"
                  />

                </svg>
              `;

        }
      );

    }


    // =================================================
    // LOGOUT
    // =================================================

    if (els.logoutBtn) {

      els.logoutBtn.addEventListener(
        "click",
        logout
      );

    }


    // =================================================
    // PESTAÑAS
    // =================================================

    els.tabs.forEach(
      (tab) => {

        tab.addEventListener(
          "click",
          () => {

            const viewId =
              tab.dataset.view;


            if (viewId) {

              showView(
                viewId
              );

            }

          }
        );

      }
    );


    // =================================================
    // INVENTARIO
    // =================================================

    if (els.addProductBtn) {

      els.addProductBtn.addEventListener(
        "click",
        addProduct
      );

    }


    if (els.inventoryRows) {

      // Enter sobre una fila
      els.inventoryRows.addEventListener(
        "keydown",
        updateInventory
      );


      // Botones + / - / Guardar / Eliminar
      els.inventoryRows.addEventListener(
        "click",
        updateInventory
      );

    }


    // =================================================
    // FECHA OPERATIVA
    // =================================================

    if (els.entryDate) {

      els.entryDate.value =
        operationalDate();

    }


    // =================================================
    // INICIALIZAR MÓDULOS
    // =================================================
    //
    // Los inicializamos al arrancar la aplicación.
    // No hacen la carga de datos hasta que exista sesión.
    //
    // =================================================

    await initVentas();

    initPerdidas();

    initCaja();

    initInformes();

    initNotas();

    initRancho();

    await initDashboard();


    // =================================================
    // COMPROBAR SESIÓN EXISTENTE
    // =================================================

    const hasSession =
      await testAuth();


    // =================================================
    // SI YA EXISTE SESIÓN
    // =================================================

    if (hasSession) {

      console.log(
        "👤 Sesión de aplicación encontrada:",
        appState.session
      );


      // -----------------------------------------------
      // CARGAR DATOS
      // -----------------------------------------------

      await loadApplicationData();


      // -----------------------------------------------
      // MOSTRAR DASHBOARD
      // -----------------------------------------------

      await showDashboard();

    }


    // =================================================
    // LOGIN REALIZADO
    // =================================================
    //
    // auth.js lanzará este evento después de crear
    // correctamente appState.session.
    //
    // Esto hace que el primer login y una sesión
    // restaurada utilicen exactamente el mismo flujo.
    //
    // =================================================

    window.addEventListener(
      "app:session-ready",
      async () => {

        console.log(
          "🔐 Sesión iniciada. Cargando datos..."
        );


        if (!appState.session) {

          console.error(
            "❌ No existe sesión de aplicación."
          );

          return;
        }


        await loadApplicationData();

      }
    );


    // =================================================
    // SIN SESIÓN
    // =================================================

    if (!hasSession) {

      console.log(
        "🔓 Esperando login..."
      );

    }

  }
);