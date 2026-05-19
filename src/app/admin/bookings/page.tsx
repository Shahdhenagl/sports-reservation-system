"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import { Loader2, CheckCircle2, XCircle, Clock, Eye, X, MessageCircle, Image as ImageIcon, DollarSign, Search, Filter, Printer, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function BookingsPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Collection Modal State
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [collectAmount, setCollectAmount] = useState("");
  const [collectMethod, setCollectMethod] = useState("instapay");

  // Refund Modal State
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundMethod, setRefundMethod] = useState("instapay");

  // Rejection & Refund Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectRefundAmount, setRejectRefundAmount] = useState("");
  const [rejectRefundMethod, setRejectRefundMethod] = useState("instapay");

  // Search & Date Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [periodType, setPeriodType] = useState<"daily" | "monthly" | "yearly">("daily");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const supabase = createClient();

  const fetchBookings = async (background = false) => {
    if (!background) setLoading(true);
    try {
      const { data, error } = await (supabase.from("bookings") as any)
        .select("*, customers(*)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setBookings(data || []);
    } catch (err: any) {
      console.error("Fetch error:", err);
    } finally {
      if (!background) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  useEffect(() => {
    // Listen for realtime updates in bookings table
    const channel = supabase
      .channel("bookings-realtime-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          fetchBookings(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    
    const amount = parseFloat(collectAmount);
    if (isNaN(amount) || amount <= 0) {
      alert(language === 'ar' ? "يرجى إدخال مبلغ صحيح" : "Please enter a valid amount");
      return;
    }

    const isPending = selectedBooking.status === 'pending';
    const currentPaid = selectedBooking.amount_paid || 0;
    const newPaid = isPending ? amount : (currentPaid + amount);
    
    let nextStatus = selectedBooking.status;
    if (newPaid >= (selectedBooking.total_price || 0)) {
      nextStatus = 'approved';
    } else if (newPaid > 0) {
      nextStatus = 'partially_paid';
    }

    try {
      // 1. Update Booking
      const { error: bookingErr } = await (supabase.from("bookings") as any)
        .update({
          status: nextStatus,
          amount_paid: newPaid,
          payment_method: collectMethod,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedBooking.id);

      if (bookingErr) throw bookingErr;

      // 2. Log Transaction
      const { error: txErr } = await (supabase.from("transactions") as any)
        .insert([{
          booking_id: selectedBooking.id,
          booking_ref: selectedBooking.booking_ref,
          type: 'collection',
          amount: amount,
          method: collectMethod
        }]);

      if (txErr) {
        console.error("Error creating transaction record:", txErr);
      }

      // 3. Update Customer's total_payments
      if (selectedBooking.customer_id) {
        const { data: customerData } = await (supabase.from("customers") as any)
          .select("total_payments")
          .eq("id", selectedBooking.customer_id)
          .single();
        
        const currentTotal = parseFloat(customerData?.total_payments || 0);
        await (supabase.from("customers") as any)
          .update({
            total_payments: currentTotal + amount,
            updated_at: new Date().toISOString()
          })
          .eq("id", selectedBooking.customer_id);
      }

      // Send WhatsApp approval message
      const customer = selectedBooking.customers;
      if (customer) {
        const whatsappNum = `${customer.whatsapp_code || '+20'}${customer.whatsapp}`.replace('+', '');
        const paymentMethodStr = collectMethod === 'instapay' ? 'InstaPay' : (collectMethod === 'wallet' ? 'محفظة إلكترونية' : 'كاش');
        const remainingAmount = Math.max(0, (selectedBooking.total_price || 0) - newPaid);
        const remainingStrAr = nextStatus === 'partially_paid' ? `\n💵 المبلغ المتبقي (عند الحضور): EGP ${remainingAmount}` : '';
        const remainingStrEn = nextStatus === 'partially_paid' ? `\n💵 Remaining Balance: EGP ${remainingAmount}` : '';
        
        const statusTitleAr = nextStatus === 'approved' ? 'تم تأكيد دفع حجزك بالكامل!' : 'تم قبول حجزك جزئياً واستلام الدفعة!';
        const statusTitleEn = nextStatus === 'approved' ? 'Booking Fully Paid & Approved!' : 'Booking Partially Paid (Deposit Confirmed)!';

        const message = language === 'ar' 
          ? `✅ *${statusTitleAr}*\n\n📋 رقم الحجز: ${selectedBooking.booking_ref}\n⚽ النشاط: ${selectedBooking.activity_name}\n📅 التاريخ: ${selectedBooking.booking_date}\n⏰ الوقت: ${selectedBooking.booking_time}\n💰 إجمالي المبلغ: EGP ${selectedBooking.total_price || 0}\n💳 تم استلام: EGP ${amount} (${paymentMethodStr})\n💵 إجمالي المدفوع: EGP ${newPaid}${remainingStrAr}\n\nنتمنى لك وقتاً ممتعاً! 🎉`
          : `✅ *${statusTitleEn}*\n\n📋 Ref: ${selectedBooking.booking_ref}\n⚽ Activity: ${selectedBooking.activity_name}\n📅 Date: ${selectedBooking.booking_date}\n⏰ Time: ${selectedBooking.booking_time}\n💰 Total Amount: EGP ${selectedBooking.total_price || 0}\n💳 Received: EGP ${amount} (${collectMethod})\n💵 Total Paid: EGP ${newPaid}${remainingStrEn}\n\nEnjoy your game! 🎉`;
        
        window.open(`https://wa.me/${whatsappNum}?text=${encodeURIComponent(message)}`, '_blank');
      }

      alert(language === 'ar' ? "تم تسجيل التحصيل بنجاح" : "Collection recorded successfully");
      setCollectionModalOpen(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0) {
      alert(language === 'ar' ? "يرجى إدخال مبلغ صحيح" : "Please enter a valid amount");
      return;
    }

    const currentPaid = selectedBooking.amount_paid || 0;
    if (amount > currentPaid) {
      alert(language === 'ar' ? `الحد الأقصى للرد هو المبلغ المدفوع: EGP ${currentPaid}` : `Max refund allowed is the amount paid: EGP ${currentPaid}`);
      return;
    }

    const newPaid = Math.max(0, currentPaid - amount);
    
    let nextStatus = selectedBooking.status;
    if (newPaid === 0) {
      nextStatus = 'pending';
    } else if (newPaid < (selectedBooking.total_price || 0)) {
      nextStatus = 'partially_paid';
    }

    try {
      // 1. Update Booking
      const { error: bookingErr } = await (supabase.from("bookings") as any)
        .update({
          status: nextStatus,
          amount_paid: newPaid,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedBooking.id);

      if (bookingErr) throw bookingErr;

      // 2. Log Transaction
      const { error: txErr } = await (supabase.from("transactions") as any)
        .insert([{
          booking_id: selectedBooking.id,
          booking_ref: selectedBooking.booking_ref,
          type: 'refund',
          amount: amount,
          method: refundMethod
        }]);

      if (txErr) {
        console.error("Error creating transaction record:", txErr);
      }

      // 3. Update Customer's total_payments
      if (selectedBooking.customer_id) {
        const { data: customerData } = await (supabase.from("customers") as any)
          .select("total_payments")
          .eq("id", selectedBooking.customer_id)
          .single();
        
        const currentTotal = parseFloat(customerData?.total_payments || 0);
        await (supabase.from("customers") as any)
          .update({
            total_payments: Math.max(0, currentTotal - amount),
            updated_at: new Date().toISOString()
          })
          .eq("id", selectedBooking.customer_id);
      }

      // Send WhatsApp refund message
      const customer = selectedBooking.customers;
      if (customer) {
        const whatsappNum = `${customer.whatsapp_code || '+20'}${customer.whatsapp}`.replace('+', '');
        const paymentMethodStr = refundMethod === 'instapay' ? 'InstaPay' : (refundMethod === 'wallet' ? 'محفظة إلكترونية' : 'كاش');
        
        const message = language === 'ar' 
          ? `💸 *تم إرجاع مبلغ لحجزك*\n\n📋 رقم الحجز: ${selectedBooking.booking_ref}\n⚽ النشاط: ${selectedBooking.activity_name}\n📅 التاريخ: ${selectedBooking.booking_date}\n💰 إجمالي سعر الحجز: EGP ${selectedBooking.total_price || 0}\n💵 المبلغ المسترد: EGP ${amount} (${paymentMethodStr})\n💳 المتبقي المدفوع بالحجز: EGP ${newPaid}\n\nتمت عملية الاسترداد بنجاح! 💸`
          : `💸 *Refund Issued for your Booking*\n\n📋 Ref: ${selectedBooking.booking_ref}\n⚽ Activity: ${selectedBooking.activity_name}\n📅 Date: ${selectedBooking.booking_date}\n💰 Total Amount: EGP ${selectedBooking.total_price || 0}\n💵 Refunded Amount: EGP ${amount} (${refundMethod})\n💳 Balance Left Paid: EGP ${newPaid}\n\nRefund processed successfully! 💸`;
        
        window.open(`https://wa.me/${whatsappNum}?text=${encodeURIComponent(message)}`, '_blank');
      }

      alert(language === 'ar' ? "تم تسجيل الاسترداد بنجاح" : "Refund recorded successfully");
      setRefundModalOpen(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    if (!rejectionReason.trim()) {
      alert(language === 'ar' ? 'يرجى كتابة سبب الرفض' : 'Please enter a rejection reason');
      return;
    }

    const refundAmt = parseFloat(rejectRefundAmount) || 0;
    if (refundAmt < 0) {
      alert(language === 'ar' ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount');
      return;
    }

    const currentPaid = selectedBooking.amount_paid || 0;
    if (refundAmt > currentPaid) {
      alert(language === 'ar' ? `الحد الأقصى للرد هو المبلغ المدفوع: EGP ${currentPaid}` : `Max refund allowed is the amount paid: EGP ${currentPaid}`);
      return;
    }

    const newPaid = Math.max(0, currentPaid - refundAmt);

    try {
      // 1. Update Booking
      const { error: rejectError } = await (supabase.from("bookings") as any)
        .update({ 
          status: "rejected", 
          rejection_reason: rejectionReason, 
          amount_paid: newPaid,
          updated_at: new Date().toISOString() 
        })
        .eq("id", selectedBooking.id);

      if (rejectError) throw rejectError;

      // 2. Log Transaction (only if refundAmt > 0)
      if (refundAmt > 0) {
        const { error: txErr } = await (supabase.from("transactions") as any)
          .insert([{
            booking_id: selectedBooking.id,
            booking_ref: selectedBooking.booking_ref,
            type: 'refund',
            amount: refundAmt,
            method: rejectRefundMethod
          }]);

        if (txErr) {
          console.error("Error creating transaction record:", txErr);
        }

        // 3. Update Customer's total_payments
        if (selectedBooking.customer_id) {
          const { data: customerData } = await (supabase.from("customers") as any)
            .select("total_payments")
            .eq("id", selectedBooking.customer_id)
            .single();
          
          const currentTotal = parseFloat(customerData?.total_payments || 0);
          await (supabase.from("customers") as any)
            .update({
              total_payments: Math.max(0, currentTotal - refundAmt),
              updated_at: new Date().toISOString()
            })
            .eq("id", selectedBooking.customer_id);
        }
      }

      // Open WhatsApp with rejection message
      const customer = selectedBooking.customers;
      if (customer) {
        const whatsappNum = `${customer.whatsapp_code || '+20'}${customer.whatsapp}`.replace('+', '');
        const refundMsgAr = refundAmt > 0 ? `\n💸 تم رد مبلغ: EGP ${refundAmt} (${rejectRefundMethod === 'instapay' ? 'InstaPay' : (rejectRefundMethod === 'wallet' ? 'محفظة' : 'كاش')})` : '\n💸 لم يتم دفع عربون / تم إرجاع 0 EGP';
        const refundMsgEn = refundAmt > 0 ? `\n💸 Refunded: EGP ${refundAmt} (${rejectRefundMethod})` : '\n💸 Refunded: EGP 0';
        
        const message = language === 'ar' 
          ? `❌ *تم رفض حجزك*\n\n📋 رقم الحجز: ${selectedBooking.booking_ref}\n⚽ النشاط: ${selectedBooking.activity_name}\n📅 التاريخ: ${selectedBooking.booking_date}\n⏰ الوقت: ${selectedBooking.booking_time}\n💰 إجمالي المبلغ: EGP ${selectedBooking.total_price || 0}${refundMsgAr}\n📝 السبب: ${rejectionReason}\n\nيمكنك المحاولة مرة أخرى أو التواصل معنا.`
          : `❌ *Booking Rejected*\n\n📋 Ref: ${selectedBooking.booking_ref}\n⚽ Activity: ${selectedBooking.activity_name}\n📅 Date: ${selectedBooking.booking_date}\n⏰ Time: ${selectedBooking.booking_time}\n💰 Total Amount: EGP ${selectedBooking.total_price || 0}${refundMsgEn}\n📝 Reason: ${rejectionReason}\n\nPlease try again or contact us.`;
        window.open(`https://wa.me/${whatsappNum}?text=${encodeURIComponent(message)}`, '_blank');
      }

      alert(language === 'ar' ? "تم رفض الحجز وتسجيل العملية بنجاح" : "Booking rejected and processed successfully");
      setRejectModalOpen(false);
      setRejectionReason("");
      setSelectedBooking(null);
      fetchBookings();
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  // Removed legacy direct collection helpers in favor of the new unified Collection/Refund Sub-Modal workflow

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
            <Clock className="w-3 h-3" />
            {language === 'ar' ? 'في الانتظار' : 'Pending'}
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <Clock className="w-3 h-3" />
            {language === 'ar' ? 'مقبول جزئياً' : 'Partially Paid'}
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
            <CheckCircle2 className="w-3 h-3" />
            {language === 'ar' ? 'مقبول' : 'Approved'}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-600 border border-red-500/20">
            <XCircle className="w-3 h-3" />
            {language === 'ar' ? 'مرفوض' : 'Rejected'}
          </span>
        );
      default:
        return null;
    }
  };

  // Date Filtering Helper
  const filterByDate = (dateStr: string) => {
    if (!dateStr) return false;
    const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const [txYear, txMonth, txDay] = datePart.split("-").map(Number);
    const [selYear, selMonth, selDay] = selectedDate.split("-").map(Number);

    if (periodType === "daily") {
      return txYear === selYear && txMonth === selMonth && txDay === selDay;
    } else if (periodType === "monthly") {
      return txYear === selYear && txMonth === selMonth;
    } else if (periodType === "yearly") {
      return txYear === selYear;
    }
    return true;
  };

  const filteredBookings = bookings.filter((booking) => {
    // 1. Status Filter
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    if (!matchesStatus) return false;

    // 2. Search Term Filter
    const customerName = booking.customers?.full_name || "";
    const matchesSearch = 
      booking.booking_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // 3. Date Filter
    if (!filterByDate(booking.booking_date)) return false;

    return true;
  });

  return (
    <div className="space-y-6" dir={direction}>
      <div className="space-y-6 print:hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{t.bookings}</h1>
            <p className="text-muted">{t.bookingsSubtitle}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex gap-2">
              {[
                { value: 'all', label: language === 'ar' ? 'الكل' : 'All' },
                { value: 'pending', label: language === 'ar' ? 'في الانتظار' : 'Pending' },
                { value: 'partially_paid', label: language === 'ar' ? 'مقبول جزئياً' : 'Partially Paid' },
                { value: 'approved', label: language === 'ar' ? 'مقبول' : 'Approved' },
                { value: 'rejected', label: language === 'ar' ? 'مرفوض' : 'Rejected' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                    statusFilter === filter.value 
                      ? 'bg-primary text-white shadow-md' 
                      : 'bg-surface text-muted hover:bg-surface-hover'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20 text-sm"
            >
              <Printer className="w-4 h-4" />
              {language === 'ar' ? 'تصدير PDF' : 'Export PDF'}
            </button>
          </div>
        </div>

        {/* Premium Segmented Date Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-surface border border-border/60 p-4 rounded-2xl shadow-sm justify-between">
          {/* Custom Date Input Display */}
          <div className="relative flex items-center bg-background border border-border shadow-inner rounded-xl px-4 py-2.5 hover:bg-surface-hover transition-all cursor-pointer group">
            <span className="font-bold text-foreground text-sm font-mono tracking-wide">
              {selectedDate.split("-").reverse().join("/")}
            </span>
            <Calendar className="w-5 h-5 text-red-600 ml-3" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>

          {/* Period Selection Pill Control */}
          <div className="flex bg-surface-hover border border-border/80 rounded-xl p-1 items-center gap-1">
            <button
              onClick={() => setPeriodType("yearly")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                periodType === "yearly" ? "bg-white text-red-600 shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              {language === 'ar' ? 'سنوي' : 'Yearly'}
            </button>
            <button
              onClick={() => setPeriodType("monthly")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                periodType === "monthly" ? "bg-white text-red-600 shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              {language === 'ar' ? 'شهري' : 'Monthly'}
            </button>
            <button
              onClick={() => setPeriodType("daily")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                periodType === "daily" ? "bg-white text-red-600 shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              {language === 'ar' ? 'يومي' : 'Daily'}
            </button>
          </div>
        </div>

      {/* Searching and Date filter row */}
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
        </div>


      </div>

      {/* Realtime updates are applied dynamically */}

      <div className="glass rounded-2xl overflow-hidden border border-border/50">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p>{language === 'ar' ? 'لا توجد حجوزات مطابقة للبحث' : 'No matching bookings found'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="px-4 py-3 text-start font-medium text-muted">{language === 'ar' ? 'رقم الحجز' : 'Ref'}</th>
                  <th className="px-4 py-3 text-start font-medium text-muted">{language === 'ar' ? 'العميل' : 'Customer'}</th>
                  <th className="px-4 py-3 text-start font-medium text-muted">{language === 'ar' ? 'النشاط' : 'Activity'}</th>
                  <th className="px-4 py-3 text-start font-medium text-muted">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th className="px-4 py-3 text-start font-medium text-muted">{language === 'ar' ? 'الوقت' : 'Time'}</th>
                  <th className="px-4 py-3 text-start font-medium text-muted">{language === 'ar' ? 'المبلغ' : 'Total'}</th>
                  <th className="px-4 py-3 text-start font-medium text-muted">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="px-4 py-3 text-start font-medium text-muted">{language === 'ar' ? 'إجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings
                  .map((booking) => (
                    <tr key={booking.id} className="border-b border-border/30 hover:bg-surface/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-primary">{booking.booking_ref}</td>
                      <td className="px-4 py-3 text-foreground">{booking.customers?.full_name || '-'}</td>
                      <td className="px-4 py-3 text-foreground">{booking.activity_name || '-'}</td>
                      <td className="px-4 py-3 text-foreground">{booking.booking_date}</td>
                      <td className="px-4 py-3 text-foreground">{booking.booking_time}</td>
                      <td className="px-4 py-3 text-foreground font-medium">EGP {booking.total_price || 0}</td>
                      <td className="px-4 py-3">{getStatusBadge(booking.status)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setSelectedBooking(booking); setRejectionReason(""); }}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title={language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" dir={direction}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-xl font-bold text-foreground">
                {language === 'ar' ? 'تفاصيل الحجز' : 'Booking Details'}
              </h3>
              <button onClick={() => setSelectedBooking(null)} className="p-2 text-muted hover:text-foreground hover:bg-surface-hover rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-primary text-lg">{selectedBooking.booking_ref}</span>
                {getStatusBadge(selectedBooking.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted">{language === 'ar' ? 'العميل' : 'Customer'}</p>
                  <p className="text-foreground font-medium">{selectedBooking.customers?.full_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted">{language === 'ar' ? 'الهاتف' : 'Phone'}</p>
                  <p className="text-foreground font-medium">{selectedBooking.customers?.phone_code}{selectedBooking.customers?.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted">{language === 'ar' ? 'واتساب' : 'WhatsApp'}</p>
                  <p className="text-foreground font-medium">{selectedBooking.customers?.whatsapp_code}{selectedBooking.customers?.whatsapp}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted">{language === 'ar' ? 'النشاط' : 'Activity'}</p>
                  <p className="text-foreground font-medium">{selectedBooking.activity_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted">{language === 'ar' ? 'التاريخ' : 'Date'}</p>
                  <p className="text-foreground font-medium">{selectedBooking.booking_date}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted">{language === 'ar' ? 'الوقت' : 'Time'}</p>
                  <p className="text-foreground font-medium">{selectedBooking.booking_time}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted">{language === 'ar' ? 'المدة' : 'Duration'}</p>
                  <p className="text-foreground font-medium">{selectedBooking.duration} {language === 'ar' ? 'دقيقة' : 'mins'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted">{language === 'ar' ? 'عدد اللاعبين' : 'Players'}</p>
                  <p className="text-foreground font-medium">{selectedBooking.players_count}</p>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-primary/10">
                  <span className="text-sm font-semibold text-foreground/80">{language === 'ar' ? 'إجمالي سعر الحجز' : 'Total Price'}</span>
                  <span className="text-lg font-bold text-primary">EGP {selectedBooking.total_price || 0}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">{language === 'ar' ? 'المبلغ المدفوع' : 'Amount Paid'}</span>
                  <span className="font-semibold text-foreground">
                    EGP {selectedBooking.amount_paid || 0} 
                    <span className="text-[10px] text-muted ml-1">
                      ({selectedBooking.payment_type === 'full' ? (language === 'ar' ? 'كامل' : 'Full') : (language === 'ar' ? 'عربون' : 'Deposit')})
                    </span>
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</span>
                  <span className="font-semibold text-foreground">
                    {selectedBooking.payment_method === 'instapay' ? 'InstaPay' : (language === 'ar' ? 'محفظة إلكترونية' : 'E-Wallet')}
                  </span>
                </div>

                {selectedBooking.payment_type === 'partial' && (
                  <div className="flex justify-between items-center text-xs text-red-500 font-semibold pt-2 border-t border-primary/10">
                    <span>{language === 'ar' ? 'المبلغ المتبقي للتحصيل' : 'Remaining Balance'}</span>
                    <span>EGP {(selectedBooking.total_price || 0) - (selectedBooking.amount_paid || 0)}</span>
                  </div>
                )}
              </div>

              {selectedBooking.special_requests && (
                <div className="space-y-1">
                  <p className="text-sm text-muted">{language === 'ar' ? 'طلبات خاصة' : 'Special Requests'}</p>
                  <p className="text-foreground bg-surface/50 rounded-lg p-3 text-sm">{selectedBooking.special_requests}</p>
                </div>
              )}

              {/* Payment Screenshot */}
              {selectedBooking.payment_screenshot && (
                <div className="space-y-2">
                  <p className="text-sm text-muted flex items-center gap-1">
                    <ImageIcon className="w-4 h-4" />
                    {language === 'ar' ? 'صورة التحويل' : 'Payment Screenshot'}
                  </p>
                  <a href={selectedBooking.payment_screenshot} target="_blank" rel="noopener noreferrer">
                    <img 
                      src={selectedBooking.payment_screenshot} 
                      alt="Payment" 
                      className="w-full max-h-64 object-contain rounded-xl border border-border cursor-pointer hover:opacity-80 transition-opacity" 
                    />
                  </a>
                </div>
              )}

              {selectedBooking.rejection_reason && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                  <p className="text-sm text-red-600 font-medium">{language === 'ar' ? 'سبب الرفض:' : 'Rejection Reason:'}</p>
                  <p className="text-sm text-foreground mt-1">{selectedBooking.rejection_reason}</p>
                </div>
              )}

              {/* Actions - only for pending bookings */}
              {selectedBooking.status === 'pending' && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setCollectAmount((selectedBooking.amount_paid || 0).toString());
                        setCollectMethod(selectedBooking.payment_method || "instapay");
                        setCollectionModalOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      {language === 'ar' ? 'قبول الحجز وتأكيد الدفعة' : 'Approve & Confirm Payment'}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <button
                      onClick={() => {
                        setRejectRefundAmount((selectedBooking.amount_paid || 0).toString());
                        setRejectRefundMethod("instapay");
                        setRejectionReason("");
                        setRejectModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                    >
                      <XCircle className="w-5 h-5" />
                      {language === 'ar' ? 'رفض الحجز وإجراء رد المبلغ' : 'Reject & Process Refund'}
                    </button>
                  </div>
                </div>
              )}

              {/* Actions - for approved or partially paid bookings */}
              {(selectedBooking.status === 'approved' || selectedBooking.status === 'partially_paid') && (
                <div className="pt-4 border-t border-border space-y-3">
                  {selectedBooking.status === 'partially_paid' && (
                    <button
                      onClick={() => {
                        setCollectAmount(((selectedBooking.total_price || 0) - (selectedBooking.amount_paid || 0)).toString());
                        setCollectMethod(selectedBooking.payment_method || "instapay");
                        setCollectionModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                    >
                      <DollarSign className="w-5 h-5" />
                      {language === 'ar' ? 'تأكيد تحصيل مبلغ إضافي' : 'Confirm Additional Collection'}
                    </button>
                  )}

                  {selectedBooking.amount_paid > 0 && (
                    <button
                      onClick={() => {
                        setRefundAmount((selectedBooking.amount_paid || 0).toString());
                        setRefundMethod("instapay");
                        setRefundModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/10 text-red-600 border border-red-600/20 rounded-xl font-medium hover:bg-red-600/20 hover:text-red-700 transition-colors"
                    >
                      <DollarSign className="w-5 h-5" />
                      {language === 'ar' ? 'إجراء رد مبلغ (استرداد)' : 'Issue Refund'}
                    </button>
                  )}
                </div>
              )}

              {/* WhatsApp contact for approved/rejected */}
              {selectedBooking.status !== 'pending' && selectedBooking.customers?.whatsapp && (
                <button
                  onClick={() => {
                    const whatsappNum = `${selectedBooking.customers.whatsapp_code || '+20'}${selectedBooking.customers.whatsapp}`.replace('+', '');
                    window.open(`https://wa.me/${whatsappNum}`, '_blank');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  {language === 'ar' ? 'تواصل عبر واتساب' : 'Contact on WhatsApp'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Collection Sub-Modal */}
      {collectionModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 space-y-4" dir={direction}>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h4 className="text-lg font-bold text-foreground">
                {language === 'ar' ? 'تأكيد تحصيل مبلغ' : 'Confirm Collection'}
              </h4>
              <button onClick={() => setCollectionModalOpen(false)} className="p-1.5 text-muted hover:text-foreground hover:bg-surface-hover rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCollectionSubmit} className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted">{language === 'ar' ? 'رقم الحجز' : 'Booking Ref'}</p>
                <p className="text-sm font-bold text-foreground font-mono">{selectedBooking.booking_ref}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{language === 'ar' ? 'المبلغ المستلم (EGP)' : 'Amount Received (EGP)'}</label>
                <input 
                  type="number" 
                  step="0.01"
                  required 
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  className={`w-full bg-surface/50 border border-border rounded-xl py-2.5 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
                />
                <p className="text-[10px] text-muted">
                  {language === 'ar' ? `إجمالي المطلوب: EGP ${selectedBooking.total_price || 0} | المدفوع مسبقاً: EGP ${selectedBooking.amount_paid || 0}` : `Total Due: EGP ${selectedBooking.total_price || 0} | Paid So Far: EGP ${selectedBooking.amount_paid || 0}`}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{language === 'ar' ? 'طريقة التحصيل' : 'Collection Method'}</label>
                <select 
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="instapay">InstaPay</option>
                  <option value="wallet">{language === 'ar' ? 'محفظة إلكترونية' : 'E-Wallet'}</option>
                  <option value="cash">{language === 'ar' ? 'كاش (نقدي)' : 'Cash'}</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3 border-t border-border">
                <button 
                  type="button" 
                  onClick={() => setCollectionModalOpen(false)} 
                  className="flex-1 py-2.5 rounded-xl border border-border text-muted hover:bg-surface-hover transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                >
                  {language === 'ar' ? 'تأكيد الاستلام' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Sub-Modal */}
      {refundModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 space-y-4" dir={direction}>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h4 className="text-lg font-bold text-foreground">
                {language === 'ar' ? 'إجراء رد مبلغ للعميل' : 'Issue Refund to Customer'}
              </h4>
              <button onClick={() => setRefundModalOpen(false)} className="p-1.5 text-muted hover:text-foreground hover:bg-surface-hover rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRefundSubmit} className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted">{language === 'ar' ? 'رقم الحجز' : 'Booking Ref'}</p>
                <p className="text-sm font-bold text-foreground font-mono">{selectedBooking.booking_ref}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{language === 'ar' ? 'المبلغ المراد رده (EGP)' : 'Amount to Refund (EGP)'}</label>
                <input 
                  type="number" 
                  step="0.01"
                  required 
                  max={selectedBooking.amount_paid}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className={`w-full bg-surface/50 border border-border rounded-xl py-2.5 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
                />
                <p className="text-[10px] text-muted">
                  {language === 'ar' ? `المبلغ المدفوع حالياً: EGP ${selectedBooking.amount_paid || 0}` : `Amount Paid Currently: EGP ${selectedBooking.amount_paid || 0}`}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{language === 'ar' ? 'طريقة الرد' : 'Refund Method'}</label>
                <select 
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="instapay">InstaPay</option>
                  <option value="wallet">{language === 'ar' ? 'محفظة إلكترونية' : 'E-Wallet'}</option>
                  <option value="cash">{language === 'ar' ? 'كاش (نقدي)' : 'Cash'}</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3 border-t border-border">
                <button 
                  type="button" 
                  onClick={() => setRefundModalOpen(false)} 
                  className="flex-1 py-2.5 rounded-xl border border-border text-muted hover:bg-surface-hover transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                >
                  {language === 'ar' ? 'تأكيد الرد' : 'Confirm Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Rejection Sub-Modal */}
      {rejectModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 space-y-4" dir={direction}>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h4 className="text-lg font-bold text-foreground">
                {language === 'ar' ? 'رفض الحجز وإرجاع المبلغ' : 'Reject Booking & Process Refund'}
              </h4>
              <button onClick={() => setRejectModalOpen(false)} className="p-1.5 text-muted hover:text-foreground hover:bg-surface-hover rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted">{language === 'ar' ? 'رقم الحجز' : 'Booking Ref'}</p>
                <p className="text-sm font-bold text-foreground font-mono">{selectedBooking.booking_ref}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{language === 'ar' ? 'سبب الرفض' : 'Rejection Reason'}</label>
                <textarea
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={language === 'ar' ? 'اكتب سبب الرفض هنا ليتم إرساله للعميل...' : 'Write rejection reason...'}
                  className={`w-full bg-surface/50 border border-border rounded-xl py-2.5 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none min-h-[80px] text-sm ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{language === 'ar' ? 'المبلغ المسترد (يمكن أن يكون 0)' : 'Refund Amount (Can be 0)'}</label>
                <input 
                  type="number" 
                  step="0.01"
                  required 
                  min="0"
                  max={selectedBooking.amount_paid}
                  value={rejectRefundAmount}
                  onChange={(e) => setRejectRefundAmount(e.target.value)}
                  className={`w-full bg-surface/50 border border-border rounded-xl py-2.5 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
                />
                <p className="text-[10px] text-muted">
                  {language === 'ar' ? `المبلغ الذي أرسله العميل: EGP ${selectedBooking.amount_paid || 0}` : `Amount sent by customer: EGP ${selectedBooking.amount_paid || 0}`}
                </p>
              </div>

              {parseFloat(rejectRefundAmount) > 0 && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{language === 'ar' ? 'طريقة الرد' : 'Refund Method'}</label>
                  <select 
                    value={rejectRefundMethod}
                    onChange={(e) => setRejectRefundMethod(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="instapay">InstaPay</option>
                    <option value="wallet">{language === 'ar' ? 'محفظة إلكترونية' : 'E-Wallet'}</option>
                    <option value="cash">{language === 'ar' ? 'كاش (نقدي)' : 'Cash'}</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-border">
                <button 
                  type="button" 
                  onClick={() => setRejectModalOpen(false)} 
                  className="flex-1 py-2.5 rounded-xl border border-border text-muted hover:bg-surface-hover transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                >
                  {language === 'ar' ? 'تأكيد الرفض والرد' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* Print-Only A4 Bookings Report Layout */}
      <div className="hidden print:block print-report p-8 space-y-6" dir={direction}>
        {/* Report Header */}
        <div className="flex justify-between items-center border-b-2 border-primary pb-4">
          <div>
            <h1 className="text-2xl font-black text-primary">
              {language === 'ar' ? 'تقرير حجوزات الملاعب والأنشطة' : 'Sports Bookings & Reservations Report'}
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

        {/* Summary Grid */}
        <div className="grid grid-cols-4 gap-4 border border-border/80 rounded-xl p-4 bg-surface/5 text-center text-xs">
          <div className="border-l border-border">
            <p className="text-muted mb-1">{language === 'ar' ? 'إجمالي الحجوزات المفلترة' : 'Total Filtered Bookings'}</p>
            <h3 className="text-lg font-black text-foreground">{filteredBookings.length}</h3>
          </div>
          <div className="border-l border-border">
            <p className="text-muted mb-1">{language === 'ar' ? 'المقبولة' : 'Approved'}</p>
            <h3 className="text-lg font-black text-green-600">
              {filteredBookings.filter(b => b.status === 'approved').length}
            </h3>
          </div>
          <div className="border-l border-border">
            <p className="text-muted mb-1">{language === 'ar' ? 'مقبولة جزئياً' : 'Partially Paid'}</p>
            <h3 className="text-lg font-black text-blue-600">
              {filteredBookings.filter(b => b.status === 'partially_paid').length}
            </h3>
          </div>
          <div>
            <p className="text-muted mb-1">{language === 'ar' ? 'في الانتظار' : 'Pending'}</p>
            <h3 className="text-lg font-black text-yellow-600">
              {filteredBookings.filter(b => b.status === 'pending').length}
            </h3>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-right border-collapse mt-4 text-xs">
          <thead>
            <tr className="border-b-2 border-border bg-surface/10">
              <th className="py-2.5 px-3 font-bold">{language === 'ar' ? 'رقم الحجز' : 'Ref'}</th>
              <th className="py-2.5 px-3 font-bold">{language === 'ar' ? 'العميل' : 'Customer'}</th>
              <th className="py-2.5 px-3 font-bold">{language === 'ar' ? 'النشاط' : 'Activity'}</th>
              <th className="py-2.5 px-3 font-bold">{language === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}</th>
              <th className="py-2.5 px-3 font-bold">{language === 'ar' ? 'المبلغ الكلي' : 'Total'}</th>
              <th className="py-2.5 px-3 font-bold">{language === 'ar' ? 'المدفوع' : 'Paid'}</th>
              <th className="py-2.5 px-3 font-bold">{language === 'ar' ? 'الحالة' : 'Status'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredBookings.map((booking) => (
              <tr key={booking.id} className="page-break-inside-avoid">
                <td className="py-2 px-3 font-mono font-bold">{booking.booking_ref}</td>
                <td className="py-2 px-3">{booking.customers?.full_name || "-"}</td>
                <td className="py-2 px-3">{booking.activity_name || "-"}</td>
                <td className="py-2 px-3 font-mono">
                  {booking.booking_date} | {booking.booking_time}
                </td>
                <td className="py-2 px-3 font-bold">EGP {booking.total_price || 0}</td>
                <td className="py-2 px-3 font-bold text-green-600">EGP {booking.amount_paid || 0}</td>
                <td className="py-2 px-3">
                  {booking.status === 'pending' ? (language === 'ar' ? 'في الانتظار' : 'Pending') :
                   booking.status === 'partially_paid' ? (language === 'ar' ? 'مقبول جزئياً' : 'Partially Paid') :
                   booking.status === 'approved' ? (language === 'ar' ? 'مقبول' : 'Approved') :
                   (language === 'ar' ? 'مرفوض' : 'Rejected')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Global CSS Style tag to handle A4 Print media nicely */}
      <style>{`
        @media print {
          html, body {
            background: white !important;
            color: black !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Hide all Next.js screen-only layout wrappers & decorations */
          aside,
          nav,
          header,
          button,
          .print\:hidden {
            display: none !important;
          }

          /* Force sidebar container in layout to hide */
          div[class*="w-64"] {
            display: none !important;
          }

          /* Reset absolute/flex/overflow layout limitations of Next.js */
          div, main, section {
            height: auto !important;
            overflow: visible !important;
            position: relative !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
          }

          /* Force the print report to show beautifully */
          .print-report {
            display: block !important;
            width: 100% !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            padding: 20px !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            z-index: 9999999 !important;
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
