export type Product = {
  id: string;
  name: string;
  barcode: string;
  category: "أدوية بيطرية" | "لقاحات" | "مبيدات زراعية" | "أسمدة" | "بذور" | "أدوات زراعية";
  stock: number;
  minStock: number;
  price: number;
  cost: number;
  expiry: string;
  unit: string;
};

export const products: Product[] = [
  { id: "p1", name: "أوكسي تتراسيكلين 20%", barcode: "6291041500011", category: "أدوية بيطرية", stock: 42, minStock: 10, price: 85, cost: 55, expiry: "2026-08-12", unit: "زجاجة" },
  { id: "p2", name: "لقاح الحمى القلاعية", barcode: "6291041500028", category: "لقاحات", stock: 8, minStock: 15, price: 120, cost: 78, expiry: "2026-02-20", unit: "جرعة" },
  { id: "p3", name: "مبيد حشري كيميرا 50EC", barcode: "6291041500035", category: "مبيدات زراعية", stock: 134, minStock: 20, price: 65, cost: 38, expiry: "2027-05-01", unit: "لتر" },
  { id: "p4", name: "سماد NPK 20-20-20", barcode: "6291041500042", category: "أسمدة", stock: 56, minStock: 25, price: 45, cost: 28, expiry: "2028-01-10", unit: "كيس 25كجم" },
  { id: "p5", name: "بذور طماطم هجين F1", barcode: "6291041500059", category: "بذور", stock: 90, minStock: 30, price: 30, cost: 18, expiry: "2026-12-31", unit: "علبة" },
  { id: "p6", name: "فيتامين AD3E مركز", barcode: "6291041500066", category: "أدوية بيطرية", stock: 5, minStock: 12, price: 95, cost: 60, expiry: "2025-12-05", unit: "زجاجة" },
  { id: "p7", name: "مبيد فطري كوبروزان", barcode: "6291041500073", category: "مبيدات زراعية", stock: 28, minStock: 15, price: 55, cost: 32, expiry: "2026-09-18", unit: "كيلو" },
  { id: "p8", name: "مرشة ظهرية 16 لتر", barcode: "6291041500080", category: "أدوات زراعية", stock: 14, minStock: 5, price: 280, cost: 200, expiry: "2099-01-01", unit: "قطعة" },
];

export const salesTrend = [
  { day: "السبت", sales: 4200, profit: 1500 },
  { day: "الأحد", sales: 5100, profit: 1900 },
  { day: "الإثنين", sales: 3800, profit: 1300 },
  { day: "الثلاثاء", sales: 6500, profit: 2400 },
  { day: "الأربعاء", sales: 7200, profit: 2700 },
  { day: "الخميس", sales: 8400, profit: 3100 },
  { day: "الجمعة", sales: 5900, profit: 2100 },
];

export const categoryShare = [
  { name: "أدوية بيطرية", value: 38 },
  { name: "مبيدات زراعية", value: 27 },
  { name: "أسمدة", value: 18 },
  { name: "لقاحات", value: 10 },
  { name: "أخرى", value: 7 },
];

export const recentInvoices = [
  { id: "INV-10421", customer: "مزرعة الوادي الأخضر", total: 1240, type: "نقدي", time: "قبل 5 دقائق" },
  { id: "INV-10420", customer: "د. أحمد بيطري", total: 380, type: "آجل", time: "قبل 22 دقيقة" },
  { id: "INV-10419", customer: "عميل نقدي", total: 95, type: "نقدي", time: "قبل ساعة" },
  { id: "INV-10418", customer: "مزرعة الفجر", total: 2150, type: "تحويل بنكي", time: "قبل ساعتين" },
  { id: "INV-10417", customer: "عيادة الرحمة البيطرية", total: 640, type: "نقدي", time: "اليوم 09:14" },
];
