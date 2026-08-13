export function formatDate(date = new Date()) {
    return date.toISOString().slice(0, 10);
  }
  
  export function operationalDate(date = new Date()) {
    const adjusted = new Date(date);
  
    if (adjusted.getHours() < 10) {
      adjusted.setDate(
        adjusted.getDate() - 1
      );
    }
  
    return formatDate(adjusted);
  }
  
  export function dateLabel(dateValue) {
    return new Intl.DateTimeFormat(
      "es-ES",
      {
        weekday: "short",
        day: "2-digit",
        month: "2-digit"
      }
    ).format(
      new Date(`${dateValue}T12:00:00`)
    );
  }
  
  export function formatMoney(value) {
    return new Intl.NumberFormat(
      "es-ES",
      {
        style: "currency",
        currency: "EUR"
      }
    ).format(
      Number(value || 0)
    );
  }
  
  export function weekBounds(dateValue) {
    const start =
      new Date(`${dateValue}T12:00:00`);
  
    const end = new Date(start);
  
    end.setDate(
      start.getDate() + 6
    );
  
    return {
      start: formatDate(start),
      end: formatDate(end)
    };
  }
  
  export function escapeCsv(value) {
    return `"${String(value ?? "")
      .replaceAll('"', '""')}"`;
  }
  
  export function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  
  export function flash(element, message) {
    element.textContent = message;
  
    setTimeout(() => {
      element.textContent = "";
    }, 2200);
  }