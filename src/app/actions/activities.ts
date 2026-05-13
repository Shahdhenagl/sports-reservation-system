"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addActivityAction(formData: FormData) {
  try {
    const supabase = await createClient();
    
    const name_ar = formData.get("name_ar") as string;
    const name_en = formData.get("name_en") as string;
    const icon_name = formData.get("icon_name") as string || "Trophy";

    console.log("Adding activity:", { name_ar, name_en, icon_name });

    const { error } = await (supabase
      .from("activities") as any)
      .insert([{ name_ar, name_en, icon_name }]);

    if (error) {
      console.error("Supabase error adding activity:", error);
      return { error: error.message };
    }

    revalidatePath("/admin/activities");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Server Action Error (addActivity):", err);
    return { error: err.message || "An unexpected server error occurred" };
  }
}

export async function deleteActivityAction(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await (supabase
      .from("activities") as any)
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase error deleting activity:", error);
      return { error: error.message };
    }

    revalidatePath("/admin/activities");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Server Action Error (deleteActivity):", err);
    return { error: err.message || "An unexpected server error occurred" };
  }
}
