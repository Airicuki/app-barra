import { db } from "../config/supabase.js";

import { els } from "../utils/dom.js";

import * as appState from "../state/state.js";

import { loadProductsFromSupabase } from "../modules/inventario.js";


// =====================================================
// LOGIN
// =====================================================

export async function login(event) {
  event.preventDefault();

  console.log("📱 LOGIN EJECUTADO");

  const username = els.username.value.trim();
  const password = els.password.value;

  els.loginError.textContent = "";

  if (!username || !password) {
    els.loginError.textContent =
      "Introduce usuario y contraseña.";
    return;
  }

  try {

    // -------------------------------------------------
    // 1. Obtener email asociado al username
    // -------------------------------------------------

    const {
      data: email,
      error: emailError
    } = await db.rpc(
      "get_login_email",
      {
        p_username: username
      }
    );

    if (emailError || !email) {

      els.loginError.textContent =
        "Usuario o contraseña incorrectos.";

      return;
    }


    // -------------------------------------------------
    // 2. Login en Supabase Auth
    // -------------------------------------------------

    const {
      data: authData,
      error: authError
    } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {

      console.error(
        "❌ Error de autenticación:",
        authError
      );

      els.loginError.textContent =
        "Usuario o contraseña incorrectos.";

      return;
    }


    // -------------------------------------------------
    // 3. Obtener perfil
    // -------------------------------------------------

    const {
      data: profile,
      error: profileError
    } = await db
      .from("usuarios")
      .select(
        "id, username, email, rol"
      )
      .eq(
        "id",
        authData.user.id
      )
      .single();

    if (profileError || !profile) {

      console.error(
        "❌ No se pudo obtener el perfil:",
        profileError
      );

      await db.auth.signOut();

      els.loginError.textContent =
        "No se ha podido cargar el perfil del usuario.";

      return;
    }


    // -------------------------------------------------
    // 4. Crear sesión de aplicación
    // -------------------------------------------------

    appState.setSession({
      userId: authData.user.id,
      username: profile.username,
      email: profile.email,
      role: profile.rol,
      label: getRoleLabel(profile.rol)
    });

    console.log(
      "✅ Login correcto"
    );

    console.log(
      "👤 Usuario:",
      appState.session.username
    );

    console.log(
      "🔐 Rol:",
      appState.session.role
    );


    // -------------------------------------------------
    // 5. Cargar inventario
    // -------------------------------------------------

    const productsLoaded =
      await loadProductsFromSupabase();

    if (!productsLoaded) {

      console.error(
        "❌ No se pudo cargar el inventario."
      );

      await db.auth.signOut();

      appState.clearSession();

      els.loginError.textContent =
        "No se ha podido cargar el inventario.";

      return;
    }


    // -------------------------------------------------
    // 6. Entrar en la aplicación
    // -------------------------------------------------

    els.loginForm.reset();

    els.loginError.textContent = "";

    await showDashboard();

  } catch (error) {

    console.error(
      "❌ Error inesperado durante el login:",
      error
    );

    els.loginError.textContent =
      "Ha ocurrido un error al iniciar sesión.";
  }
}


// =====================================================
// MOSTRAR DASHBOARD
// =====================================================

export async function showDashboard() {

  els.loginView.classList.add(
    "hidden"
  );

  els.dashboardView.classList.remove(
    "hidden"
  );


  // Si no existe sesión, no continuamos
  if (!appState.session) {
    return;
  }


  els.roleBadge.textContent =
    appState.session.label;


  // Mostrar/ocultar elementos exclusivos
  // del administrador

  els.adminOnly.forEach((node) => {

    node.classList.toggle(
      "hidden",
      appState.session.role !== "admin"
    );

  });


  // Los usuarios que no sean admin
  // entran directamente en la vista diaria

  if (
    appState.session.role !== "admin"
  ) {

    showView("dailyView");

  }
}


// =====================================================
// LOGOUT
// =====================================================

export async function logout() {

  try {

    const {
      error
    } = await db.auth.signOut();

    if (error) {

      console.error(
        "❌ Error cerrando sesión:",
        error
      );

    }

  } finally {

    appState.clearSession();

    appState.setCart({});

    appState.setLossCart({});


    els.dashboardView.classList.add(
      "hidden"
    );

    els.loginView.classList.remove(
      "hidden"
    );

  }
}


// =====================================================
// CAMBIAR DE VISTA
// =====================================================

export function showView(viewId) {

  els.views.forEach((view) => {

    view.classList.toggle(
      "hidden",
      view.id !== viewId
    );

  });


  els.tabs.forEach((tab) => {

    tab.classList.toggle(
      "active",
      tab.dataset.view === viewId
    );

  });
}


// =====================================================
// ETIQUETA DEL ROL
// =====================================================

function getRoleLabel(role) {

  const labels = {

    admin:
      "Administrador",

    jefeBarra:
      "Jefe de barra",

    user:
      "Usuario normal",

    barra:
      "Barra",

    caja:
      "Caja"

  };

  return labels[role] || role;
}


// =====================================================
// COMPROBAR SESIÓN EXISTENTE
// =====================================================

export async function testAuth() {

  const {
    data: {
      session: authSession
    },
    error
  } = await db.auth.getSession();


  if (error) {

    console.error(
      "❌ Error comprobando sesión:",
      error
    );

    return false;
  }


  if (!authSession) {

    console.log(
      "🔓 No hay sesión activa"
    );

    return false;
  }


  console.log(
    "🔐 Ya hay una sesión:",
    authSession.user.email
  );


  // -------------------------------------------------
  // Obtener perfil del usuario
  // -------------------------------------------------

  const {
    data: profile,
    error: profileError
  } = await db
    .from("usuarios")
    .select(
      "id, username, email, rol"
    )
    .eq(
      "id",
      authSession.user.id
    )
    .single();


  if (profileError || !profile) {

    console.error(
      "❌ No se pudo cargar el perfil:",
      profileError
    );

    return false;
  }


  // -------------------------------------------------
  // Restaurar sesión de aplicación
  // -------------------------------------------------

  appState.setSession({

    userId:
      authSession.user.id,

    username:
      profile.username,

    email:
      profile.email,

    role:
      profile.rol,

    label:
      getRoleLabel(profile.rol)

  });


  console.log(
    "✅ Sesión de aplicación restaurada"
  );

  console.log(
    "👤 Usuario:",
    appState.session.username
  );

  console.log(
    "🔐 Rol:",
    appState.session.role
  );


  return true;
}