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
// CONTROL DE INICIALIZACIÓN
// =====================================================
//
// Evita inicializar los módulos dos veces.
//
// Esto es especialmente importante para ventas,
// porque initVentas() añade listeners a los botones.
//
// =====================================================

let modulesInitialized = false;


// =====================================================
// INICIALIZAR MÓDULOS
// =====================================================

async function initializeModules() {

  if (modulesInitialized) {

    console.log(
      "ℹ️ Los módulos ya estaban inicializados."
    );

    return;

  }


  console.log(
    "⚙️ Inicializando módulos con sesión..."
  );


  // ===================================================
  // VENTAS
  // ===================================================
  //
  // IMPORTANTE:
  // initVentas() carga productos_barra desde Supabase.
  // Por eso SOLO se ejecuta cuando ya existe sesión.
  //
  // ===================================================

  await initVentas();


  // ===================================================
  // RESTO DE MÓDULOS
  // ===================================================

  initPerdidas();

  initCaja();

  initInformes();

  initNotas();

  initRancho();

  await initDashboard();


  modulesInitialized = true;


  console.log(
    "✅ Módulos inicializados correctamente."
  );

}


// =====================================================
// CARGAR TODOS LOS DATOS DE LA APLICACIÓN
// =====================================================

async function loadApplicationData() {

  console.log(
    "📦 Cargando datos de la aplicación..."
  );


  // ===================================================
  // COMPROBAR SESIÓN
  // ===================================================

  if (!appState.session) {

    console.error(
      "❌ No se pueden cargar los datos: no existe sesión."
    );

    return;

  }


  // ===================================================
  // CARGAR DATOS DESDE SUPABASE
  // ===================================================

  console.log(
    "📦 Cargando inventario..."
  );

  await loadProductsFromSupabase();


  console.log(
    "💰 Cargando caja..."
  );

  await loadCashFromSupabase();


  console.log(
    "📝 Cargando notas..."
  );

  await loadNotas();


  console.log(
    "🍽️ Cargando rancho..."
  );

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
    "✅ Datos de la aplicación cargados correctamente."
  );

}


// =====================================================
// INICIO DE LA APLICACIÓN
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
          // ICONO OJO
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
    // LOGIN COMPLETADO
    // =================================================
    //
    // auth.js ya lanza este evento después de crear
    // correctamente appState.session.
    //
    // IMPORTANTE:
    // El listener se registra ANTES de testAuth().
    //
    // =================================================

    window.addEventListener(
      "app:session-ready",
      async () => {

        console.log(
          "🔐 Login realizado correctamente."
        );


        if (!appState.session) {

          console.error(
            "❌ No existe sesión de aplicación."
          );

          return;

        }


        console.log(
          "👤 Sesión:",
          appState.session
        );


        // -----------------------------------------------
        // Inicializar módulos
        // -----------------------------------------------

        await initializeModules();


        // -----------------------------------------------
        // Cargar TODOS los datos
        // -----------------------------------------------

        await loadApplicationData();


        // -----------------------------------------------
        // Mostrar dashboard
        // -----------------------------------------------

        await showDashboard();

      }
    );


    // =================================================
    // COMPROBAR SI YA EXISTE SESIÓN
    // =================================================

    const hasSession =
      await testAuth();


    // =================================================
    // SESIÓN YA EXISTENTE
    // =================================================

    if (hasSession) {

      console.log(
        "👤 Sesión de aplicación encontrada:",
        appState.session
      );


      // -----------------------------------------------
      // Inicializar módulos
      // -----------------------------------------------

      await initializeModules();


      // -----------------------------------------------
      // Cargar datos
      // -----------------------------------------------

      await loadApplicationData();


      // -----------------------------------------------
      // Mostrar dashboard
      // -----------------------------------------------

      await showDashboard();


    } else {

      console.log(
        "🔓 Esperando login..."
      );

    }

  }
);