import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast, Toaster } from "sonner";
import { Pencil, Copy, FileDown, FileSpreadsheet, CheckCircle2, Undo2, Settings as SettingsIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "نظام إدخال بيانات المشتركين" },
      { name: "description", content: "إدخال وإدارة بيانات اشتراكات المياه والصرف" },
      { property: "og:title", content: "نظام إدخال بيانات المشتركين" },
      { property: "og:description", content: "إدخال وإدارة بيانات اشتراكات المياه والصرف" },
    ],
  }),
  component: Index,
});

type AccountingType = "منزلي" | "تجاري" | "حكومي" | "كبار مشتركين" | "أخرى";
type Plumber = "الجميل" | "ابوزيد";

interface Entry {
  id: string;
  name: string;
  cardNumber: string;
  address: string;
  branch: string;
  accountNumber: string;
  sewage: string;
  units: string;
  meterOpenDate: string;
  accountingType: AccountingType;
  bronzeNumber: string;
  installDate: string;
  mobile: string;
  plumber: Plumber;
  couponNumber: string;
  couponAmount: string;
  notes: string;
}

const STORAGE = "subscribers_v1";
const STORAGE_DONE = "subscribers_done_v1";
const STORAGE_SETTINGS = "subscribers_settings_v1";

interface Settings {
  autoNavigateAfterSubmit: boolean;
}
const defaultSettings: Settings = { autoNavigateAfterSubmit: false };

const emptyEntry = (): Entry => ({
  id: crypto.randomUUID(),
  name: "",
  cardNumber: "",
  address: "",
  branch: "",
  accountNumber: "",
  sewage: "خاضع للصرف",
  units: "1",
  meterOpenDate: "",
  accountingType: "أخرى",
  bronzeNumber: "",
  installDate: "",
  mobile: "",
  plumber: "الجميل",
  couponNumber: "0",
  couponAmount: "0",
  notes: "",
});

function computeSewage(address: string): string {
  return address.includes("مايو") ? "غير خاضع للصرف" : "خاضع للصرف";
}

function buildSubscription(branch: string, accountNumber: string): string {
  if (!branch || !accountNumber) return "";
  const b = String(branch).replace(/\D/g, "");
  const a = String(accountNumber).replace(/\D/g, "");
  if (!b || !a) return "";
  const branchPart = b.padStart(2, "0").slice(-2);
  const accountPart = a.padStart(7, "0").slice(-7);
  return `12${branchPart}1${accountPart}`;
}

function Index() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [done, setDone] = useState<Entry[]>([]);
  const [form, setForm] = useState<Entry>(emptyEntry);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tab, setTab] = useState("entry");
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    try {
      const a = localStorage.getItem(STORAGE);
      const b = localStorage.getItem(STORAGE_DONE);
      const s = localStorage.getItem(STORAGE_SETTINGS);
      if (a) setEntries(JSON.parse(a));
      if (b) setDone(JSON.parse(b));
      if (s) setSettings({ ...defaultSettings, ...JSON.parse(s) });
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(entries));
  }, [entries]);
  useEffect(() => {
    localStorage.setItem(STORAGE_DONE, JSON.stringify(done));
  }, [done]);
  useEffect(() => {
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  const sewageAuto = useMemo(() => computeSewage(form.address), [form.address]);
  useEffect(() => {
    setForm((f) => ({ ...f, sewage: computeSewage(f.address) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.address]);

  const update = <K extends keyof Entry>(k: K, v: Entry[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("الاسم مطلوب");
    if (form.mobile && !/^\d{11}$/.test(form.mobile))
      return toast.error("رقم الموبايل يجب أن يكون 11 رقم");

    if (editingId) {
      setEntries((arr) => arr.map((e) => (e.id === editingId ? { ...form, id: editingId } : e)));
      toast.success("تم تعديل البيانات");
      setEditingId(null);
      setForm(emptyEntry());
      setTab("entries");
      return;
    } else {
      setEntries((arr) => [...arr, { ...form, id: crypto.randomUUID() }]);
      toast.success("تم ترحيل البيانات");
    }
    setForm(emptyEntry());
    if (settings.autoNavigateAfterSubmit) setTab("entries");
  };

  const handleEdit = (e: Entry) => {
    setForm(e);
    setEditingId(e.id);
    setTab("entry");
  };

  const copyCell = (val: string) => {
    navigator.clipboard.writeText(val).then(() => toast.success("تم النسخ"));
  };

  const moveToDone = (e: Entry) => {
    setDone((d) => [...d, e]);
    setEntries((arr) => arr.filter((x) => x.id !== e.id));
    toast.success("تم الانتهاء من السطر");
  };

  const restoreFromDone = (e: Entry) => {
    setEntries((arr) => [...arr, e]);
    setDone((d) => d.filter((x) => x.id !== e.id));
    toast.success("تم إرجاع السطر للمدخلات");
  };

  const tableRows = (list: Entry[]) =>
    list.map((e, i) => {
      const sub = buildSubscription(e.branch, e.accountNumber);
      const cells = [
        String(i + 1),
        e.name,
        e.address,
        e.cardNumber,
        sub,
        e.accountingType,
        e.mobile,
      ];
      return { e, cells };
    });

  const exportExcel = async (list: Entry[], filename: string) => {
    const XLSX = await import("xlsx");
    const rows = list.map((e, i) => ({
      "مسلسل": i + 1,
      "الاسم": e.name,
      "العنوان": e.address,
      "رقم البطاقة": e.cardNumber,
      "الفرع": e.branch,
      "رقم الحساب": e.accountNumber,
      "رقم الاشتراك": buildSubscription(e.branch, e.accountNumber),
      "الخضوع للصرف": e.sewage,
      "عدد الوحدات": e.units,
      "تاريخ فتح العداد": e.meterOpenDate,
      "نوع المحاسبة": e.accountingType,
      "رقم البرونز": e.bronzeNumber,
      "تاريخ التركيب": e.installDate,
      "رقم الموبايل": e.mobile,
      "السباك": e.plumber,
      "رقم القسيمة": e.couponNumber,
      "بند مبلغ القسيمة": e.couponAmount,
      "ملاحظات": e.notes,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, filename);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const exportPdf = (list: Entry[], title: string) => {
    const w = window.open("", "_blank");
    if (!w) return toast.error("افتح النوافذ المنبثقة لإتمام التصدير");
    const rows = list.map((e, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${esc(e.name)}</td>
        <td>${esc(e.address)}</td>
        <td>${esc(e.cardNumber)}</td>
        <td>${esc(buildSubscription(e.branch, e.accountNumber))}</td>
        <td>${esc(e.accountingType)}</td>
        <td>${esc(e.mobile)}</td>
        <td>${esc(e.sewage)}</td>
        <td>${esc(e.units)}</td>
        <td>${esc(e.meterOpenDate)}</td>
        <td>${esc(e.bronzeNumber)}</td>
        <td>${esc(e.installDate)}</td>
        <td>${esc(e.plumber)}</td>
        <td>${esc(e.couponNumber)}</td>
        <td>${esc(e.couponAmount)}</td>
        <td>${esc(e.notes)}</td>
      </tr>`).join("");
    w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${title}</title>
      <style>
        body{font-family:"Segoe UI","Tahoma",Arial,sans-serif;direction:rtl;padding:16px;}
        h1{font-size:18px;margin:0 0 12px;}
        table{width:100%;border-collapse:collapse;font-size:11px;}
        th,td{border:1px solid #333;padding:4px 6px;text-align:right;vertical-align:top;}
        th{background:#eee;}
        @media print{@page{size:A4 landscape;margin:10mm;}}
      </style></head><body>
      <h1>${title}</h1>
      <table><thead><tr>
        <th>م</th><th>الاسم</th><th>العنوان</th><th>رقم البطاقة</th><th>رقم الاشتراك</th>
        <th>نوع المحاسبة</th><th>الموبايل</th><th>الصرف</th><th>الوحدات</th><th>فتح العداد</th>
        <th>البرونز</th><th>التركيب</th><th>السباك</th><th>القسيمة</th><th>المبلغ</th><th>ملاحظات</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <script>window.onload=()=>{setTimeout(()=>window.print(),300);}</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background p-4 md:p-8">
      <Toaster position="top-center" richColors />
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-2xl font-bold text-foreground md:text-3xl">
          نظام إدخال بيانات المشتركين
        </h1>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="entry">الإدخال</TabsTrigger>
            <TabsTrigger value="entries">المدخلات ({entries.length})</TabsTrigger>
            <TabsTrigger value="done">تم الانتهاء ({done.length})</TabsTrigger>
            <TabsTrigger value="settings"><SettingsIcon className="h-4 w-4 ms-1" />الإعدادات</TabsTrigger>
          </TabsList>

          <TabsContent value="entry">
            <Card>
              <CardHeader>
                <CardTitle>{editingId ? "تعديل بيانات مشترك" : "إدخال بيانات مشترك"}</CardTitle>
              </CardHeader>
              <CardContent dir="rtl" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 text-right">
                <Field label="الاسم">
                  <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
                </Field>
                <Field label="رقم البطاقة">
                  <Input
                    value={form.cardNumber}
                    onChange={(e) => update("cardNumber", e.target.value.replace(/\D/g, "").slice(0, 14))}
                    inputMode="numeric"
                    maxLength={14}
                  />
                </Field>
                <Field label="العنوان">
                  <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
                </Field>
                <Field label="الفرع">
                  <Input value={form.branch} onChange={(e) => update("branch", e.target.value)} placeholder="مثال: 1 أو 20" />
                </Field>
                <Field label="رقم الحساب">
                  <Input value={form.accountNumber} onChange={(e) => update("accountNumber", e.target.value)} />
                </Field>
                <Field label="الخضوع للصرف (تلقائي)">
                  <Input value={sewageAuto} readOnly className="bg-muted" />
                </Field>
                <Field label="عدد الوحدات">
                  <Input type="number" value={form.units} onChange={(e) => update("units", e.target.value)} />
                </Field>
                <Field label="تاريخ فتح العداد">
                  <Input type="date" value={form.meterOpenDate} onChange={(e) => update("meterOpenDate", e.target.value)} />
                </Field>
                <Field label="نوع المحاسبة">
                  <Select value={form.accountingType} onValueChange={(v) => update("accountingType", v as AccountingType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="منزلي">منزلي</SelectItem>
                      <SelectItem value="تجاري">تجاري</SelectItem>
                      <SelectItem value="حكومي">حكومي</SelectItem>
                      <SelectItem value="كبار مشتركين">كبار مشتركين</SelectItem>
                      <SelectItem value="أخرى">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="رقم البرونز">
                  <Input value={form.bronzeNumber} onChange={(e) => update("bronzeNumber", e.target.value)} />
                </Field>
                <Field label="تاريخ التركيب">
                  <Input type="date" value={form.installDate} onChange={(e) => update("installDate", e.target.value)} />
                </Field>
                <Field label="رقم الموبايل (11 رقم)">
                  <Input
                    value={form.mobile}
                    onChange={(e) => update("mobile", e.target.value.replace(/\D/g, "").slice(0, 11))}
                    inputMode="numeric"
                  />
                </Field>
                <Field label="السباك">
                  <Select value={form.plumber} onValueChange={(v) => update("plumber", v as Plumber)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="الجميل">الجميل</SelectItem>
                      <SelectItem value="ابوزيد">ابوزيد</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="رقم القسيمة">
                  <Input value={form.couponNumber} onChange={(e) => update("couponNumber", e.target.value)} />
                </Field>
                <Field label="بند مبلغ القسيمة">
                  <Input value={form.couponAmount} onChange={(e) => update("couponAmount", e.target.value)} />
                </Field>
                <Field label="ملاحظات" className="md:col-span-2 lg:col-span-3">
                  <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} />
                </Field>

                <div className="md:col-span-2 lg:col-span-3 flex gap-2">
                  <Button onClick={handleSubmit} size="lg">
                    {editingId ? "حفظ التعديل" : "ترحيل"}
                  </Button>
                  {editingId && (
                    <Button variant="outline" size="lg" onClick={() => { setEditingId(null); setForm(emptyEntry()); }}>
                      إلغاء
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="entries">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>المدخلات</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportExcel(entries, "المدخلات")} disabled={!entries.length}>
                    <FileSpreadsheet className="ms-1 h-4 w-4" /> Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportPdf(entries, "المدخلات")} disabled={!entries.length}>
                    <FileDown className="ms-1 h-4 w-4" /> PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <EntriesTable
                  rows={tableRows(entries)}
                  onCopy={copyCell}
                  onEdit={handleEdit}
                  onDone={moveToDone}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="done">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>تم الانتهاء منه</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportExcel(done, "تم_الانتهاء")} disabled={!done.length}>
                    <FileSpreadsheet className="ms-1 h-4 w-4" /> Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportPdf(done, "تم الانتهاء")} disabled={!done.length}>
                    <FileDown className="ms-1 h-4 w-4" /> PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DoneList items={done} onCopy={copyCell} onRestore={restoreFromDone} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader><CardTitle>الإعدادات</CardTitle></CardHeader>
              <CardContent className="space-y-4" dir="rtl">
                <div className="flex items-center justify-between rounded-md border p-4">
                  <div className="space-y-1 text-right">
                    <Label className="text-base">الانتقال التلقائي لتاب المدخلات بعد الترحيل</Label>
                    <p className="text-sm text-muted-foreground">
                      عند الإيقاف: يتم إظهار رسالة "تم الترحيل" والبقاء في شاشة الإدخال.
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoNavigateAfterSubmit}
                    onCheckedChange={(v) => setSettings((s) => ({ ...s, autoNavigateAfterSubmit: v }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function esc(s: string): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function DoneList({ items, onCopy, onRestore }: { items: Entry[]; onCopy: (v: string) => void; onRestore: (e: Entry) => void }) {
  if (!items.length) return <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>;
  const fields: { label: string; get: (e: Entry) => string }[] = [
    { label: "الاسم", get: (e) => e.name },
    { label: "رقم البطاقة", get: (e) => e.cardNumber },
    { label: "العنوان", get: (e) => e.address },
    { label: "الفرع", get: (e) => e.branch },
    { label: "رقم الحساب", get: (e) => e.accountNumber },
    { label: "رقم الاشتراك", get: (e) => buildSubscription(e.branch, e.accountNumber) },
    { label: "الخضوع للصرف", get: (e) => e.sewage },
    { label: "عدد الوحدات", get: (e) => e.units },
    { label: "تاريخ فتح العداد", get: (e) => e.meterOpenDate },
    { label: "نوع المحاسبة", get: (e) => e.accountingType },
    { label: "رقم البرونز", get: (e) => e.bronzeNumber },
    { label: "تاريخ التركيب", get: (e) => e.installDate },
    { label: "رقم الموبايل", get: (e) => e.mobile },
    { label: "السباك", get: (e) => e.plumber },
    { label: "رقم القسيمة", get: (e) => e.couponNumber },
    { label: "بند مبلغ القسيمة", get: (e) => e.couponAmount },
    { label: "ملاحظات", get: (e) => e.notes },
  ];
  return (
    <div dir="rtl" className="space-y-4">
      {items.map((e, idx) => (
        <div key={e.id} className="rounded-md border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">#{idx + 1} — {e.name || "(بدون اسم)"}</div>
            <Button size="sm" variant="outline" onClick={() => onRestore(e)}>
              <Undo2 className="h-3 w-3 ms-1" /> إرجاع
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-right">
            {fields.map((f) => {
              const v = f.get(e);
              return (
                <div key={f.label} className="text-sm">
                  <div className="text-muted-foreground text-xs mb-0.5">{f.label}</div>
                  <div
                    className="cursor-pointer hover:bg-accent rounded px-1 py-0.5 break-words"
                    title="اضغط للنسخ"
                    onClick={() => v && onCopy(v)}
                  >
                    {v || <span className="text-muted-foreground">—</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div dir="rtl" className={`space-y-1.5 text-right ${className}`}>
      <Label className="text-sm block text-right">{label}</Label>
      {children}
    </div>
  );
}

function EntriesTable({
  rows, onCopy, onEdit, onDone, onRestore,
}: {
  rows: { e: Entry; cells: string[] }[];
  onCopy: (v: string) => void;
  onEdit?: (e: Entry) => void;
  onDone?: (e: Entry) => void;
  onRestore?: (e: Entry) => void;
}) {
  const headers = ["مسلسل", "الاسم", "العنوان", "رقم البطاقة", "رقم الاشتراك", "نوع المحاسبة", "رقم الموبايل"];
  if (!rows.length) {
    return <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>;
  }
  return (
    <div className="overflow-x-auto" dir="rtl">
      <Table dir="rtl">
        <TableHeader>
          <TableRow>
            {headers.map((h) => <TableHead key={h} className="text-right">{h}</TableHead>)}
            <TableHead className="text-right">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ e, cells }) => (
            <TableRow key={e.id}>
              {cells.map((c, i) => (
                <TableCell
                  key={i}
                  onClick={() => c && onCopy(c)}
                  className="cursor-pointer hover:bg-accent group text-right align-top"
                  title="اضغط للنسخ"
                >
                  <span className="inline-flex items-center gap-1">
                    {c}
                    {c && <Copy className="h-3 w-3 opacity-0 group-hover:opacity-50" />}
                  </span>
                </TableCell>
              ))}
              <TableCell className="text-right align-top">
                <div className="flex gap-1">
                  {onEdit && (
                    <Button size="sm" variant="outline" onClick={() => onEdit(e)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                  {onDone && (
                    <Button size="sm" variant="outline" onClick={() => onDone(e)}>
                      <CheckCircle2 className="h-3 w-3 ms-1" /> تم
                    </Button>
                  )}
                  {onRestore && (
                    <Button size="sm" variant="outline" onClick={() => onRestore(e)}>
                      <Undo2 className="h-3 w-3 ms-1" /> إرجاع
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
