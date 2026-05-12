"use client";

import { useState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Loader2, Lock, Mail } from "lucide-react";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-muted" />
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full bg-surface/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="admin@example.com"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-muted" />
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full bg-surface/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="••••••••"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
      </button>
    </form>
  );
}
