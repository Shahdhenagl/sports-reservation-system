"use client";

import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import { Settings, Save } from "lucide-react";

export default function SettingsPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.settings}</h1>
          <p className="text-muted">{t.settingsSubtitle}</p>
        </div>
        <button className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover">
          <Save className="h-5 w-5" />
          {t.saveChanges}
        </button>
      </div>

      <div className="glass rounded-2xl p-6 sm:p-8 border border-border/50 max-w-2xl">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t.appName}</label>
              <input 
                type="text" 
                defaultValue="Sports Booking"
                className="w-full bg-surface/50 border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t.whatsappNumber}</label>
              <input 
                type="text" 
                placeholder="+20 123 456 7890"
                className="w-full bg-surface/50 border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t.instaPayId}</label>
            <input 
              type="text" 
              placeholder="user@instapay"
              className="w-full bg-surface/50 border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div className="pt-4 border-t border-border">
            <h3 className="text-lg font-bold text-foreground mb-4">{t.bookingSettings}</h3>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">{t.depositRequirement}</p>
                <p className="text-sm text-muted">{t.depositSubtitle}</p>
              </div>
              <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-primary">
                <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
