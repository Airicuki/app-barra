export function isAdmin(session) {
    return session?.role === "admin";
  }
  
  export function isJefeBarra(session) {
    return session?.role === "jefeBarra";
  }
  
  export function canManageNotes(session) {
    return [
      "admin",
      "jefeBarra"
    ].includes(session?.role);
  }
  
  export function canManageInventory(session) {
    return [
      "admin",
      "jefeBarra"
    ].includes(session?.role);
  }
  
  export function canExportReports(session) {
    return session?.role === "admin";
  }
  
  export function canAccessAdminView(session) {
    return session?.role === "admin";
  }