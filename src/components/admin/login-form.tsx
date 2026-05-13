"use client";

import { useState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Loader2, Lock, Mail } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { language, direction } = useLanguage();
  const t = translations[language];

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-6">
      {error && (
        <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm text-center border border-danger/20">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="email">
          {t.emailLabel}
        </label>
        <div className="relative">
          <Mail className={`absolute ${direction === 'rtl' ? 'right-3' : 'left-3'} top-3 h-5 w-5 text-muted`} />
          <input
            id="email"
            name="email"
            type="email"
            required
            className={`w-full bg-surface/50 border border-border rounded-xl py-2.5 ${direction === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
            placeholder={t.emailPlaceholder}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="password">
          {t.passwordLabel}
        </label>
        <div className="relative">
          <Lock className={`absolute ${direction === 'rtl' ? 'right-3' : 'left-3'} top-3 h-5 w-5 text-muted`} />
          <input
            id="password"
            name="password"
            type="password"
            required
            className={`w-full bg-surface/50 border border-border rounded-xl py-2.5 ${direction === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
            placeholder={t.passwordPlaceholder}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t.signIn}
      </button>
    </form>
  );
}
