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
            showView(viewId);
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

      els.inventoryRows.addEventListener(
        "keydown",
        updateInventory
      );

    }


    // =====================================================
    // VENTAS
    // =====================================================


    if (els.entryDate) {
        els.entryDate.value =
          operationalDate();
    }

    initVentas();
    initPerdidas();
    initCaja();
    initInformes();
    initNotas();


    // =====================================================
    // SESIÓN SUPABASE
    // =====================================================

    const hasSession =
      await testAuth();


    // =====================================================
    // COMPROBAR SI YA EXISTE SESIÓN
    // =====================================================

    if (hasSession) {

      console.log(
        "👤 Sesión de aplicación encontrada:",
        appState.session
      );


      // ---------------------------------------------------
      // Cargar inventario
      // ---------------------------------------------------

      await loadProductsFromSupabase();

      await loadCashFromSupabase();
      await loadNotas();

      // ---------------------------------------------------
      // Render inicial
      // ---------------------------------------------------

      renderInventory();

      renderVentas();

      renderPerdidas();

      renderCaja();

      renderNotas();


      // ---------------------------------------------------
      // Mostrar dashboard
      // ---------------------------------------------------

      await showDashboard();


    } else {

      console.log(
        "🔓 Esperando login..."
      );

    }

  }
);