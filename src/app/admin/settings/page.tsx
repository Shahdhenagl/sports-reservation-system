"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import { Settings, Save, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({
    app_name: "Sports Booking",
    customer_service_phone: "",
    secondary_phone: "",
    address: "",
    instapay_id: "",
    wallet_number: "",
    deposit_enabled: true,
    min_deposit_percent: 10,
    club_logo_url: "",
  });

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await (supabase.from("app_settings") as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setSettings({
          app_name: data.app_name || "Sports Booking",
          customer_service_phone: data.customer_service_phone || "",
          secondary_phone: data.secondary_phone || "",
          address: data.address || "",
          instapay_id: data.instapay_id || "",
          wallet_number: data.wallet_number || "",
          deposit_enabled: data.deposit_enabled ?? true,
          min_deposit_percent: data.min_deposit_percent ?? 10,
          club_logo_url: data.club_logo_url || "",
        });
      }
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    try {
      const fileName = `logo_${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('club-assets')
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from('club-assets')
        .getPublicUrl(fileName);

      setSettings({ ...settings, club_logo_url: publicUrl.publicUrl });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Get the current record id if it exists
      const { data: existing, error: fetchError } = await (supabase.from("app_settings") as any)
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let result;
      if (existing) {
        result = await (supabase.from("app_settings") as any)
          .update(settings)
          .eq("id", existing.id);
      } else {
        result = await (supabase.from("app_settings") as any)
          .insert([settings]);
      }

      if (result.error) throw result.error;

      alert(language === 'ar' ? 'تم حفظ الإعدادات بنجاح ✅' : 'Settings saved ✅');
    } catch (error: any) {
      console.error("Save error:", error);
      alert(language === 'ar' ? `فشل الحفظ: ${error.message}` : `Save failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.settings}</h1>
          <p className="text-muted">{t.settingsSubtitle}</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {t.saveChanges}
        </button>
      </div>

      <div className="glass rounded-2xl p-6 sm:p-8 border border-border/50 max-w-2xl space-y-8">
        {/* Logo Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-surface border-2 border-dashed border-border flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
              {settings.club_logo_url ? (
                <img src={settings.club_logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Loader2 className="w-8 h-8 text-muted animate-pulse" />
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 bg-primary text-white p-1.5 rounded-lg cursor-pointer shadow-lg hover:scale-110 transition-transform">
              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              <Settings className="w-4 h-4" />
            </label>
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{language === 'ar' ? 'لوجو النادي' : 'Club Logo'}</h3>
            <p className="text-sm text-muted">{language === 'ar' ? 'سيظهر اللوجو في صفحة الحجز والتقارير' : 'Logo will appear on booking page and reports'}</p>
          </div>
        </div>

        {/* General Settings */}
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{language === 'ar' ? 'اسم النادي' : 'Club Name'}</label>
              <input 
                type="text" 
                value={settings.app_name}
                onChange={(e) => setSettings({...settings, app_name: e.target.value})}
                className="w-full bg-surface/50 border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {language === 'ar' ? 'رقم الهاتف الأساسي' : 'Primary Phone'}
              </label>
              <input 
                type="text" 
                value={settings.customer_service_phone}
                onChange={(e) => setSettings({...settings, customer_service_phone: e.target.value})}
                placeholder="+20 123 456 7890"
                className="w-full bg-surface/50 border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {language === 'ar' ? 'رقم الهاتف الإضافي' : 'Secondary Phone'}
              </label>
              <input 
                type="text" 
                value={settings.secondary_phone}
                onChange={(e) => setSettings({...settings, secondary_phone: e.target.value})}
                placeholder="+20 000 000 0000"
                className="w-full bg-surface/50 border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {language === 'ar' ? 'العنوان بالتفصيل' : 'Detailed Address'}
              </label>
              <input 
                type="text" 
                value={settings.address}
                onChange={(e) => setSettings({...settings, address: e.target.value})}
                placeholder={language === 'ar' ? 'مثال: شارع النيل، المعادي' : 'e.g. Nile St, Maadi'}
                className="w-full bg-surface/50 border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="pt-4 border-t border-border">
          <h3 className="text-lg font-bold text-foreground mb-4">
            {language === 'ar' ? 'إعدادات الدفع' : 'Payment Settings'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t.instaPayId}</label>
              <input 
                type="text" 
                value={settings.instapay_id}
                onChange={(e) => setSettings({...settings, instapay_id: e.target.value})}
                placeholder="user@instapay"
                className="w-full bg-surface/50 border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {language === 'ar' ? 'رقم المحفظة الإلكترونية' : 'E-Wallet Number'}
              </label>
              <input 
                type="text" 
                value={settings.wallet_number}
                onChange={(e) => setSettings({...settings, wallet_number: e.target.value})}
                placeholder="01234567890"
                className="w-full bg-surface/50 border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Booking Settings */}
        <div className="pt-4 border-t border-border">
          <h3 className="text-lg font-bold text-foreground mb-4">{t.bookingSettings}</h3>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-foreground">{t.depositRequirement}</p>
              <p className="text-sm text-muted">{t.depositSubtitle}</p>
            </div>
            <button
              onClick={() => setSettings({...settings, deposit_enabled: !settings.deposit_enabled})}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${settings.deposit_enabled ? 'bg-primary' : 'bg-border'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${settings.deposit_enabled ? (direction === 'rtl' ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'}`} />
            </button>
          </div>
          
          {settings.deposit_enabled && (
            <div className="space-y-2 mt-2">
              <label className="text-sm font-medium text-foreground">
                {language === 'ar' ? 'أقل نسبة عربون (%)' : 'Minimum Deposit (%)'}
              </label>
              <input 
                type="number" 
                min={5}
                max={100}
                value={settings.min_deposit_percent}
                onChange={(e) => setSettings({...settings, min_deposit_percent: parseInt(e.target.value) || 10})}
                className="w-full bg-surface/50 border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all max-w-xs"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
