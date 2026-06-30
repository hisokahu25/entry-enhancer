// Storage abstraction: SQLite (when running inside Tauri) with localStorage fallback.
// All app code calls db.loadAll/saveAll/saveSettings/loadSettings.

import type { Entry } from "./entry-types";

const STORAGE = "subscribers_v1";
const STORAGE_DONE = "subscribers_done_v1";
const STORAGE_SETTINGS = "subscribers_settings_v1";

const isTauri = typeof window !== "undefined" && !!(window as any).__TAURI_INTERNALS__;

type Db = {
  execute: (q: string, p?: unknown[]) => Promise<unknown>;
  select: <T>(q: string, p?: unknown[]) => Promise<T>;
};

let dbPromise: Promise<Db> | null = null;
async function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const mod = await import("@tauri-apps/plugin-sql");
      // @ts-expect-error - default export type
      const Database = mod.default ?? mod;
      return (await Database.load("sqlite:subscribers.db")) as Db;
    })();
  }
  return dbPromise;
}

const COLS = [
  "id","status","name","card_number","address","branch","account_number","sewage",
  "units","meter_open_date","accounting_type","bronze_number","install_date","mobile",
  "plumber","coupon_number","coupon_amount","notes","created_at",
];

function entryToRow(e: Entry, status: "active" | "done"): unknown[] {
  return [
    e.id, status, e.name, e.cardNumber, e.address, e.branch, e.accountNumber, e.sewage,
    e.units, e.meterOpenDate, e.accountingType, e.bronzeNumber, e.installDate, e.mobile,
    e.plumber, e.couponNumber, e.couponAmount, e.notes, Date.now(),
  ];
}

function rowToEntry(r: any): Entry {
  return {
    id: r.id, name: r.name ?? "", cardNumber: r.card_number ?? "", address: r.address ?? "",
    branch: r.branch ?? "", accountNumber: r.account_number ?? "", sewage: r.sewage ?? "خاضع للصرف",
    units: r.units ?? "1", meterOpenDate: r.meter_open_date ?? "",
    accountingType: r.accounting_type ?? "أخرى", bronzeNumber: r.bronze_number ?? "",
    installDate: r.install_date ?? "", mobile: r.mobile ?? "", plumber: r.plumber ?? "الجميل",
    couponNumber: r.coupon_number ?? "0", couponAmount: r.coupon_amount ?? "0",
    notes: r.notes ?? "",
  };
}

export interface Settings { autoNavigateAfterSubmit: boolean }
export const defaultSettings: Settings = { autoNavigateAfterSubmit: false };

export const db = {
  isTauri,
  backend: isTauri ? "SQLite (Tauri)" : "localStorage (المتصفح)",

  async loadAll(): Promise<{ entries: Entry[]; done: Entry[] }> {
    if (isTauri) {
      const d = await getDb();
      const rows = await d.select<any[]>("SELECT * FROM entries ORDER BY created_at ASC");
      const entries: Entry[] = []; const done: Entry[] = [];
      for (const r of rows) (r.status === "done" ? done : entries).push(rowToEntry(r));
      return { entries, done };
    }
    const ls = (k: string): Entry[] => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : []; } catch { return []; } };
    return { entries: ls(STORAGE), done: ls(STORAGE_DONE) };
  },

  async saveAll(entries: Entry[], done: Entry[]): Promise<void> {
    if (isTauri) {
      const d = await getDb();
      await d.execute("DELETE FROM entries");
      const placeholders = COLS.map((_, i) => `$${i + 1}`).join(",");
      const sql = `INSERT INTO entries (${COLS.join(",")}) VALUES (${placeholders})`;
      for (const e of entries) await d.execute(sql, entryToRow(e, "active"));
      for (const e of done) await d.execute(sql, entryToRow(e, "done"));
      return;
    }
    localStorage.setItem(STORAGE, JSON.stringify(entries));
    localStorage.setItem(STORAGE_DONE, JSON.stringify(done));
  },

  async loadSettings(): Promise<Settings> {
    try {
      const v = localStorage.getItem(STORAGE_SETTINGS);
      return v ? { ...defaultSettings, ...JSON.parse(v) } : defaultSettings;
    } catch { return defaultSettings; }
  },
  async saveSettings(s: Settings): Promise<void> {
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(s));
  },
};