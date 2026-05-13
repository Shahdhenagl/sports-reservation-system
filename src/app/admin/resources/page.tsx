"use client";

import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import { MapPin, Plus } from "lucide-react";

export default function ResourcesPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.resources}</h1>
          <p className="text-muted">{t.manageResources}</p>
        </div>
        <button className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover">
          <Plus className="h-5 w-5" />
          {t.addBranch}
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder for branches */}
        <div className="glass group relative overflow-hidden rounded-2xl p-6 transition-all hover:shadow-xl border border-border/50">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MapPin className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">{t.mainBranch}</h3>
          <p className="text-sm text-muted mb-4">{t.cairoAddress}</p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
              3 {t.courtsCount}
            </span>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {t.active}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
