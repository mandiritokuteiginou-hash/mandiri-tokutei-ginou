import { SupabaseClient, User } from "@supabase/supabase-js";
import { CpmiRegistration } from "@/lib/types";

/**
 * Ensures a cpmi_registrations row exists for the given authenticated user,
 * creating one from their signup metadata on first login if needed. This
 * covers both the "email confirmation disabled" (session right after
 * signUp) and "confirmation required" (row created on first real login)
 * cases with the same code path.
 */
export async function ensureCpmiRegistration(
  supabase: SupabaseClient,
  user: User
): Promise<CpmiRegistration> {
  const { data: existing } = await supabase
    .from("cpmi_registrations")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (existing) return existing as CpmiRegistration;

  const meta = user.user_metadata ?? {};
  const { data, error } = await supabase
    .from("cpmi_registrations")
    .insert({
      auth_user_id: user.id,
      nama_lengkap: meta.nama_lengkap ?? user.email ?? "",
      nomor_hp: meta.nomor_hp ?? "",
      email: user.email,
      sektor_minat: meta.sektor_minat ?? [],
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as CpmiRegistration;
}
