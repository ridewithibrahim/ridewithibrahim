import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n-server";
import { SettingsForm, type ProfileInitial } from "@/components/settings/settings-form";

export const metadata = { title: "Ayarlar — RideWithIbrahim" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/ayarlar");

  const lang = await getLang();

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const p = (data ?? {}) as Record<string, unknown>;

  const initial: ProfileInitial = {
    username: (p.username as string) ?? (user.user_metadata?.username as string) ?? "kullanici",
    full_name: (p.full_name as string) ?? "",
    city: (p.city as string) ?? "",
    bio: (p.bio as string) ?? "",
    avatar_url: (p.avatar_url as string) ?? null,
  };

  return (
    <main className="rf-page">
      <div className="wrap" style={{ maxWidth: 620 }}>
        <div className="rf-head">
          <span className="eyebrow">{lang === "en" ? "Account" : "Hesap"}</span>
          <h1>{lang === "en" ? "Settings" : "Ayarlar"}</h1>
          <p>{lang === "en" ? "Update your profile details and password here." : "Profil bilgilerini ve şifreni buradan güncelleyebilirsin."}</p>
        </div>
        <SettingsForm lang={lang} initial={initial} />
      </div>
    </main>
  );
}
