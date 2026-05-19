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
  Check
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

  // Calculations
  const collections = transactions.filter(tx => tx.type === "collection");
  const refunds = transactions.filter(tx => tx.type === "refund");

  const totalCollected = collections.reduce((acc, tx) => acc + parseFloat(tx.amount || 0), 0);
  const totalRefunded = refunds.reduce((acc, tx) => acc + parseFloat(tx.amount || 0), 0);
  const netIncome = totalCollected - totalRefunded;

  // Method Breakdown
  const instapayTotal = transactions
    .filter(tx => tx.method === "instapay")
    .reduce((acc, tx) => acc + (tx.type === "collection" ? 1 : -1) * parseFloat(tx.amount || 0), 0);

  const walletTotal = transactions
    .filter(tx => tx.method === "wallet")
    .reduce((acc, tx) => acc + (tx.type === "collection" ? 1 : -1) * parseFloat(tx.amount || 0), 0);

  const cashTotal = transactions
    .filter(tx => tx.method === "cash")
    .reduce((acc, tx) => acc + (tx.type === "collection" ? 1 : -1) * parseFloat(tx.amount || 0), 0);

  // Filtered transactions
  const filteredTransactions = transactions.filter(tx => {
    const customerName = tx.bookings?.customers?.full_name || "";
    const matchesSearch = 
      tx.booking_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || tx.type === typeFilter;
    const matchesMethod = methodFilter === "all" || tx.method === methodFilter;
    return matchesSearch && matchesType && matchesMethod;
  });

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {language === 'ar' ? 'التحصيلات والمدفوعات المالية' : 'Financial Collections & Payments'}
          </h1>
          <p className="text-muted">
            {language === 'ar' ? 'مراقبة وإدارة كل المقبوضات والمرتجع المالي لحظة بلحظة.' : 'Monitor and manage all cash inflows and refund outflows in real-time.'}
          </p>
        </div>
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute top-1/2 -translate-y-1/2 ${direction === 'rtl' ? 'right-4' : 'left-4'} h-4 w-4 text-muted`} />
              <input
                type="text"
                placeholder={language === 'ar' ? 'البحث برقم الحجز...' : 'Search by Booking Code...'}
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
    </div>
  );
}
