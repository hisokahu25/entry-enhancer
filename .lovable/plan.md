## الهدف
ترتيب التبويبات بحيث يبدأ من اليمين بـ: الإدخال → المدخلات → تم الانتهاء → الإعدادات (لأن الصفحة RTL، فالعنصر الأول في الكود يظهر على اليسار حالياً، يجب عكس الترتيب).

## التغيير
ملف واحد: `src/routes/index.tsx` (السطور 272-277).

عكس ترتيب `TabsTrigger` داخل `TabsList` ليصبح:

```tsx
<TabsList className="grid w-full grid-cols-4">
  <TabsTrigger value="settings"><SettingsIcon className="h-4 w-4 ms-1" />الإعدادات</TabsTrigger>
  <TabsTrigger value="done">تم الانتهاء ({done.length})</TabsTrigger>
  <TabsTrigger value="entries">المدخلات ({entries.length})</TabsTrigger>
  <TabsTrigger value="entry">الإدخال</TabsTrigger>
</TabsList>
```

النتيجة المرئية (من اليمين لليسار):
الإدخال | المدخلات | تم الانتهاء | الإعدادات

لا تغييرات على المنطق أو محتوى التبويبات.
