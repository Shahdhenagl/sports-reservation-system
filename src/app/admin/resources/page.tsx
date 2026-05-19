"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";
import { MapPin, Phone, Plus, Edit, Trash2, X, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResourcesPage() {
  const { language, direction } = useLanguage();
  const t = translations[language];
  const supabase = createClient();

  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase.from("branches") as any).select("*").order("created_at", { ascending: true });
      if (error) throw error;
      setBranches(data || []);

      const { data: actData } = await (supabase.from("activities") as any).select("*");
      if (actData) setActivities(actData);
    } catch (err: any) {
      console.error("Error fetching branches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleOpenAdd = () => {
    setEditingBranch(null);
    setName("");
    setAddress("");
    setPhone("");
    setModalOpen(true);
  };

  const handleOpenEdit = (branch: any) => {
    setEditingBranch(branch);
    setName(branch.name);
    setAddress(branch.address);
    setPhone(branch.phone || "");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) {
      alert(language === 'ar' ? "يرجى ملء جميع الحقول الإلزامية" : "Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      if (editingBranch) {
        // Update Branch
        const { error } = await (supabase.from("branches") as any)
          .update({
            name,
            address,
            phone: phone || null,
          })
          .eq("id", editingBranch.id);
        
        if (error) throw error;
        alert(language === 'ar' ? "تم تعديل الفرع بنجاح!" : "Branch updated successfully!");
      } else {
        // Insert Branch
        const { error } = await (supabase.from("branches") as any)
          .insert([{
            name,
            address,
            phone: phone || null,
          }]);
        
        if (error) throw error;
        alert(language === 'ar' ? "تم إضافة الفرع بنجاح!" : "Branch added successfully!");
      }

      setModalOpen(false);
      fetchBranches();
    } catch (err: any) {
      console.error("Error saving branch:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = confirm(
      language === 'ar'
        ? "هل أنت متأكد من حذف هذا الفرع؟ قد يؤدي هذا لإخفاء الملاعب المرتبطة به."
        : "Are you sure you want to delete this branch? This may affect courts associated with it."
    );
    if (!confirmDelete) return;

    try {
      const { error } = await (supabase.from("branches") as any).delete().eq("id", id);
      if (error) throw error;
      alert(language === 'ar' ? "تم حذف الفرع بنجاح!" : "Branch deleted successfully!");
      fetchBranches();
    } catch (err: any) {
      console.error("Error deleting branch:", err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6" dir={direction}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.resources}</h1>
          <p className="text-muted">{t.manageResources}</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/95"
        >
          <Plus className="h-5 w-5" />
          {language === 'ar' ? 'إضافة فرع جديد' : 'Add New Branch'}
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => {
            // Count activities in this branch
            const branchActivities = activities.filter(act => {
              if (!act.branch_ids || act.branch_ids.length === 0) return true;
              return act.branch_ids.includes(branch.id);
            });

            return (
              <div 
                key={branch.id} 
                className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200/50 dark:border-slate-800/80 shadow-md hover:shadow-xl transition-all relative overflow-hidden group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <MapPin className="h-6 w-6" />
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenEdit(branch)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-primary transition-colors"
                      title={language === 'ar' ? 'تعديل الفرع' : 'Edit Branch'}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {branch.id !== 'default-branch-id' && (
                      <button 
                        onClick={() => handleDelete(branch.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-slate-500 hover:text-red-650 transition-colors"
                        title={language === 'ar' ? 'حذف الفرع' : 'Delete Branch'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{branch.name}</h3>
                
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                  {branch.address}
                </p>

                {branch.phone && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5">
                    <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="font-mono">{branch.phone}</span>
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {branchActivities.length} {language === 'ar' ? 'أنشطة / ملاعب' : 'Activities / Courts'}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {language === 'ar' ? 'نشط' : 'Active'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-950 rounded-[2rem] p-6 shadow-2xl border border-slate-200/50 dark:border-slate-800/80 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800/60 mb-4">
              <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {editingBranch 
                  ? (language === 'ar' ? 'تعديل بيانات الفرع' : 'Edit Branch') 
                  : (language === 'ar' ? 'إضافة فرع جديد' : 'Add New Branch')}
              </h2>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-colors text-slate-400 hover:text-slate-650"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-slate-700 dark:text-slate-200">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-800 dark:text-white block">
                  {language === 'ar' ? 'اسم الفرع:' : 'Branch Name:'}
                </label>
                <input 
                  required
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'ar' ? 'فرع المهندسين' : 'Mohandessin Branch'}
                  className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-850 dark:text-white focus:ring-2 focus:ring-primary outline-none ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-800 dark:text-white block">
                  {language === 'ar' ? 'العنوان بالتفصيل:' : 'Detailed Address:'}
                </label>
                <input 
                  required
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={language === 'ar' ? '45 شارع البطل أحمد عبد العزيز، الجيزة' : '45 El Batal Ahmed Abdel Aziz St, Giza'}
                  className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-850 dark:text-white focus:ring-2 focus:ring-primary outline-none ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-800 dark:text-white block">
                  {language === 'ar' ? 'رقم الهاتف:' : 'Phone Number:'}
                </label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-850 dark:text-white focus:ring-2 focus:ring-primary outline-none text-left font-mono"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-sm font-bold"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 text-sm flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {language === 'ar' ? 'حفظ البيانات' : 'Save'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
