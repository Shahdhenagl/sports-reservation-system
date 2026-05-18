"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import { Loader2, CheckCircle2, XCircle, Clock, Eye, X, MessageCircle, Image as ImageIcon, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function BookingsPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [debugInfo, setDebugInfo] = useState<string>("");
  const supabase = createClient();

  const fetchBookings = async () => {
    setLoading(true);
    setDebugInfo("جاري فحص البيانات...");
    try {
      // 1. Check Auth Status
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setDebugInfo("خطأ: أنت غير مسجل دخول في قاعدة البيانات.");
      } else {
        setDebugInfo(`تم تسجيل الدخول بنجاح: ${user.email}`);
      }

      // 2. Simple fetch bookings only (No join)
      const { data, error, count } = await (supabase.from("bookings") as any)
        .select("*", { count: 'exact' });
      
      if (error) {
        setDebugInfo(prev => `${prev} | خطأ في جلب الحجوزات: ${error.message}`);
        throw error;
      }

      setDebugInfo(prev => `${prev} | عدد الحجوزات في السيرفر: ${count}`);
      
      // 3. If bookings found, try to fetch with customers
      const { data: fullData } = await (supabase.from("bookings") as any)
        .select("*, customers(*)");
      
      setBookings(fullData || data || []);
    } catch (err: any) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleApprove = async (booking: any) => {
    const nextStatus = booking.payment_type === 'partial' ? 'partially_paid' : 'approved';
    const { error: approveError } = await (supabase.from("bookings") as any)
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", booking.id);

    if (approveError) {
      alert(language === 'ar' ? `حدث خطأ أثناء قبول الحجز: ${approveError.message}` : `Error approving booking: ${approveError.message}`);
      return;
    }

    // Update customer total_payments
    if (booking.customer_id) {
      const { data: customerData } = await (supabase.from("customers") as any)
        .select("total_payments")
        .eq("id", booking.customer_id)
        .single();
      
      const currentTotal = customerData?.total_payments || 0;
      const { error: customerError } = await (supabase.from("customers") as any)
        .update({ total_payments: currentTotal + (booking.total_price || 0), updated_at: new Date().toISOString() })
        .eq("id", booking.customer_id);

      if (customerError) {
        console.error("Error updating customer total payments:", customerError);
      }
    }

    // Open WhatsApp with approval message
    const customer = booking.customers;
    if (customer) {
      const whatsappNum = `${customer.whatsapp_code || '+20'}${customer.whatsapp}`.replace('+', '');
      const paymentTypeStr = booking.payment_type === 'full' ? 'كامل المبلغ' : 'عربون / دفعة جزئية';
      const paymentMethodStr = booking.payment_method === 'instapay' ? 'InstaPay' : 'محفظة إلكترونية';

      const remainingAmount = (booking.total_price || 0) - (booking.amount_paid || 0);
      const remainingStrAr = booking.payment_type === 'partial' ? `\n💵 المبلغ المتبقي (عند الحضور): EGP ${remainingAmount}` : '';
      const remainingStrEn = booking.payment_type === 'partial' ? `\n💵 Remaining Balance (at venue): EGP ${remainingAmount}` : '';

      const statusTitleAr = booking.payment_type === 'partial' ? 'تم قبول حجزك جزئياً (عربون)!' : 'تم قبول حجزك بالكامل!';
      const statusTitleEn = booking.payment_type === 'partial' ? 'Booking Partially Approved (Deposit)!' : 'Booking Fully Approved!';

      const message = language === 'ar' 
        ? `✅ *${statusTitleAr}*\n\n📋 رقم الحجز: ${booking.booking_ref}\n⚽ النشاط: ${booking.activity_name}\n📅 التاريخ: ${booking.booking_date}\n⏰ الوقت: ${booking.booking_time}\n💰 إجمالي المبلغ: EGP ${booking.total_price || 0}\n💳 المبلغ المدفوع: EGP ${booking.amount_paid || 0} (${paymentTypeStr})${remainingStrAr}\n📱 طريقة الدفع: ${paymentMethodStr}\n\nنتمنى لك وقتاً ممتعاً! 🎉`
        : `✅ *${statusTitleEn}*\n\n📋 Ref: ${booking.booking_ref}\n⚽ Activity: ${booking.activity_name}\n📅 Date: ${booking.booking_date}\n⏰ Time: ${booking.booking_time}\n💰 Total Amount: EGP ${booking.total_price || 0}\n💳 Amount Paid: EGP ${booking.amount_paid || 0} (${booking.payment_type === 'full' ? 'Full' : 'Deposit'})${remainingStrEn}\n📱 Payment Method: ${booking.payment_method === 'instapay' ? 'InstaPay' : 'Wallet'}\n\nEnjoy your game! 🎉`;
      window.open(`https://wa.me/${whatsappNum}?text=${encodeURIComponent(message)}`, '_blank');
    }

    setSelectedBooking(null);
    fetchBookings();
  };

  const handleReject = async (booking: any) => {
    if (!rejectionReason.trim()) {
      alert(language === 'ar' ? 'يرجى كتابة سبب الرفض' : 'Please enter a rejection reason');
      return;
    }

    const { error: rejectError } = await (supabase.from("bookings") as any)
      .update({ status: "rejected", rejection_reason: rejectionReason, updated_at: new Date().toISOString() })
      .eq("id", booking.id);

    if (rejectError) {
      alert(language === 'ar' ? `حدث خطأ أثناء رفض الحجز: ${rejectError.message}` : `Error rejecting booking: ${rejectError.message}`);
      return;
    }

    // Open WhatsApp with rejection message
    const customer = booking.customers;
    if (customer) {
      const whatsappNum = `${customer.whatsapp_code || '+20'}${customer.whatsapp}`.replace('+', '');
      const message = language === 'ar' 
        ? `❌ *تم رفض حجزك*\n\n📋 رقم الحجز: ${booking.booking_ref}\n⚽ النشاط: ${booking.activity_name}\n📅 التاريخ: ${booking.booking_date}\n⏰ الوقت: ${booking.booking_time}\n💰 إجمالي المبلغ: EGP ${booking.total_price || 0}\n💳 المبلغ المدفوع (المسترد): EGP ${booking.amount_paid || 0}\n📝 السبب: ${rejectionReason}\n\nيمكنك المحاولة مرة أخرى أو التواصل معنا.`
        : `❌ *Booking Rejected*\n\n📋 Ref: ${booking.booking_ref}\n⚽ Activity: ${booking.activity_name}\n📅 Date: ${booking.booking_date}\n⏰ Time: ${booking.booking_time}\n💰 Total Amount: EGP ${booking.total_price || 0}\n💳 Amount Paid (Refunded): EGP ${booking.amount_paid || 0}\n📝 Reason: ${rejectionReason}\n\nPlease try again or contact us.`;
      window.open(`https://wa.me/${whatsappNum}?text=${encodeURIComponent(message)}`, '_blank');
    }

    setRejectionReason("");
    setSelectedBooking(null);
    fetchBookings();
  };

  const handleCollectRemaining = async (booking: any) => {
    const { error: updateError } = await (supabase.from("bookings") as any)
      .update({ 
        status: "approved", 
        amount_paid: booking.total_price || 0,
        updated_at: new Date().toISOString() 
      })
      .eq("id", booking.id);

    if (updateError) {
      alert(language === 'ar' ? `حدث خطأ أثناء تحصيل باقي المبلغ: ${updateError.message}` : `Error collecting remaining amount: ${updateError.message}`);
      return;
    }

    // Open WhatsApp with final confirmation message
    const customer = booking.customers;
    if (customer) {
      const whatsappNum = `${customer.whatsapp_code || '+20'}${customer.whatsapp}`.replace('+', '');
      const message = language === 'ar' 
        ? `✅ *تم دفع حجزك بالكامل!*\n\n📋 رقم الحجز: ${booking.booking_ref}\n⚽ النشاط: ${booking.activity_name}\n📅 التاريخ: ${booking.booking_date}\n⏰ الوقت: ${booking.booking_time}\n💰 إجمالي المبلغ: EGP ${booking.total_price || 0}\n💳 الحالة: تم سداد باقي المبلغ بنجاح ودفع الحجز بالكامل! 🎉\n\nنتمنى لك وقتاً ممتعاً! 🎉`
        : `✅ *Booking Fully Paid!*\n\n📋 Ref: ${booking.booking_ref}\n⚽ Activity: ${booking.activity_name}\n📅 Date: ${booking.booking_date}\n⏰ Time: ${booking.booking_time}\n💰 Total Amount: EGP ${booking.total_price || 0}\n💳 Status: Remaining balance paid successfully, booking is fully paid! 🎉\n\nEnjoy your game! 🎉`;
      window.open(`https://wa.me/${whatsappNum}?text=${encodeURIComponent(message)}`, '_blank');
    }

    setSelectedBooking(null);
    fetchBookings();
  };

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

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t.bookings}</h1>
          <p className="text-muted">{t.bookingsSubtitle}</p>
        </div>
        
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
      </div>

      {/* Debug Section */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <p className="text-xs font-mono text-yellow-500">DEBUG: {debugInfo}</p>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-border/50">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p>{language === 'ar' ? 'لا توجد حجوزات' : 'No bookings found'}</p>
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
                {bookings
                  .filter((booking) => statusFilter === 'all' || booking.status === statusFilter)
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
                      onClick={() => handleApprove(selectedBooking)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      {language === 'ar' ? 'قبول الحجز' : 'Approve'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder={language === 'ar' ? 'سبب الرفض...' : 'Rejection reason...'}
                      className="w-full bg-surface/50 border border-border rounded-xl py-3 px-4 text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[80px] text-sm"
                    />
                    <button
                      onClick={() => handleReject(selectedBooking)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                      {language === 'ar' ? 'رفض الحجز' : 'Reject'}
                    </button>
                  </div>
                </div>
              )}

              {/* Actions - for partially paid bookings to collect remaining balance */}
              {selectedBooking.status === 'partially_paid' && (
                <div className="pt-4 border-t border-border">
                  <button
                    onClick={() => handleCollectRemaining(selectedBooking)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 mb-3"
                  >
                    <DollarSign className="w-5 h-5" />
                    {language === 'ar' ? 'تحصيل باقي المبلغ بالكامل' : 'Collect Remaining Balance'}
                  </button>
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
    </div>
  );
}
