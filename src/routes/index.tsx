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
import { Pencil, Copy, FileDown, FileSpreadsheet, CheckCircle2 } from "lucide-react";

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

  useEffect(() => {
    try {
      const a = localStorage.getItem(STORAGE);
      const b = localStorage.getItem(STORAGE_DONE);
      if (a) setEntries(JSON.parse(a));
      if (b) setDone(JSON.parse(b));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(entries));
  }, [entries]);
  useEffect(() => {
    localStorage.setItem(STORAGE_DONE, JSON.stringify(done));
  }, [done]);

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
    } else {
      setEntries((arr) => [...arr, { ...form, id: crypto.randomUUID() }]);
      toast.success("تم ترحيل البيانات");
    }
    setForm(emptyEntry());
    setTab("entries");
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

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const rows = entries.map((e, i) => ({
      "مسلسل": i + 1,
      "الاسم": e.name,
      "العنوان": e.address,
      "رقم البطاقة": e.cardNumber,
      "رقم الاشتراك": buildSubscription(e.branch, e.accountNumber),
      "نوع المحاسبة": e.accountingType,
      "رقم الموبايل": e.mobile,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المدخلات");
    XLSX.writeFile(wb, "المدخلات.xlsx");
  };

  const exportPdf = async () => {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["#", "Name", "Address", "Card", "Subscription", "Type", "Mobile"]],
      body: entries.map((e, i) => [
        i + 1, e.name, e.address, e.cardNumber,
        buildSubscription(e.branch, e.accountNumber),
        e.accountingType, e.mobile,
      ]),
    });
    doc.save("entries.pdf");
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background p-4 md:p-8">
      <Toaster position="top-center" richColors />
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-2xl font-bold text-foreground md:text-3xl">
          نظام إدخال بيانات المشتركين
        </h1>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="entry">الإدخال</TabsTrigger>
            <TabsTrigger value="entries">المدخلات ({entries.length})</TabsTrigger>
            <TabsTrigger value="done">تم الانتهاء ({done.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="entry">
            <Card>
              <CardHeader>
                <CardTitle>{editingId ? "تعديل بيانات مشترك" : "إدخال بيانات مشترك"}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                  <Input value={form.meterOpenDate} onChange={(e) => update("meterOpenDate", e.target.value)} placeholder="يدوي" />
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
                  <Input value={form.installDate} onChange={(e) => update("installDate", e.target.value)} placeholder="يدوي" />
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
                  <Button variant="outline" size="sm" onClick={exportExcel} disabled={!entries.length}>
                    <FileSpreadsheet className="ms-1 h-4 w-4" /> Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportPdf} disabled={!entries.length}>
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
              <CardHeader><CardTitle>تم الانتهاء منه</CardTitle></CardHeader>
              <CardContent>
                <EntriesTable
                  rows={tableRows(done)}
                  onCopy={copyCell}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function EntriesTable({
  rows, onCopy, onEdit, onDone,
}: {
  rows: { e: Entry; cells: string[] }[];
  onCopy: (v: string) => void;
  onEdit?: (e: Entry) => void;
  onDone?: (e: Entry) => void;
}) {
  const headers = ["مسلسل", "الاسم", "العنوان", "رقم البطاقة", "رقم الاشتراك", "نوع المحاسبة", "رقم الموبايل"];
  if (!rows.length) {
    return <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
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
                  className="cursor-pointer hover:bg-accent group"
                  title="اضغط للنسخ"
                >
                  <span className="inline-flex items-center gap-1">
                    {c}
                    {c && <Copy className="h-3 w-3 opacity-0 group-hover:opacity-50" />}
                  </span>
                </TableCell>
              ))}
              <TableCell>
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
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
