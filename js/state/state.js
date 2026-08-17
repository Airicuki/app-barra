export const STORAGE_KEY = "barraBebidas.v2";
export const LEGACY_STORAGE_KEY = "barraBebidas.v1";

export const cashDenominations = [
  { value: 50, label: "50 €" },
  { value: 20, label: "20 €" },
  { value: 10, label: "10 €" },
  { value: 5, label: "5 €" },
  { value: 2, label: "2 €" },
  { value: 1, label: "1 €" },
  { value: 0.5, label: "50 cent" },
  { value: 0.2, label: "20 cent" },
  { value: 0.1, label: "10 cent" },
  { value: 0.05, label: "5 cent" },
  { value: 0.02, label: "2 cent" },
  { value: 0.01, label: "1 cent" }
];

export const cashSlots = [
  "morning",
  "start",
  "end"
];

export const defaultState = {
  barProducts: [],
  products: [
    {
      id: crypto.randomUUID(),
      name: "Agua 50 cl",
      stock: 96,
      price: 1.5
    },
    {
      id: crypto.randomUUID(),
      name: "Refresco cola",
      stock: 72,
      price: 2.5
    },
    {
      id: crypto.randomUUID(),
      name: "Cerveza",
      stock: 120,
      price: 3
    },
    {
      id: crypto.randomUUID(),
      name: "Tónica",
      stock: 48,
      price: 2.25
    },
    {
      id: crypto.randomUUID(),
      name: "Vino copa",
      stock: 36,
      price: 3.5
    }
  ],

  entries: {},
  transactions: {},
  cashCounts: {},
  notes: {},
  people: [
    "Ruth",
    "Persona 2",
    "Persona 3",
    "Persona 4"
  ],
  rancho: {}
};

export let state = loadState();

export let session = null;

export let cart = {};

export let lossCart = {};

export function setSession(value) {
  session = value;
}

export function clearSession() {
  session = null;
}

export function setCart(value) {
  cart = value;
}

export function setLossCart(value) {
  lossCart = value;
}

export function loadState() {
  const saved =
    localStorage.getItem(STORAGE_KEY) ||
    localStorage.getItem(LEGACY_STORAGE_KEY);

  if (!saved) {
    return structuredClone(defaultState);
  }

  try {
    return normalizeState(JSON.parse(saved));
  } catch {
    return structuredClone(defaultState);
  }
}

export function normalizeState(saved) {
  return {
    products: Array.isArray(saved.products)
      ? saved.products
      : structuredClone(defaultState.products),

    entries: saved.entries || {},

    transactions: saved.transactions || {},

    cashCounts: saved.cashCounts || {},

    notes: saved.notes || {},

    people: Array.isArray(saved.people)
      ? saved.people
      : structuredClone(defaultState.people),

    rancho: saved.rancho || {}
  };
}

export function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}
