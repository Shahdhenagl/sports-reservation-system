"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import { Loader2, Users, Phone, MessageCircle, X, CalendarDays, DollarSign, Search, Plus, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function CustomersPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerBookings, setCustomerBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const supabase = createClient();

  const fetchCustomers = async () => {
    setLoading(true);
    const { data } = await (supabase.from("customers") as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCustomers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openProfile = async (customer: any) => {
    setSelectedCustomer(customer);
    setLoadingBookings(true);
    
    const { data } = await (supabase.from("bookings") as any)
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });
    
    setCustomerBookings(data || []);
    setLoadingBookings(false);
  };

  const handleSaveCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      full_name: formData.get("full_name") as string,
      phone: formData.get("phone") as string,
      phone_code: formData.get("phone_code") as string || "+20",
      whatsapp: formData.get("whatsapp") as string,
      whatsapp_code: formData.get("whatsapp_code") as string || "+20",
    };

    if (editingCustomer) {
      await (supabase.from("customers") as any)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editingCustomer.id);
    } else {
      await (supabase.from("customers") as any)
        .insert([payload]);
    }

    setIsFormOpen(false);
    setEditingCustomer(null);
    fetchCustomers();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      approved: "bg-green-500/10 text-green-600 border-green-500/20",
      rejected: "bg-red-500/10 text-red-600 border-red-500/20",
    };
    const labels: Record<string, string> = {
      pending: language === 'ar' ? 'في الانتظار' : 'Pending',
      approved: language === 'ar' ? 'مقبول' : 'Approved',
      rejected: language === 'ar' ? 'مرفوض' : 'Rejected',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  };

  const filteredCustomers = customers.filter(c => 
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery) ||
    c.whatsapp?.includes(searchQuery)
  );

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {language === 'ar' ? 'العملاء' : 'Customers'}
          </h1>
          <p className="text-muted">
            {language === 'ar' ? 'إدارة بيانات العملاء وسجل الحجوزات' : 'Manage customer data and booking history'}
          </p>
        </div>
        <button
          onClick={() => { setEditingCustomer(null); setIsFormOpen(true); }}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover"
        >
          <Plus className="h-5 w-5" />
          {language === 'ar' ? 'إضافة عميل' : 'Add Customer'}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={`absolute top-1/2 -translate-y-1/2 ${direction === 'rtl' ? 'right-4' : 'left-4'} w-5 h-5 text-muted`} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === 'ar' ? 'بحث بالاسم أو رقم الهاتف...' : 'Search by name or phone...'}
          className={`w-full bg-surface/50 border border-border rounded-xl py-3 ${direction === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-foreground placeholder-muted focus:ring-2 focus:ring-primary outline-none`}
        />
      </div>

      {/* Add/Edit Customer Form */}
      {isFormOpen && (
        <div className="glass rounded-2xl p-6 border border-primary/20 animate-in fade-in zoom-in-95 duration-200">
          <form key={editingCustomer ? editingCustomer.id : 'new'} onSubmit={handleSaveCustomer} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">{language === 'ar' ? 'الاسم بالكامل' : 'Full Name'}</label>
                <input name="full_name" required defaultValue={editingCustomer?.full_name || ''} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{language === 'ar' ? 'كود الدولة (هاتف)' : 'Phone Code'}</label>
                <select name="phone_code" defaultValue={editingCustomer?.phone_code || '+20'} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none">
                  <option value="+20">+20</option>
                  <option value="+966">+966</option>
                  <option value="+971">+971</option>
                  <option value="+965">+965</option>
                  <option value="+974">+974</option>
                  <option value="+973">+973</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                <input name="phone" required defaultValue={editingCustomer?.phone || ''} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{language === 'ar' ? 'كود الدولة (واتساب)' : 'WhatsApp Code'}</label>
                <select name="whatsapp_code" defaultValue={editingCustomer?.whatsapp_code || '+20'} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none">
                  <option value="+20">+20</option>
                  <option value="+966">+966</option>
                  <option value="+971">+971</option>
                  <option value="+965">+965</option>
                  <option value="+974">+974</option>
                  <option value="+973">+973</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{language === 'ar' ? 'رقم الواتساب' : 'WhatsApp Number'}</label>
                <input name="whatsapp" required defaultValue={editingCustomer?.whatsapp || ''} className="w-full bg-surface/50 border border-border rounded-xl py-2 px-4 text-foreground focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => { setIsFormOpen(false); setEditingCustomer(null); }} className="px-4 py-2 rounded-xl text-muted hover:bg-surface transition-colors">
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button type="submit" className="px-6 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors">
                {editingCustomer ? (language === 'ar' ? 'تحديث' : 'Update') : (language === 'ar' ? 'إضافة' : 'Add')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customers Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted">
            {language === 'ar' ? 'لا يوجد عملاء' : 'No customers found'}
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div key={customer.id} className="glass group relative overflow-hidden rounded-2xl p-6 transition-all hover:shadow-xl border border-border/50 cursor-pointer" onClick={() => openProfile(customer)}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingCustomer(customer); setIsFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="p-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 rounded-lg"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              <h3 className="text-lg font-bold text-foreground">{customer.full_name}</h3>
              <div className="mt-3 space-y-2 text-sm text-muted">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{customer.phone_code}{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>{customer.whatsapp_code}{customer.whatsapp}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex justify-between text-sm">
                <span className="text-muted">{language === 'ar' ? 'إجمالي المدفوعات' : 'Total Paid'}</span>
                <span className="font-bold text-primary">EGP {customer.total_payments || 0}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer Profile Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" dir={direction}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-xl font-bold text-foreground">
                {language === 'ar' ? 'ملف العميل' : 'Customer Profile'}
              </h3>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 text-muted hover:text-foreground hover:bg-surface-hover rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary flex-shrink-0">
                  <Users className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-foreground">{selectedCustomer.full_name}</h4>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted">
                    <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {selectedCustomer.phone_code}{selectedCustomer.phone}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {selectedCustomer.whatsapp_code}{selectedCustomer.whatsapp}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                  <CalendarDays className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{customerBookings.length}</p>
                  <p className="text-xs text-muted">{language === 'ar' ? 'إجمالي الحجوزات' : 'Total Bookings'}</p>
                </div>
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 text-center">
                  <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">EGP {selectedCustomer.total_payments || 0}</p>
                  <p className="text-xs text-muted">{language === 'ar' ? 'إجمالي المدفوعات' : 'Total Payments'}</p>
                </div>
              </div>

              {/* Booking History */}
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-foreground">
                  {language === 'ar' ? 'سجل الحجوزات' : 'Booking History'}
                </h5>
                {loadingBookings ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ) : customerBookings.length === 0 ? (
                  <p className="text-center text-muted py-6 text-sm">{language === 'ar' ? 'لا توجد حجوزات' : 'No bookings yet'}</p>
                ) : (
                  customerBookings.map((booking) => (
                    <div key={booking.id} className="bg-surface/50 border border-border rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-primary text-sm">{booking.booking_ref}</span>
                          {getStatusBadge(booking.status)}
                        </div>
                        <p className="text-sm text-muted mt-1">{booking.activity_name} • {booking.booking_date} • {booking.booking_time}</p>
                      </div>
                      <span className="text-sm font-bold text-foreground whitespace-nowrap">EGP {booking.total_price || 0}</span>
                    </div>
                  ))
                )}
              </div>

              {/* WhatsApp Contact */}
              <button
                onClick={() => {
                  const whatsappNum = `${selectedCustomer.whatsapp_code || '+20'}${selectedCustomer.whatsapp}`.replace('+', '');
                  window.open(`https://wa.me/${whatsappNum}`, '_blank');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                {language === 'ar' ? 'تواصل عبر واتساب' : 'Contact on WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
