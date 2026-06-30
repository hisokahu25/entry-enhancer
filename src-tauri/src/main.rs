#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:subscribers.db",
                    vec![tauri_plugin_sql::Migration {
                        version: 1,
                        description: "create_entries",
                        sql: "CREATE TABLE IF NOT EXISTS entries (\
                            id TEXT PRIMARY KEY,\
                            status TEXT NOT NULL DEFAULT 'active',\
                            name TEXT, card_number TEXT, address TEXT, branch TEXT,\
                            account_number TEXT, sewage TEXT, units TEXT,\
                            meter_open_date TEXT, accounting_type TEXT,\
                            bronze_number TEXT, install_date TEXT, mobile TEXT,\
                            plumber TEXT, coupon_number TEXT, coupon_amount TEXT,\
                            notes TEXT, created_at INTEGER\
                        );\
                        CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);\
                        CREATE INDEX IF NOT EXISTS idx_entries_account ON entries(account_number);",
                        kind: tauri_plugin_sql::MigrationKind::Up,
                    }],
                )
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}