function getRole(session) {
  return String(session?.role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
}

export function isAdmin(session) {
  return getRole(session) === "admin";
}

export function isJefeBarra(session) {
  return getRole(session) === "jefebarra";
}
  
  export function canManageNotes(session) {
    return [
      "admin",
      "jefebarra"
    ].includes(getRole(session));
  }
  
  export function canManageInventory(session) {
    return [
      "admin",
      "jefebarra",
      "barra"
    ].includes(getRole(session));
  }

  export function canAccessReports(session) {
    return [
      "admin",
      "jefebarra"
    ].includes(getRole(session));
  }
  
  export function canExportReports(session) {
    return isAdmin(session);
  }
  
  export function canAccessAdminView(session) {
    return isAdmin(session);
  }
