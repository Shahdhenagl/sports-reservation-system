"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import { createClient } from "@/lib/supabase/client";
import { 
  Coins, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2, 
  Clock, 
  X,
  CreditCard,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Copy,
  Check,
  Printer,
  Calendar
} from "lucide-react";

export default function CollectionsPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];
  const supabase = createClient();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [schemaError, setSchemaError] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchTransactions = async (background = false) => {
    if (!background) setLoading(true);
    try {
      const { data, error } = await (supabase.from("transactions") as any)
        .select("*, bookings(*, customers(*))")
        .order("created_at", { ascending: false });

      if (error) {
        // Table probably doesn't exist yet
        if (error.code === "P0001" || error.message.includes("relation") || error.message.includes("does not exist")) {
          setSchemaError(true);
        }
        throw error;
      }

      setTransactions(data || []);
      setSchemaError(false);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      if (!background) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (schemaError) return;

    // Set up Realtime listener for transaction table changes
    const channel = supabase
      .channel("transactions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => {
          fetchTransactions(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schemaError]);

  const copySql = () => {
    const sql = `-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  booking_ref TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('collection', 'refund')),
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('instapay', 'wallet', 'cash')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create Policies for transactions
CREATE POLICY "Allow all for authenticated" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow insert for anon" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select for anon" ON transactions FOR SELECT USING (true);

-- Enable Realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;`;

    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter(tx => {
    // 1. Search Term
    const customerName = tx.bookings?.customers?.full_name || "";
    const matchesSearch = 
      tx.booking_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // 2. Type & Method
    const matchesType = typeFilter === "all" || tx.type === typeFilter;
    const matchesMethod = methodFilter === "all" || tx.method === methodFilter;
    if (!matchesType || !matchesMethod) return false;

    // 3. Date Filter
    if (dateFilter === "all") return true;
    const txDate = new Date(tx.created_at);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (dateFilter === "today") {
      const txDateStr = txDate.toDateString();
      const todayStr = today.toDateString();
      return txDateStr === todayStr;
    }
    if (dateFilter === "7days") {
      const limit = new Date();
      limit.setDate(limit.getDate() - 7);
      limit.setHours(0,0,0,0);
      return txDate >= limit;
    }
    if (dateFilter === "30days") {
      const limit = new Date();
      limit.setDate(limit.getDate() - 30);
      limit.setHours(0,0,0,0);
      return txDate >= limit;
    }
    if (dateFilter === "custom") {
      let startMatch = true;
      let endMatch = true;
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        startMatch = txDate >= start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23,59,59,999);
        endMatch = txDate <= end;
      }
      return startMatch && endMatch;
    }

    return true;
  });

  // Calculations based on filtered transactions so stats update instantly!
  const collections = filteredTransactions.filter(tx => tx.type === "collection");
  const refunds = filteredTransactions.filter(tx => tx.type === "refund");

  const totalCollected = collections.reduce((acc, tx) => acc + parseFloat(tx.amount || 0), 0);
  const totalRefunded = refunds.reduce((acc, tx) => acc + parseFloat(tx.amount || 0), 0);
  const netIncome = totalCollected - totalRefunded;

  // Method Breakdown based on filtered transactions
  const instapayTotal = filteredTransactions
    .filter(tx => tx.method === "instapay")
    .reduce((acc, tx) => acc + (tx.type === "collection" ? 1 : -1) * parseFloat(tx.amount || 0), 0);

  const walletTotal = filteredTransactions
    .filter(tx => tx.method === "wallet")
    .reduce((acc, tx) => acc + (tx.type === "collection" ? 1 : -1) * parseFloat(tx.amount || 0), 0);

  const cashTotal = filteredTransactions
    .filter(tx => tx.method === "cash")
    .reduce((acc, tx) => acc + (tx.type === "collection" ? 1 : -1) * parseFloat(tx.amount || 0), 0);

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {language === 'ar' ? 'التحصيلات والمدفوعات المالية' : 'Financial Collections & Payments'}
          </h1>
          <p className="text-muted">
            {language === 'ar' ? 'مراقبة وإدارة كل المقبوضات والمرتجع المالي لحظة بلحظة.' : 'Monitor and manage all cash inflows and refund outflows in real-time.'}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20 text-sm"
        >
          <Printer className="w-4 h-4" />
          {language === 'ar' ? 'تصدير تقرير A4 PDF' : 'Export A4 PDF Report'}
        </button>
      </div>

      {schemaError ? (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">
                {language === 'ar' ? 'تحديث قاعدة البيانات مطلوب' : 'Database Update Required'}
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {language === 'ar' 
                  ? 'لتفعيل دفتر المعاملات المالية، يرجى تشغيل كود SQL التالي في لوحة تحكم Supabase (SQL Editor). سيقوم هذا الكود بإنشاء جدول المعاملات وتفعيل الأمان والبث الفوري.' 
                  : 'To enable the financial ledger page, please run the following SQL code in your Supabase Dashboard SQL Editor. This will create the transactions table and enable security & realtime.'}
              </p>
            </div>
          </div>

          <div className="relative bg-black/40 rounded-xl p-4 border border-border/80 font-mono text-xs overflow-x-auto text-yellow-500/90 whitespace-pre leading-relaxed">
            <button 
              onClick={copySql}
              className="absolute top-3 right-3 p-2 bg-surface hover:bg-surface-hover border border-border text-foreground hover:text-primary rounded-lg transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[10px] font-sans font-medium">{copied ? (language === 'ar' ? 'تم النسخ' : 'Copied') : (language === 'ar' ? 'نسخ الكود' : 'Copy SQL')}</span>
            </button>
            {`-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  booking_ref TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('collection', 'refund')),
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('instapay', 'wallet', 'cash')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Allow all for authenticated" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow insert for anon" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select for anon" ON transactions FOR SELECT USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;`}
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="glass rounded-2xl p-6 border border-border/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-colors" />
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                  {language === 'ar' ? 'المقبوضات' : 'Inflow'}
                </span>
              </div>
              <p className="text-xs text-muted mb-1">{language === 'ar' ? 'إجمالي التحصيلات' : 'Total Collections'}</p>
              <h3 className="text-2xl font-black text-foreground">EGP {totalCollected.toLocaleString()}</h3>
            </div>

            <div className="glass rounded-2xl p-6 border border-border/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors" />
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                  {language === 'ar' ? 'المرتجع' : 'Outflow'}
                </span>
              </div>
              <p className="text-xs text-muted mb-1">{language === 'ar' ? 'إجمالي المسترد' : 'Total Refunded'}</p>
              <h3 className="text-2xl font-black text-foreground">EGP {totalRefunded.toLocaleString()}</h3>
            </div>

            <div className="glass rounded-2xl p-6 border border-border/50 relative overflow-hidden group sm:col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {language === 'ar' ? 'صافي الدخل' : 'Net Flow'}
                </span>
              </div>
              <p className="text-xs text-muted mb-1">{language === 'ar' ? 'صافي المقبوضات' : 'Net Cash-flow'}</p>
              <h3 className="text-2xl font-black text-primary">EGP {netIncome.toLocaleString()}</h3>
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="bg-surface/30 border border-border/50 rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-foreground">
              {language === 'ar' ? 'توزيع المبالغ حسب طريقة الدفع (الصافي)' : 'Net Flow Breakdown by Payment Method'}
            </h4>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="flex items-center gap-3 bg-surface/50 border border-border/40 p-4 rounded-xl">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-muted font-medium">InstaPay</p>
                  <p className="text-sm font-bold text-foreground">EGP {instapayTotal.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-surface/50 border border-border/40 p-4 rounded-xl">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-muted font-medium">{language === 'ar' ? 'محفظة إلكترونية' : 'E-Wallet'}</p>
                  <p className="text-sm font-bold text-foreground">EGP {walletTotal.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-surface/50 border border-border/40 p-4 rounded-xl">
                <div className="h-10 w-10 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-muted font-medium">{language === 'ar' ? 'كاش (نقدي)' : 'Cash'}</p>
                  <p className="text-sm font-bold text-foreground">EGP {cashTotal.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Searching and Filters */}
          <div className="flex flex-col gap-4 space-y-3 print:hidden">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className={`absolute top-1/2 -translate-y-1/2 ${direction === 'rtl' ? 'right-4' : 'left-4'} h-4 w-4 text-muted`} />
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'البحث برقم الحجز أو اسم العميل...' : 'Search by Booking Code or Customer...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full bg-surface border border-border rounded-xl py-2.5 ${direction === 'rtl' ? 'pr-11 pl-4' : 'pl-11 pr-4'} text-sm text-foreground placeholder-muted outline-none focus:ring-2 focus:ring-primary`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-surface border border-border rounded-xl px-3 py-1.5">
                  <Filter className="w-4 h-4 text-muted" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-transparent text-sm text-foreground outline-none cursor-pointer"
                  >
                    <option value="all">{language === 'ar' ? 'كل العمليات' : 'All Types'}</option>
                    <option value="collection">{language === 'ar' ? 'التحصيل فقط' : 'Collections'}</option>
                    <option value="refund">{language === 'ar' ? 'المرتجع فقط' : 'Refunds'}</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-surface border border-border rounded-xl px-3 py-1.5">
                  <Filter className="w-4 h-4 text-muted" />
                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    className="bg-transparent text-sm text-foreground outline-none cursor-pointer"
                  >
                    <option value="all">{language === 'ar' ? 'كل طرق الدفع' : 'All Methods'}</option>
                    <option value="instapay">InstaPay</option>
                    <option value="wallet">{language === 'ar' ? 'المحافظ' : 'Wallets'}</option>
                    <option value="cash">{language === 'ar' ? 'الكاش' : 'Cash'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Date Filters Row */}
            <div className="flex flex-wrap items-center gap-4 bg-surface/20 border border-border/40 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 bg-surface border border-border rounded-xl px-3 py-1.5">
                <Calendar className="w-4 h-4 text-muted" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-transparent text-sm text-foreground outline-none cursor-pointer"
                >
                  <option value="all">{language === 'ar' ? 'كل الأوقات' : 'All Time'}</option>
                  <option value="today">{language === 'ar' ? 'اليوم' : 'Today'}</option>
                  <option value="7days">{language === 'ar' ? 'آخر 7 أيام' : 'Last 7 Days'}</option>
                  <option value="30days">{language === 'ar' ? 'آخر 30 يوم' : 'Last 30 Days'}</option>
                  <option value="custom">{language === 'ar' ? 'فترة مخصصة' : 'Custom Period'}</option>
                </select>
              </div>

              {dateFilter === "custom" && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted">{language === 'ar' ? 'من:' : 'From:'}</span>
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-surface border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted">{language === 'ar' ? 'إلى:' : 'To:'}</span>
                    <input 
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-surface border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ledger Table */}
          <div className="glass rounded-2xl overflow-hidden border border-border/50">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted">
                <p>{language === 'ar' ? 'لا توجد حركات مالية مطابقة للبحث' : 'No matching transactions found'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-right" dir={direction}>
                  <thead>
                    <tr className="border-b border-border bg-surface/50 text-xs font-semibold text-muted">
                      <th className="px-6 py-4">{language === 'ar' ? 'رقم الحجز' : 'Booking Ref'}</th>
                      <th className="px-6 py-4">{language === 'ar' ? 'اسم العميل' : 'Customer Name'}</th>
                      <th className="px-6 py-4">{language === 'ar' ? 'نوع العملية' : 'Type'}</th>
                      <th className="px-6 py-4">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                      <th className="px-6 py-4">{language === 'ar' ? 'طريقة المعاملة' : 'Method'}</th>
                      <th className="px-6 py-4">{language === 'ar' ? 'تاريخ التحصيل' : 'Collection Time'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-surface/35 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-primary">{tx.booking_ref}</td>
                        <td className="px-6 py-4 font-bold text-foreground">{tx.bookings?.customers?.full_name || "-"}</td>
                        <td className="px-6 py-4">
                          {tx.type === "collection" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                              <ArrowUpRight className="w-3 h-3" />
                              {language === 'ar' ? 'تحصيل' : 'Collection'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-600 border border-red-500/20">
                              <ArrowDownRight className="w-3 h-3" />
                              {language === 'ar' ? 'مرتجع / رد' : 'Refund'}
                            </span>
                          )}
                        </td>
                        <td className={`px-6 py-4 font-black ${tx.type === "collection" ? "text-green-500" : "text-red-500"}`}>
                          {tx.type === "collection" ? "+" : "-"} EGP {parseFloat(tx.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground">
                          {tx.method === "instapay" ? (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4 text-purple-500" />
                              InstaPay
                            </span>
                          ) : tx.method === "wallet" ? (
                            <span className="flex items-center gap-1">
                              <Wallet className="w-4 h-4 text-blue-500" />
                              {language === 'ar' ? 'محفظة' : 'Wallet'}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-4 h-4 text-yellow-500" />
                              {language === 'ar' ? 'كاش' : 'Cash'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-muted text-xs">
                          {new Date(tx.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Print-Only A4 Report Layout */}
      <div className="hidden print:block print-report p-8 space-y-6" dir={direction}>
        {/* Report Header */}
        <div className="flex justify-between items-center border-b-2 border-primary pb-4">
          <div>
            <h1 className="text-2xl font-black text-primary">
              {language === 'ar' ? 'تقرير التحصيلات والعمليات المالية' : 'Financial Collections & Payments Report'}
            </h1>
            <p className="text-xs text-muted mt-1">
              {language === 'ar' ? `تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}` : `Report Date: ${new Date().toLocaleDateString()}`}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-foreground">{language === 'ar' ? 'منظومة الملاعب الرياضية' : 'Sports Arena System'}</h2>
            <p className="text-xs text-muted">{language === 'ar' ? 'لوحة تحكم الإدارة' : 'Admin Panel'}</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 border border-border/80 rounded-xl p-4 bg-surface/5">
          <div className="text-center p-2 border-l border-border">
            <p className="text-xs text-muted mb-1">{language === 'ar' ? 'إجمالي التحصيلات' : 'Total Collected'}</p>
            <h3 className="text-lg font-black text-green-600">EGP {totalCollected.toLocaleString()}</h3>
          </div>
          <div className="text-center p-2 border-l border-border">
            <p className="text-xs text-muted mb-1">{language === 'ar' ? 'إجمالي المسترد' : 'Total Refunded'}</p>
            <h3 className="text-lg font-black text-red-600">EGP {totalRefunded.toLocaleString()}</h3>
          </div>
          <div className="text-center p-2">
            <p className="text-xs text-muted mb-1">{language === 'ar' ? 'صافي المقبوضات' : 'Net Flow'}</p>
            <h3 className="text-lg font-black text-primary">EGP {netIncome.toLocaleString()}</h3>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-right border-collapse mt-4 text-xs">
          <thead>
            <tr className="border-b-2 border-border bg-surface/10">
              <th className="py-2.5 px-3 font-bold">{language === 'ar' ? 'رقم الحجز' : 'Ref'}</th>
              <th className="py-2.5 px-3 font-bold">{language === 'ar' ? 'اسم العميل' : 'Customer'}</th>
              <th className="py-2.5 px-3 font-bold">{language === 'ar' ? 'نوع العملية' : 'Type'}</th>
              <th className="py-2.5 px-3 font-bold">{language === 'ar' ? 'طريقة الدفع' : 'Method'}</th>
              <th className="py-2.5 px-3 font-bold">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
              <th className="py-2.5 px-3 font-bold">{language === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredTransactions.map((tx) => (
              <tr key={tx.id} className="page-break-inside-avoid">
                <td className="py-2 px-3 font-mono font-bold">{tx.booking_ref}</td>
                <td className="py-2 px-3">{tx.bookings?.customers?.full_name || "-"}</td>
                <td className="py-2 px-3 font-medium">
                  {tx.type === "collection" 
                    ? (language === 'ar' ? 'تحصيل' : 'Collection') 
                    : (language === 'ar' ? 'مرتجع' : 'Refund')}
                </td>
                <td className="py-2 px-3 font-mono">
                  {tx.method === "instapay" ? 'InstaPay' : tx.method === "wallet" ? (language === 'ar' ? 'محفظة' : 'Wallet') : (language === 'ar' ? 'كاش' : 'Cash')}
                </td>
                <td className={`py-2 px-3 font-bold ${tx.type === "collection" ? "text-green-600" : "text-red-600"}`}>
                  {tx.type === "collection" ? "+" : "-"} EGP {parseFloat(tx.amount || 0).toLocaleString()}
                </td>
                <td className="py-2 px-3 text-[10px] text-muted font-mono">
                  {new Date(tx.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Global CSS Style tag to handle A4 Print media nicely */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          /* Hide the sidebar, navbar, filters, buttons, etc. */
          body > *:not(.print-report) {
            display: none !important;
          }
          .print-report {
            display: block !important;
            width: 100% !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 20px !important;
          }
          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
