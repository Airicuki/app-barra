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


document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "🚀 Nueva aplicación modular iniciada"
    );


    // =====================================================
    // LOGIN
    // =====================================================

    if (els.loginForm) {

      els.loginForm.addEventListener(
        "submit",
        login
      );

    }


    // =====================================================
    // LOGOUT
    // =====================================================

    if (els.logoutBtn) {

      els.logoutBtn.addEventListener(
        "click",
        logout
      );

    }


    // =====================================================
    // PESTAÑAS
    // =====================================================

    els.tabs.forEach((tab) => {

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

    });


    // =====================================================
    // INVENTARIO
    // =====================================================

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


      // Botones + / - / Guardar
      els.inventoryRows.addEventListener(
        "click",
        updateInventory
      );

    }


    // =====================================================
    // FECHA OPERATIVA
    // =====================================================

    if (els.entryDate) {

      els.entryDate.value =
        operationalDate();

    }


    // =====================================================
    // COMPROBAR SESIÓN SUPABASE
    // =====================================================

    const hasSession =
      await testAuth();


    // =====================================================
    // SI HAY SESIÓN
    // =====================================================

    if (hasSession) {

      console.log(
        "👤 Sesión de aplicación encontrada:",
        appState.session
      );


      // ===================================================
      // INICIALIZAR MÓDULOS
      // ===================================================
      //
      // IMPORTANTE:
      // Estos módulos se inicializan DESPUÉS de comprobar
      // la sesión para evitar peticiones a Supabase como
      // usuario "anon".
      //
      // ===================================================

      await initVentas();

      initPerdidas();

      initCaja();

      initInformes();

      initNotas();

      initRancho();

      await initDashboard();


      // ===================================================
      // CARGAR DATOS
      // ===================================================

      await loadProductsFromSupabase();

      await loadCashFromSupabase();

      await loadNotas();

      await loadRancho();


      // ===================================================
      // RENDERIZAR
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


      // ===================================================
      // MOSTRAR DASHBOARD
      // ===================================================

      await showDashboard();


    } else {

      console.log(
        "🔓 Esperando login..."
      );

    }

  }
);