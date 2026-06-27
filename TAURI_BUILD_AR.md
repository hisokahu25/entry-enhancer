# تجهيز ملف تنفيذي بواسطة Tauri

تم إضافة مجلد `src-tauri/` بالإعدادات اللازمة لتغليف التطبيق كبرنامج سطح مكتب (Windows / macOS / Linux).

## المتطلبات (تُثبّت مرة واحدة على جهازك)

1. **Rust**: ثبّت من https://rustup.rs ثم أعد فتح الـ Terminal.
2. **Bun** (أو Node.js): https://bun.sh
3. **Tauri CLI**:
   ```bash
   bun add -D @tauri-apps/cli
   ```
4. على ويندوز: ثبّت **Microsoft C++ Build Tools** و **WebView2** (موجود افتراضياً في Windows 11).
   على لينكس: ثبّت `libwebkit2gtk-4.1-dev` وحزم البناء.
   على ماك: ثبّت `xcode-select --install`.

## أيقونات التطبيق (إجباري قبل البناء)

جهّز أيقونة 1024x1024 PNG ثم نفّذ:
```bash
bunx @tauri-apps/cli icon path/to/icon.png
```
سيُنشئ مجلد `src-tauri/icons/` تلقائياً.

## تشغيل التطبيق محلياً

```bash
bunx @tauri-apps/cli dev
```

## بناء الملف التنفيذي النهائي

```bash
bun run build
bunx @tauri-apps/cli build
```

الملفات الناتجة في:
- ويندوز: `src-tauri/target/release/bundle/msi/*.msi` و `nsis/*.exe`
- ماك: `src-tauri/target/release/bundle/dmg/*.dmg`
- لينكس: `src-tauri/target/release/bundle/appimage/*.AppImage`

## ملاحظة مهمة بخصوص SSR

المشروع مبني على TanStack Start (SSR افتراضياً)، لكن جميع البيانات تُخزَّن في `localStorage` على جهاز المستخدم، فيعمل بدون إنترنت داخل نافذة Tauri.

إذا أعطى الأمر `bun run build` ملفات في `.output/public` بدلاً من `dist`، عدّل `frontendDist` في `src-tauri/tauri.conf.json` ليصبح:
```json
"frontendDist": "../.output/public"
```